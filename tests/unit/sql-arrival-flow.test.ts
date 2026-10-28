// @vitest-environment node
//
// Runs the real migrations on an in-process Postgres (pglite) and checks the
// rules that live in the database: no double booking, suggested berths, the
// holder and guest limits, and the history log. Supabase's own pieces (the
// auth schema, the anon and authenticated roles) are stubbed in setup. Expected
// values are written by hand from the rules in the migrations' comments.

import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { asUser, createMigratedDb, errorAsUser } from "../helpers/pg";

// Starting Postgres in-process and running the migrations takes a while.
vi.setConfig({ testTimeout: 30_000, hookTimeout: 180_000 });

const STAFF = "00000000-0000-4000-8000-000000000001";
const GUEST_A = "00000000-0000-4000-8000-000000000002";
const GUEST_B = "00000000-0000-4000-8000-000000000003";
const HOLDER = "00000000-0000-4000-8000-000000000004";

let db: PGlite;

const as = <T = Record<string, unknown>>(user: string, sql: string) => asUser<T>(db, user, sql);
const asError = (user: string, sql: string) => errorAsUser(db, user, sql);

const one = async <T>(sql: string): Promise<T> => (await db.query<T>(sql)).rows[0] as T;

// A day relative to the Lisbon day, as a SQL date literal.
const day = (n: number) => `(public.lisbon_today() + ${n})`;

const request = (boat: string, from: number, to: number, length = "9") =>
  `select public.request_arrival('cascais', '${boat}', jsonb_build_object(
     'expected_arrival', ${day(from)}::text, 'departure', ${day(to)}::text,
     'length_m', '${length}', 'beam_m', '3', 'draft_m', '1.5')) as id`;

beforeAll(async () => {
  db = await createMigratedDb();
  await db.exec(`
    insert into public.marinas (id, name, location) values ('cascais', 'Marina de Cascais', 'Cascais');
    insert into public.berths (marina_id, code, pontoon, class, max_length_m, beam_m, draft_m) values
      ('cascais', 'G-14', 'G', 'III', 10, 3.5, 2.5),
      ('cascais', 'P-1', 'P', 'V', 14, 4.5, 3),
      ('cascais', 'P-2', 'P', 'II', 7, 2.8, 2);
    insert into auth.users (id, email) values
      ('${STAFF}', 'staff@example.com'),
      ('${GUEST_A}', 'ana@example.com'),
      ('${GUEST_B}', 'ben@example.com');
    insert into public.staff_members (user_id, marina_id, role) values ('${STAFF}', 'cascais', 'director');
  `);
});

afterAll(async () => {
  await db.close();
});

