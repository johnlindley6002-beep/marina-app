// @vitest-environment node
//
// Staff roles and the dock team's jobs, on an in-process Postgres (pglite)
// with the real migrations: each role can do only what its capabilities
// allow, a marinheiro never reads contacts or documents, a dockmaster cannot
// create a director, an expired or deactivated account has no access at all,
// booked help follows the arrival, and the double booking rule still holds.

import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { asUser, createMigratedDb, errorAsUser } from "../helpers/pg";

vi.setConfig({ testTimeout: 30_000, hookTimeout: 180_000 });

const id = (n: number) => `00000000-0000-4000-8000-0000000001${String(n).padStart(2, "0")}`;
const DIRECTOR = id(1);
const DOCKMASTER = id(2);
const RECEPTION = id(3);
const MARINHEIRO = id(4);
const LEAD = id(5);
const NIGHT = id(6);
const SEASONAL = id(7);
const GUEST = id(8);
const PLATFORM = id(9);
const NEWCOMER = id(10);
const DIRECTOR_2 = id(11);

let db: PGlite;
const as = <T = Record<string, unknown>>(user: string, sql: string) => asUser<T>(db, user, sql);
const asError = (user: string, sql: string) => errorAsUser(db, user, sql);
const one = async <T>(sql: string): Promise<T> => (await db.query<T>(sql)).rows[0] as T;
const member = async (user: string) =>
  (await one<{ id: string }>(`select id from public.staff_members where user_id = '${user}'`)).id;
const count = async (user: string, table: string) =>
  Number((await as<{ n: number }>(user, `select count(*)::int as n from public.${table}`))[0]!.n);

let arrival: string;
let job: string;

beforeAll(async () => {
  db = await createMigratedDb();
  await db.exec(`
    insert into public.marinas (id, name, location) values ('cascais', 'Marina de Cascais', 'Cascais');
    insert into public.berths (marina_id, code, pontoon, class, max_length_m, beam_m, draft_m) values
      ('cascais', 'G-14', 'G', 'III', 10, 3.5, 2.5),
      ('cascais', 'P-1', 'P', 'V', 14, 4.5, 3);
    insert into auth.users (id, email) values
      ('${DIRECTOR}', 'director@example.com'), ('${DOCKMASTER}', 'dock@example.com'),
      ('${RECEPTION}', 'desk@example.com'), ('${MARINHEIRO}', 'rui@example.com'),
      ('${LEAD}', 'lead@example.com'), ('${NIGHT}', 'night@example.com'),
      ('${SEASONAL}', 'summer@example.com'), ('${GUEST}', 'ana@example.com'),
      ('${PLATFORM}', 'platform@example.com'), ('${DIRECTOR_2}', 'director2@example.com');
    insert into public.staff_members (user_id, marina_id, role, team_lead, access_until) values
      ('${DIRECTOR}', 'cascais', 'director', false, null),
      ('${DOCKMASTER}', 'cascais', 'dockmaster', false, null),
      ('${RECEPTION}', 'cascais', 'reception', false, null),
      ('${MARINHEIRO}', 'cascais', 'marinheiro', false, null),
      ('${LEAD}', 'cascais', 'marinheiro', true, null),
      ('${NIGHT}', 'cascais', 'night_watch', false, null),
      ('${SEASONAL}', 'cascais', 'marinheiro', false, public.lisbon_today() - 1);
    insert into public.platform_admins (user_id) values ('${PLATFORM}');
    insert into public.boats (user_id, name, length_m, beam_m, draft_m) values ('${GUEST}', 'Kestrel', 13, 3.4, 1.6);
    insert into public.customers (marina_id, kind, full_name, email, phone)
      values ('cascais', 'guest', 'Ana Lopes', 'ana@example.com', '+351 900 000 000');
    insert into public.customer_documents (marina_id, customer_id, kind, reference)
      select 'cascais', id, 'passport', 'P1234567' from public.customers;
  `);
  const boat = await one<{ id: string }>("select id from public.boats where name = 'Kestrel'");
  arrival = (
    await as<{ id: string }>(
      GUEST,
      `select public.request_arrival('cascais', '${boat.id}', jsonb_build_object(
         'expected_arrival', public.lisbon_today()::text, 'departure', (public.lisbon_today() + 3)::text,
         'eta', '15:00', 'phone', '+351 900 000 000')) as id`
    )
  )[0]!.id;
});

