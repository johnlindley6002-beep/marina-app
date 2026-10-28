// @vitest-environment node
//
// Runs supabase/seed.sql on top of the real migrations (in-process Postgres)
// and checks that every screen has something to show: the sample users, a berth
// holder of G-14, requests in every status and an approved relet offer. Also
// that the seed can run twice.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { asUser, createMigratedDb } from "../helpers/pg";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 240_000 });

const SEED = readFileSync(join(process.cwd(), "supabase", "seed.sql"), "utf8");

// The ids the generator gives the sample users (data/supabase/seedSql.ts).
const ALEX = "00000000-0000-4000-8000-900000000001";
const INES = "00000000-0000-4000-8000-900000000002";
const MARC = "00000000-0000-4000-8000-900000000003";
const LENA = "00000000-0000-4000-8000-900000000004";
const JORDAN = "00000000-0000-4000-8000-900000000010";
const SAM = "00000000-0000-4000-8000-900000000011";

let db: PGlite;

const count = async (sql: string): Promise<number> =>
  Number(
    (
      (await db.query<{ n: number }>(`select count(*)::int as n from ${sql}`)).rows[0] as {
        n: number;
      }
    ).n
  );

beforeAll(async () => {
  db = await createMigratedDb();
  await db.exec(SEED);
});

afterAll(async () => {
  await db.close();
});

describe("the seed", () => {
  it("creates the six sample users, each with a profile", async () => {
    expect(await count("auth.users")).toBe(6);
    expect(await count("public.profiles")).toBe(6);
    const alex = await db.query(
      `select full_name, nationality, eu_status from public.profiles where user_id = '${ALEX}'`
    );
    expect(alex.rows).toEqual([
      { full_name: "Alex Morgan", nationality: "United Kingdom", eu_status: "non_eu" },
    ]);
  });

  it("lets only the three persona accounts sign in with the dev password", async () => {
    const rows = await db.query<{ email: string; usable: boolean }>(
      `select email, encrypted_password <> '' as usable from auth.users order by email`
    );
    expect(rows.rows.filter((r) => r.usable).map((r) => r.email)).toEqual([
      "alex.morgan@example.com",
      "jordan.reyes@example.com",
      "sam.okafor@example.com",
    ]);
    const match = await db.query<{ ok: boolean }>(
      `select encrypted_password = extensions.crypt('aldock-dev-only', encrypted_password) as ok
       from auth.users where id = '${JORDAN}'`
    );
    expect(match.rows[0]?.ok).toBe(true);
  });

  it("makes Sam staff of Cascais and Jordan the holder of G-14", async () => {
    expect(
      await count(`public.staff_members where user_id = '${SAM}' and marina_id = 'cascais'`)
    ).toBe(1);
    const holding = await asUser<{ code: string }>(
      db,
      JORDAN,
      "select b.code from public.berth_contracts c join public.berths b on b.id = c.berth_id where c.starts_on <= public.lisbon_today() and c.ends_on >= public.lisbon_today()"
    );
    expect(holding).toEqual([{ code: "G-14" }]);
  });

  it("gives guests their own boats and nobody else's", async () => {
    expect(await asUser(db, ALEX, "select name from public.boats")).toEqual([
      { name: "Wind Song" },
    ]);
    expect(await asUser(db, INES, "select name from public.boats")).toEqual([{ name: "Kestrel" }]);
  });

  it("has requests in every status for the guests to see", async () => {
    const status = async (user: string) =>
      (
        await asUser<{ display_status: string }>(
          db,
          user,
          "select display_status from public.my_arrivals order by display_status"
        )
      ).map((r) => r.display_status);
    expect(await status(ALEX)).toEqual(["dates_proposed", "departed", "requested"]);
    expect(await status(INES)).toEqual(["confirmed"]);
    expect(await status(MARC)).toEqual(["arrived"]);
    expect(await status(LENA)).toEqual(["declined"]);
  });

  it("shows a confirmed guest their berth and an arrived guest theirs", async () => {
    expect(await asUser(db, INES, "select berth_code from public.my_arrivals")).toEqual([
      { berth_code: "P-2" },
    ]);
    expect(await asUser(db, MARC, "select berth_code from public.my_arrivals")).toEqual([
      { berth_code: "P-4" },
    ]);
  });

  it("has an approved relet offer for G-14 that makes it a suggested berth", async () => {
    const offers = await db.query<{ status: string }>(
      `select o.status from public.relet_offers o join public.berths b on b.id = o.berth_id
       where b.code = 'G-14' and o.user_id = '${JORDAN}' and o.status = 'approved'`
    );
    expect(offers.rows.length).toBeGreaterThan(0);

    // A request of Alex's, moved to the days Jordan is away (nights 3 to 9),
    // is offered G-14 because the approved offer covers every night, even
    // though many free berths fit the boat too.
    await db.exec(
      `update public.arrivals set expected_arrival = public.lisbon_today() + 4,
         departure = public.lisbon_today() + 7, length_m = 7.5, beam_m = 2.8, draft_m = 1.4
       where id = (select id from public.arrivals where boat_name = 'Wind Song' and status = 'new')`
    );
    const arrival = await db.query<{ id: string }>(
      "select id from public.arrivals where boat_name = 'Wind Song' and status = 'new'"
    );
    const codes = await asUser<{ code: string; via_relet: boolean }>(
      db,
      SAM,
      `select code, via_relet from public.suggest_berths('${arrival.rows[0]?.id}') where code = 'G-14'`
    );
    expect(codes).toEqual([{ code: "G-14", via_relet: true }]);
  });

  it("lets the staff member see the whole marina and records history", async () => {
    expect(await asUser(db, SAM, "select count(*)::int as n from public.arrivals")).toEqual([
      { n: 9 },
    ]);
    expect(await count("public.berth_events")).toBeGreaterThan(8);
  });

  it("can run twice without changing anything", async () => {
    const before = [
      await count("public.arrivals"),
      await count("public.boats"),
      await count("public.profiles"),
      await count("public.berth_contracts"),
      await count("public.relet_offers"),
    ];
    // A real run is a new session; pglite keeps the seed's temporary helpers.
    await db.exec("drop function pg_temp.d(integer); drop function pg_temp.ts(integer, text);");
    await db.exec(SEED);
    const after = [
      await count("public.arrivals"),
      await count("public.boats"),
      await count("public.profiles"),
      await count("public.berth_contracts"),
      await count("public.relet_offers"),
    ];
    expect(after).toEqual(before);
  });
});