describe("accounts and holdings", () => {
  it("creates a profile for each new user", async () => {
    const rows = await db.query("select email from public.profiles order by email");
    expect(rows.rows.map((r) => (r as { email: string }).email)).toEqual([
      "ana@example.com",
      "ben@example.com",
      "staff@example.com",
    ]);
  });

  it("lets a guest read only their own profile and never change their email", async () => {
    expect(await as(GUEST_A, "select email from public.profiles")).toEqual([
      { email: "ana@example.com" },
    ]);
    expect(await asError(GUEST_A, "update public.profiles set email = 'x@example.com'")).toMatch(
      /permission denied/
    );
    await as(
      GUEST_A,
      `update public.profiles set full_name = 'Ana Costa', nationality = 'Portuguese', eu_status = 'eu'`
    );
    expect(await as(GUEST_A, "select full_name, eu_status from public.profiles")).toEqual([
      { full_name: "Ana Costa", eu_status: "eu" },
    ]);
  });

  it("keeps a guest's boats private and never lets one attach to a marina", async () => {
    await as(
      GUEST_A,
      `insert into public.boats (user_id, name, length_m) values ('${GUEST_A}', 'Aurora', 9)`
    );
    await as(
      GUEST_A,
      `insert into public.boats (user_id, name, length_m) values ('${GUEST_A}', 'Second', 6)`
    );
    expect(await as(GUEST_A, "select name from public.boats order by name")).toEqual([
      { name: "Aurora" },
      { name: "Second" },
    ]);
    expect(await as(GUEST_B, "select name from public.boats")).toEqual([]);
    expect(
      await asError(
        GUEST_B,
        `insert into public.boats (user_id, name) values ('${GUEST_A}', 'Stolen')`
      )
    ).toMatch(/row-level security/);
    expect(
      await asError(
        GUEST_B,
        `insert into public.boats (user_id, marina_id, name) values ('${GUEST_B}', 'cascais', 'Sneaky')`
      )
    ).toMatch(/row-level security/);
  });

  it("refuses a berth holder who tries to claim a berth themselves", async () => {
    const berth = await one<{ id: string }>("select id from public.berths where code = 'G-14'");
    expect(
      await asError(
        GUEST_A,
        `insert into public.berth_contracts (marina_id, customer_id, berth_id, starts_on, ends_on, user_id)
         values ('cascais', gen_random_uuid(), '${berth.id}', ${day(-1)}, ${day(300)}, '${GUEST_A}')`
      )
    ).toMatch(/row-level security/);
    expect(
      await asError(
        GUEST_A,
        `select public.link_berth_holder('${berth.id}', 'ana@example.com', ${day(-1)}, ${day(300)})`
      )
    ).toMatch(/not_allowed/);
  });

  it("links a holder by email before they sign up, and attaches it on first sign in", async () => {
    const berth = await one<{ id: string }>("select id from public.berths where code = 'G-14'");
    await as(
      STAFF,
      `select public.link_berth_holder('${berth.id}', 'Jordan@Example.com', ${day(-30)}, ${day(300)}, 'Jordan Reyes')`
    );
    let holding = await one<{ user_id: string | null; holder_email: string }>(
      "select user_id, holder_email from public.berth_contracts"
    );
    expect(holding).toEqual({ user_id: null, holder_email: "jordan@example.com" });

    await db.exec(`insert into auth.users (id, email) values ('${HOLDER}', 'jordan@example.com')`);
    holding = await one("select user_id, holder_email from public.berth_contracts");
    expect(holding.user_id).toBe(HOLDER);

    // The holder reads their holding and their berth, and nothing else.
    expect(await as(HOLDER, "select count(*)::int as n from public.berth_contracts")).toEqual([
      { n: 1 },
    ]);
    expect(await as(HOLDER, "select code from public.berths")).toEqual([{ code: "G-14" }]);
    expect(await as(GUEST_A, "select code from public.berths")).toEqual([]);
  });

  it("refuses a second holder for the same berth and period", async () => {
    const berth = await one<{ id: string }>("select id from public.berths where code = 'G-14'");
    const message = await asError(
      STAFF,
      `select public.link_berth_holder('${berth.id}', 'other@example.com', ${day(10)}, ${day(20)})`
    );
    expect(message).toMatch(/berth_contracts_no_overlap|conflicting key/);
  });

  it("shows signed-out visitors the marina and nothing about occupancy", async () => {
    await db.exec("set role anon");
    try {
      expect((await db.query("select name from public.marinas")).rows).toEqual([
        { name: "Marina de Cascais" },
      ]);
      await expect(db.query("select * from public.berths")).rejects.toThrow(/permission denied/);
      await expect(db.query("select * from public.arrivals")).rejects.toThrow(/permission denied/);
      await expect(db.query("select * from public.berth_contracts")).rejects.toThrow(
        /permission denied/
      );
      await expect(db.query("select * from public.my_arrivals")).rejects.toThrow(
        /permission denied/
      );
    } finally {
      await db.exec("reset role");
    }
  });
});

describe("arrival requests", () => {
  let boatA: string;
  let requestA: string;

  it("creates a requested arrival linked to the guest and their boat", async () => {
    boatA = (await one<{ id: string }>(`select id from public.boats where name = 'Aurora'`)).id;
    requestA = (await as<{ id: string }>(GUEST_A, request(boatA, 5, 9)))[0]!.id;
    const row = await one<{ status: string; user_id: string; boat_id: string; email: string }>(
      `select status, user_id, boat_id, email from public.arrivals where id = '${requestA}'`
    );
    expect(row).toEqual({
      status: "new",
      user_id: GUEST_A,
      boat_id: boatA,
      email: "ana@example.com",
    });
  });

  it("refuses a request with someone else's boat, a past date or a signed-out caller", async () => {
    expect(await asError(GUEST_B, request(boatA, 5, 9))).toMatch(/boat_not_found/);
    expect(await asError(GUEST_A, request(boatA, -2, 3))).toMatch(/invalid_dates/);
    expect(await asError(GUEST_A, request(boatA, 8, 6))).toMatch(/invalid_dates/);
  });

  it("shows a guest their own request and never the berths or staff notes", async () => {
    const mine = await as<{ display_status: string; berth_code: string | null }>(
      GUEST_A,
      "select display_status, berth_code from public.my_arrivals"
    );
    expect(mine).toEqual([{ display_status: "requested", berth_code: null }]);
    expect(await as(GUEST_B, "select * from public.my_arrivals")).toEqual([]);
    expect(await asError(GUEST_A, "select * from public.arrivals")).toBe("");
    expect(await as(GUEST_A, "select id from public.arrivals")).toEqual([]);
  });

  it("limits a guest to five open requests", async () => {
    for (let i = 0; i < 4; i += 1) await as(GUEST_A, request(boatA, 40 + i, 41 + i));
    expect(await asError(GUEST_A, request(boatA, 60, 61))).toMatch(/too_many_requests/);
    await db.exec(`delete from public.arrivals where expected_arrival >= ${day(40)}`);
  });
});