afterAll(async () => {
  await db.close();
});

describe("migrated members", () => {
  it("has the five roles and no admin or staff left", async () => {
    const roles = await db.query<{ role: string }>(
      "select distinct role from public.role_capabilities order by 1"
    );
    expect(roles.rows.map((r) => r.role)).toEqual([
      "director",
      "dockmaster",
      "marinheiro",
      "night_watch",
      "reception",
    ]);
  });

  it("gives a team lead marinheiro assign_jobs and a plain one not", async () => {
    const lead = await as<{ c: string[] }>(
      LEAD,
      "select capabilities as c from public.my_staff_access()"
    );
    const plain = await as<{ c: string[] }>(
      MARINHEIRO,
      "select capabilities as c from public.my_staff_access()"
    );
    expect(lead[0]!.c).toEqual(["assign_jobs", "claim_jobs", "radio_log", "view_own_shifts"]);
    expect(plain[0]!.c).toEqual(["claim_jobs", "radio_log", "view_own_shifts"]);
  });
});

describe("what each role can read", () => {
  it("a marinheiro sees no contact details, documents, customers or arrivals", async () => {
    expect(await count(MARINHEIRO, "arrivals")).toBe(0);
    expect(await count(MARINHEIRO, "customers")).toBe(0);
    expect(await count(MARINHEIRO, "customer_documents")).toBe(0);
    expect(await count(MARINHEIRO, "berth_contracts")).toBe(0);
  });

  it("the night watch sees no contact details or documents either", async () => {
    expect(await count(NIGHT, "arrivals")).toBe(0);
    expect(await count(NIGHT, "customer_documents")).toBe(0);
  });

  it("reception reads arrivals, customers and documents", async () => {
    expect(await count(RECEPTION, "arrivals")).toBe(1);
    expect(await count(RECEPTION, "customers")).toBe(1);
    expect(await count(RECEPTION, "customer_documents")).toBe(1);
  });
});

describe("booked help follows the arrival", () => {
  it("is inactive until staff confirm, then on the berth at the arrival time", async () => {
    await as(GUEST, `select public.book_arrival_help('${arrival}', 'short_handed', '')`);
    const pending = await one<{
      status: string;
      people_needed: number;
      job_type: string;
      id: string;
    }>(
      `select id, status, people_needed, job_type from public.dock_tasks where arrival_id = '${arrival}'`
    );
    // A 13 m boat needs two people.
    expect(pending).toMatchObject({ status: "pending", people_needed: 2, job_type: "arrival" });
    job = pending.id;

    expect(
      await asError(
        MARINHEIRO,
        `select public.confirm_arrival('${arrival}', (select id from public.berths where code = 'P-1'))`
      )
    ).toMatch(/not_allowed/);
    await as(
      RECEPTION,
      `select public.confirm_arrival('${arrival}', (select id from public.berths where code = 'P-1'))`
    );
    const active = await one<{ status: string; code: string }>(
      `select t.status, b.code from public.dock_tasks t join public.berths b on b.id = t.berth_id where t.id = '${job}'`
    );
    expect(active).toEqual({ status: "to_do", code: "P-1" });
  });

  it("a guest sees their own booking and not the berth", async () => {
    const mine = await as<{ display_status: string; berth_code: string | null }>(
      GUEST,
      "select display_status, berth_code from public.my_help_bookings"
    );
    expect(mine).toEqual([{ display_status: "booked", berth_code: null }]);
    expect(await count(GUEST, "dock_tasks")).toBe(0);
  });

  it("running late moves the job and the arrival time", async () => {
    await as(
      GUEST,
      `select public.report_running_late('${job}', public.lisbon_at(public.lisbon_today() + 1, '17:30'))`
    );
    const eta = await one<{ eta: string }>(
      `select eta::text from public.arrivals where id = '${arrival}'`
    );
    expect(eta.eta).toBe("17:30:00");
  });

  it("the night watch sees tonight's boats by name, size and berth only", async () => {
    const rows = await as<Record<string, unknown>>(
      NIGHT,
      "select * from public.tonight_movements('cascais')"
    );
    expect(Object.keys(rows[0] ?? {}).sort()).toEqual(
      [
        "arrival_id",
        "arrival_status",
        "at_time",
        "beam_m",
        "berth_code",
        "boat_name",
        "kind",
        "length_m",
      ].sort()
    );
  });
});