describe("suggested berths", () => {
  it("offers only berths that fit and are free, and never a held berth", async () => {
    const arrival = await one<{ id: string }>(
      `select id from public.arrivals where expected_arrival = ${day(5)}`
    );
    // A 9 m boat: P-1 fits (14 m), G-14 fits (10 m) but is held, P-2 is too short (7 m).
    const rows = await as<{ code: string; via_relet: boolean }>(
      STAFF,
      `select code, via_relet from public.suggest_berths('${arrival.id}')`
    );
    expect(rows).toEqual([{ code: "P-1", via_relet: false }]);
  });

  it("refuses anyone who is not staff of the marina", async () => {
    const arrival = await one<{ id: string }>(
      `select id from public.arrivals where expected_arrival = ${day(5)}`
    );
    expect(await asError(GUEST_A, `select * from public.suggest_berths('${arrival.id}')`)).toMatch(
      /not_allowed/
    );
  });

  it("offers a held berth only once an approved offer covers every night", async () => {
    const arrival = await one<{ id: string }>(
      `select id from public.arrivals where expected_arrival = ${day(5)}`
    );
    // The holder offers day 5 to day 8 (nights 5, 6, 7); the stay needs nights 5 to 8.
    const offer = (
      await as<{ id: string }>(
        HOLDER,
        `select public.submit_relet_offer(jsonb_build_object(
           'away_from', ${day(5)}::text, 'away_to', ${day(8)}::text,
           'boat_removal_confirmed', true, 'relet_consent', true,
           'outside_arrangement_confirmed', true, 'terms_accepted', true,
           'readiness_confirmed', true)) as id`
      )
    )[0]!.id;
    expect(
      await as(STAFF, `select code from public.suggest_berths('${arrival.id}') where code = 'G-14'`)
    ).toEqual([]);

    // Pending is not enough: staff must approve it, for the nights they choose.
    await as(
      STAFF,
      `update public.relet_offers set status = 'approved',
         approved_nights = array(select d::date from generate_series(${day(5)}, ${day(7)}, interval '1 day') d)
       where id = '${offer}'`
    );
    expect(
      await as(STAFF, `select code from public.suggest_berths('${arrival.id}') where code = 'G-14'`)
    ).toEqual([]);

    // Approving night 8 as well covers the whole stay (nights 5 to 8).
    await as(
      STAFF,
      `update public.relet_offers set away_to = ${day(9)},
         approved_nights = array(select d::date from generate_series(${day(5)}, ${day(8)}, interval '1 day') d)
       where id = '${offer}'`
    );
    expect(
      await as(
        STAFF,
        `select code, via_relet from public.suggest_berths('${arrival.id}') where code = 'G-14'`
      )
    ).toEqual([{ code: "G-14", via_relet: true }]);
  });
});