describe("jobs by capability", () => {
  it("a marinheiro claims and completes; reception cannot plan the day", async () => {
    await as(MARINHEIRO, `select public.claim_job('${job}')`);
    expect(
      await asError(RECEPTION, `select public.update_job('${job}', '{"people_needed": 3}')`)
    ).toMatch(/not_allowed/);
    await as(DOCKMASTER, `select public.update_job('${job}', '{"people_needed": 3}')`);
    await as(MARINHEIRO, `select public.complete_job('${job}')`);
    expect(
      (await one<{ status: string }>(`select status from public.dock_tasks where id = '${job}'`))
        .status
    ).toBe("done");
  });

  it("only a team lead or the dockmaster assigns jobs, and the assignee gets an alert", async () => {
    const created = (
      await as<{ id: string }>(
        RECEPTION,
        `select public.create_job('cascais', '{"job_type": "power", "berth_code": "g-14"}') as id`
      )
    )[0]!.id;
    const rui = await member(MARINHEIRO);
    expect(await asError(MARINHEIRO, `select public.assign_job('${created}', '${rui}')`)).toMatch(
      /not_allowed/
    );
    await as(LEAD, `select public.assign_job('${created}', '${rui}')`);
    expect(await count(MARINHEIRO, "staff_alerts")).toBe(1);
    expect(await count(LEAD, "staff_alerts")).toBe(0);
  });

  it("the night watch creates jobs; a marinheiro cannot", async () => {
    expect(
      await asError(MARINHEIRO, `select public.create_job('cascais', '{"job_type": "other"}')`)
    ).toMatch(/not_allowed/);
    expect(
      await asError(
        NIGHT,
        `select public.create_job('cascais', '{"job_type": "other", "source": "vhf"}')`
      )
    ).toBe("");
  });
});