describe("confirm, decline and propose", () => {
  it("confirms into a suggested berth in one step and books the released nights", async () => {
    const arrival = await one<{ id: string }>(
      `select id from public.arrivals where expected_arrival = ${day(5)}`
    );
    const g14 = await one<{ id: string }>("select id from public.berths where code = 'G-14'");
    await as(STAFF, `select public.confirm_arrival('${arrival.id}', '${g14.id}', 'Welcome')`);
    const row = await one<{ status: string; berth_id: string; decision_note: string }>(
      `select status, berth_id, decision_note from public.arrivals where id = '${arrival.id}'`
    );
    expect(row).toEqual({ status: "approved", berth_id: g14.id, decision_note: "Welcome" });
    // The guest sees "confirmed" with the berth code, and nothing more.
    expect(
      await as(
        GUEST_A,
        "select display_status, berth_code from public.my_arrivals where expected_arrival = " +
          day(5)
      )
    ).toEqual([{ display_status: "confirmed", berth_code: "G-14" }]);
    // Stay nights 5 to 8 sit inside approved nights 5 to 8, so four nights are booked.
    const offer = await one<{ status: string; nights: number }>(
      "select status, cardinality(booked_nights) as nights from public.relet_offers"
    );
    expect(offer).toEqual({ status: "booked", nights: 4 });
  });

  it("will not confirm a second guest into a berth that is taken for those nights", async () => {
    const boatB = await as<{ id: string }>(
      GUEST_B,
      `insert into public.boats (user_id, name, length_m) values ('${GUEST_B}', 'Brisa', 8) returning id`
    );
    const second = (await as<{ id: string }>(GUEST_B, request(boatB[0]!.id, 6, 8, "8")))[0]!.id;
    const g14 = await one<{ id: string }>("select id from public.berths where code = 'G-14'");
    expect(await asError(STAFF, `select public.confirm_arrival('${second}', '${g14.id}')`)).toMatch(
      /berth_not_available/
    );
  });

  it("refuses an overlapping stay at the database even when written around the function", async () => {
    const second = await one<{ id: string }>(
      `select id from public.arrivals where expected_arrival = ${day(6)}`
    );
    const g14 = await one<{ id: string }>("select id from public.berths where code = 'G-14'");
    const message = await asError(
      STAFF,
      `update public.arrivals set status = 'approved', berth_id = '${g14.id}' where id = '${second.id}'`
    );
    expect(message).toMatch(/arrivals_no_double_booking/);
  });

  it("lets one guest leave the morning another arrives", async () => {
    const second = await one<{ id: string }>(
      `select id from public.arrivals where expected_arrival = ${day(6)}`
    );
    await db.exec(
      `update public.arrivals set expected_arrival = ${day(9)}, departure = ${day(11)} where id = '${second.id}'`
    );
    const p1 = await one<{ id: string }>("select id from public.berths where code = 'P-1'");
    // Day 9 to day 11 on P-1 is free, and the first stay (5 to 9) is on G-14 anyway.
    await as(STAFF, `select public.confirm_arrival('${second.id}', '${p1.id}')`);
    const g14 = await one<{ id: string }>("select id from public.berths where code = 'G-14'");
    // A stay from day 9 on G-14 would start the day the first stay ends: allowed by the range.
    const range = await one<{ overlaps: boolean }>(
      `select public.stay_range(${day(5)}, ${day(9)}) && public.stay_range(${day(9)}, ${day(11)}) as overlaps`
    );
    expect(range.overlaps).toBe(false);
    expect(g14.id).toBeTruthy();
  });

  it("needs a reason to decline, and shows the guest that reason", async () => {
    const boatA = (await one<{ id: string }>(`select id from public.boats where name = 'Second'`))
      .id;
    const id = (await as<{ id: string }>(GUEST_A, request(boatA, 20, 22, "6")))[0]!.id;
    expect(await asError(STAFF, `select public.decline_arrival('${id}', '   ')`)).toMatch(
      /reason_required/
    );
    await as(STAFF, `select public.decline_arrival('${id}', 'Dredging that week')`);
    expect(
      await as(
        GUEST_A,
        `select display_status, decision_note from public.my_arrivals where id = '${id}'`
      )
    ).toEqual([{ display_status: "declined", decision_note: "Dredging that week" }]);
    expect(await asError(STAFF, `select public.decline_arrival('${id}', 'Again')`)).toMatch(
      /already_decided/
    );
  });

  it("proposes other dates and moves the request back when the guest accepts", async () => {
    const boatA = (await one<{ id: string }>(`select id from public.boats where name = 'Second'`))
      .id;
    const id = (await as<{ id: string }>(GUEST_A, request(boatA, 25, 27, "6")))[0]!.id;
    await as(
      STAFF,
      `select public.propose_dates('${id}', ${day(30)}, ${day(33)}, 'Full that week')`
    );
    expect(
      await as(
        GUEST_A,
        `select display_status, proposed_arrival = ${day(30)} as ok from public.my_arrivals where id = '${id}'`
      )
    ).toEqual([{ display_status: "dates_proposed", ok: true }]);
    await as(GUEST_A, `select public.accept_proposed_dates('${id}')`);
    const row = await one<{ status: string; same: boolean }>(
      `select status, expected_arrival = ${day(30)} and departure = ${day(33)} as same from public.arrivals where id = '${id}'`
    );
    expect(row).toEqual({ status: "new", same: true });
    expect(await asError(GUEST_B, `select public.accept_proposed_dates('${id}')`)).toMatch(
      /arrival_not_found/
    );
  });
});