describe("who controls access", () => {
  it("a dockmaster cannot create a director, dockmaster or reception", async () => {
    for (const role of ["director", "dockmaster", "reception"]) {
      expect(
        await asError(
          DOCKMASTER,
          `select public.invite_staff('cascais', 'x@example.com', '${role}')`
        )
      ).toMatch(/not_allowed/);
    }
    expect(
      (
        await as<{ r: string }>(
          DOCKMASTER,
          "select public.invite_staff('cascais', 'new@example.com', 'marinheiro') as r"
        )
      )[0]!.r
    ).toBe("invited");
  });

  it("a dockmaster cannot change reception or make a marinheiro a director", async () => {
    const desk = await member(RECEPTION);
    const rui = await member(MARINHEIRO);
    expect(
      await asError(DOCKMASTER, `select public.update_staff_member('${desk}', '{"active": false}')`)
    ).toMatch(/not_allowed/);
    expect(
      await asError(
        DOCKMASTER,
        `select public.update_staff_member('${rui}', '{"role": "director"}')`
      )
    ).toMatch(/not_allowed/);
    expect(
      await asError(
        DOCKMASTER,
        `select public.update_staff_member('${rui}', '{"team_lead": true}')`
      )
    ).toBe("");
  });

  it("nobody changes their own membership", async () => {
    const me = await member(DIRECTOR);
    expect(
      await asError(DIRECTOR, `select public.update_staff_member('${me}', '{"role": "reception"}')`)
    ).toMatch(/not_yourself/);
  });

  it("an invited person becomes a member at their first sign-in", async () => {
    await db.exec(`insert into auth.users (id, email) values ('${NEWCOMER}', 'NEW@example.com')`);
    const rows = await as<{ role: string }>(NEWCOMER, "select role from public.my_staff_access()");
    expect(rows).toEqual([{ role: "marinheiro" }]);
  });

  it("deactivating a marinheiro takes away access at once", async () => {
    const rui = await member(MARINHEIRO);
    expect(await count(MARINHEIRO, "dock_tasks")).toBeGreaterThan(0);
    await as(DIRECTOR, `select public.update_staff_member('${rui}', '{"active": false}')`);
    expect(await count(MARINHEIRO, "dock_tasks")).toBe(0);
    expect(await asError(MARINHEIRO, `select public.claim_job('${job}')`)).toMatch(/not_allowed/);
  });

  it("an expired seasonal account has no access", async () => {
    expect(await as(SEASONAL, "select * from public.my_staff_access()")).toEqual([]);
    expect(await count(SEASONAL, "dock_tasks")).toBe(0);
    expect(await count(SEASONAL, "radio_log")).toBe(0);
  });

  it("the last active director stays", async () => {
    await db.exec(
      `insert into public.staff_members (user_id, marina_id, role) values ('${DIRECTOR_2}', 'cascais', 'director')`
    );
    const first = await member(DIRECTOR);
    // Director 2 may step director 1 down while director 2 remains.
    await as(DIRECTOR_2, `select public.update_staff_member('${first}', '{"role": "dockmaster"}')`);
    const second = await member(DIRECTOR_2);
    // Director 1 is now a dockmaster and may not touch a director.
    expect(
      await asError(DIRECTOR, `select public.update_staff_member('${second}', '{"active": false}')`)
    ).toMatch(/not_allowed/);
  });

  it("logs every change, and only directors read the log", async () => {
    expect(await count(DIRECTOR_2, "staff_audit_log")).toBeGreaterThanOrEqual(4);
    expect(await count(RECEPTION, "staff_audit_log")).toBe(0);
  });

  it("only a platform admin creates a first director, and reads nothing else", async () => {
    await db.exec(
      `insert into public.marinas (id, name, location) values ('lagos', 'Marina de Lagos', 'Lagos')`
    );
    expect(
      await asError(
        DOCKMASTER,
        "select public.platform_create_director('lagos', 'boss@example.com')"
      )
    ).toMatch(/not_allowed/);
    expect(
      (
        await as<{ r: string }>(
          PLATFORM,
          "select public.platform_create_director('lagos', 'boss@example.com') as r"
        )
      )[0]!.r
    ).toBe("invited");
    expect(await count(PLATFORM, "arrivals")).toBe(0);
    expect(await count(PLATFORM, "dock_tasks")).toBe(0);
  });
});

describe("slot busyness for boaters", () => {
  it("is busy when the people booked reach the marinheiros on shift, and suggests quieter slots", async () => {
    const lead = await member(LEAD);
    await db.exec(`
      insert into public.shifts (marina_id, member_id, day, starts_at, ends_at)
        values ('cascais', '${lead}', public.lisbon_today() + 1, '08:00', '18:00');
      insert into public.dock_tasks (marina_id, due_at, status, job_type, people_needed)
        values ('cascais', public.lisbon_at(public.lisbon_today() + 1, '10:00'), 'to_do', 'arrival', 1);
    `);
    const busy = await as<{ b: { busy: boolean; quieter: string[] } }>(
      GUEST,
      "select public.slot_busyness('cascais', public.lisbon_at(public.lisbon_today() + 1, '10:10')) as b"
    );
    expect(busy[0]!.b.busy).toBe(true);
    expect(busy[0]!.b.quieter.length).toBe(3);
    const free = await as<{ b: { busy: boolean } }>(
      GUEST,
      "select public.slot_busyness('cascais', public.lisbon_at(public.lisbon_today() + 1, '11:00')) as b"
    );
    expect(free[0]!.b.busy).toBe(false);
  });
});

describe("no double booking", () => {
  it("still refuses two confirmed stays on one berth", async () => {
    await db.exec(`
      insert into public.arrivals (marina_id, status, expected_arrival, departure, boat_name)
      values ('cascais', 'new', public.lisbon_today() + 1, public.lisbon_today() + 2, 'Second');
    `);
    const second = await one<{ id: string }>(
      "select id from public.arrivals where boat_name = 'Second'"
    );
    const message = await asError(
      DOCKMASTER,
      `select public.confirm_arrival('${second.id}', (select id from public.berths where code = 'P-1'))`
    );
    expect(message).toMatch(/berth_not_available|arrivals_no_double_booking/);
  });
});