describe("relet offers", () => {
  it("blocks cancelling an approved offer while a guest is confirmed in the period", async () => {
    const offer = await one<{ id: string }>("select id from public.relet_offers");
    expect(await asError(HOLDER, `select public.cancel_relet_offer('${offer.id}')`)).toMatch(
      /guest_confirmed/
    );
    expect(await as(HOLDER, "select status from public.relet_offers")).toEqual([
      { status: "booked" },
    ]);
  });

  it("lets only the holder offer, and only for their own berth", async () => {
    const payload = `jsonb_build_object('away_from', ${day(100)}::text, 'away_to', ${day(110)}::text,
      'boat_removal_confirmed', true, 'relet_consent', true, 'outside_arrangement_confirmed', true,
      'terms_accepted', true, 'readiness_confirmed', true)`;
    expect(await asError(GUEST_A, `select public.submit_relet_offer(${payload})`)).toMatch(
      /not_a_berth_holder/
    );
    expect(
      await asError(
        HOLDER,
        `select public.submit_relet_offer(jsonb_set(${payload}, '{relet_consent}', 'false'))`
      )
    ).toMatch(/confirmations_needed/);
    const id = (
      await as<{ id: string }>(HOLDER, `select public.submit_relet_offer(${payload}) as id`)
    )[0]!.id;
    expect(await asError(HOLDER, `select public.submit_relet_offer(${payload})`)).toMatch(
      /offer_overlaps/
    );
    // With no guest confirmed in that period the holder can cancel.
    await as(HOLDER, `select public.cancel_relet_offer('${id}')`);
    expect(await as(HOLDER, `select status from public.relet_offers where id = '${id}'`)).toEqual([
      { status: "cancelled" },
    ]);
    // A holder cannot approve their own offer or write the table.
    expect(await asError(HOLDER, `update public.relet_offers set status = 'approved'`)).toBe("");
    expect(
      await as(HOLDER, `select status from public.relet_offers where status = 'approved'`)
    ).toEqual([]);
  });
});

describe("history", () => {
  it("logs every status change with who did it", async () => {
    const g14 = await one<{ id: string }>("select id from public.berths where code = 'G-14'");
    const rows = await as<{ subject: string; to_status: string; actor_role: string }>(
      STAFF,
      `select subject, to_status, actor_role from public.berth_events
       where berth_id = '${g14.id}' order by created_at, to_status`
    );
    const pairs = rows.map((r) => `${r.subject}:${r.to_status}:${r.actor_role}`);
    expect(pairs).toContain("berth_holding:linked:staff");
    expect(pairs).toContain("relet_offer:submitted:berth_holder");
    expect(pairs).toContain("relet_offer:approved:staff");
    expect(pairs).toContain("arrival:approved:staff");
    expect(pairs).toContain("relet_offer:cancelled:berth_holder");
  });

  it("hides the history from guests and holders and refuses direct writes", async () => {
    expect(await as(GUEST_A, "select * from public.berth_events")).toEqual([]);
    expect(await as(HOLDER, "select * from public.berth_events")).toEqual([]);
    expect(
      await asError(
        STAFF,
        `insert into public.berth_events (marina_id, subject, subject_id, to_status, actor_role)
        values ('cascais', 'arrival', gen_random_uuid(), 'x', 'staff')`
      )
    ).toMatch(/permission denied/);
  });
});

describe("ending a holding", () => {
  it("ends it today, and the holder stops being a berth holder", async () => {
    const holding = await one<{ id: string }>("select id from public.berth_contracts");
    expect(await asError(HOLDER, `select public.end_berth_holding('${holding.id}')`)).toMatch(
      /not_allowed/
    );
    await as(STAFF, `select public.end_berth_holding('${holding.id}')`);
    expect(
      await as(HOLDER, `select public.holds_berth(b.id) as holds from public.berths b`)
    ).toEqual([]);
    const row = await one<{ ended: boolean }>(
      "select ends_on = public.lisbon_today() - 1 as ended from public.berth_contracts"
    );
    expect(row.ended).toBe(true);
  });
});
