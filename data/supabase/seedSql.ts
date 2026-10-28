// Builds supabase/seed.sql from the same data the mock layer uses, so the
// staff screens show the same content against Supabase as they do today.
// Run `npm run db:seed:build` after changing the berths or the mock seeds;
// a unit test fails while the file and this builder disagree.
//
// The sample accounts are real Supabase users (auth.users, with a profile and
// boats of their own): three the dev switcher signs in as (a guest, a berth
// holder of G-14 and a staff member, password in devPersonas.ts) and three more
// guests so every status shows. This seed is for a DEVELOPMENT project only.
//
// The mock enquiries are dated relative to today, so their dates are written
// as offsets from the Lisbon day the seed runs on. The customers, a relet
// period in the planner's window, dock tasks and radio log entries exist only
// here, for the screens that run on Supabase alone.

import { getAllBerths } from "@/data/berths";
import { CLASS_BEAM_RANGES, CLASS_LENGTH_RANGES, marinas } from "@/data/marinas";
import { ACCOUNTS } from "@/data/mock/accounts";
import {
  buildSeedEnquiryStore,
  EMPTY_ENQUIRY_DOCUMENTS,
  seedEnquiry,
  type Enquiry,
} from "@/data/mock/enquiries";
import { buildSeedRelettingStore } from "@/data/mock/reletting";
import { addDaysIso, daysBetween, todayIso } from "@/lib/dates";
import { DEV_PASSWORD } from "./devPersonas";
import { enquiryToRow, reletToRow, type BerthIndex } from "./rows";

const SEED_MARINA = "cascais";

const PREFIX = {
  arrival: "a",
  relet: "b",
  customer: "c",
  boat: "d",
  contract: "e",
  document: "f",
  task: "1",
  radio: "2",
  user: "9",
} as const;

// Fixed ids, so the seed can run twice without duplicating rows.
export function seedUuid(kind: keyof typeof PREFIX, n: number): string {
  return `00000000-0000-4000-8000-${PREFIX[kind]}${String(n).padStart(11, "0")}`;
}

// The berth holder's customer number; guests are numbered as their arrivals.
const HOLDER = 10;

type SeedUser = {
  n: number;
  email: string;
  name: string;
  phone: string;
  nationality: string;
  euStatus: "eu" | "non_eu";
  // Only the three the dev switcher signs in as can sign in with a password.
  password: boolean;
};

const SEED_USERS: SeedUser[] = [
  {
    n: 1,
    email: "alex.morgan@example.com",
    name: "Alex Morgan",
    phone: "+44 7700 900101",
    nationality: "United Kingdom",
    euStatus: "non_eu",
    password: true,
  },
  {
    n: 2,
    email: "ines.ferreira@example.com",
    name: "Ines Ferreira",
    phone: "+351 912 000 111",
    nationality: "Portugal",
    euStatus: "eu",
    password: false,
  },
  {
    n: 3,
    email: "marc.duran@example.com",
    name: "Marc Duran",
    phone: "+34 600 000 222",
    nationality: "Spain",
    euStatus: "eu",
    password: false,
  },
  {
    n: 4,
    email: "lena.fischer@example.com",
    name: "Lena Fischer",
    phone: "+49 151 0000 333",
    nationality: "Germany",
    euStatus: "eu",
    password: false,
  },
  {
    n: HOLDER,
    email: "jordan.reyes@example.com",
    name: "Jordan Reyes",
    phone: "+351 912 000 202",
    nationality: "Portugal",
    euStatus: "eu",
    password: true,
  },
  {
    n: 11,
    email: "sam.okafor@example.com",
    name: "Sam Okafor",
    phone: "+351 214 000 303",
    nationality: "Portugal",
    euStatus: "eu",
    password: true,
  },
];

function userFor(email: string): SeedUser | undefined {
  return SEED_USERS.find((u) => u.email === email);
}

function userSql(user: SeedUser): string[] {
  const id = quote(seedUuid("user", user.n));
  const password = user.password
    ? `extensions.crypt(${quote(DEV_PASSWORD)}, extensions.gen_salt('bf'))`
    : "''";
  return [
    insert(
      "users",
      {
        instance_id: quote("00000000-0000-0000-0000-000000000000"),
        id,
        aud: quote("authenticated"),
        role: quote("authenticated"),
        email: quote(user.email),
        encrypted_password: password,
        email_confirmed_at: "now()",
        raw_app_meta_data: `'{"provider":"email","providers":["email"]}'::jsonb`,
        raw_user_meta_data: literal({ full_name: user.name }),
        created_at: "now()",
        updated_at: "now()",
        confirmation_token: "''",
        recovery_token: "''",
        email_change_token_new: "''",
        email_change: "''",
      },
      "(id)"
    ).replace("insert into public.users", "insert into auth.users"),
    insert(
      "identities",
      {
        id: "gen_random_uuid()",
        user_id: id,
        provider_id: id,
        identity_data: `jsonb_build_object('sub', ${id}::text, 'email', ${quote(user.email)}, 'email_verified', true)`,
        provider: quote("email"),
        last_sign_in_at: "now()",
        created_at: "now()",
        updated_at: "now()",
      },
      "(provider_id, provider)"
    ).replace("insert into public.identities", "insert into auth.identities"),
    // The profile row is made by a trigger when the user is created.
    `update public.profiles set phone = ${quote(user.phone)}, nationality = ${quote(user.nationality)}, eu_status = ${quote(user.euStatus)} where user_id = ${id};`,
  ];
}

// The sample users, a staff membership for Sam, and each guest's own boat
// (the same boat the sample arrival names).
function accountsSql(enquiries: Enquiry[]): string[] {
  const out: string[] = ["-- Sample accounts: real users with a profile and boats of their own."];
  for (const user of SEED_USERS) out.push(...userSql(user), "");
  out.push(
    insert(
      "staff_members",
      {
        user_id: quote(seedUuid("user", 11)),
        marina_id: quote(SEED_MARINA),
        role: quote("staff"),
        display_name: quote("Sam Okafor"),
      },
      "(user_id, marina_id)"
    ),
    ""
  );
  for (const user of SEED_USERS.filter((u) => u.n !== 11)) {
    const boat = ownBoat(user, enquiries);
    if (!boat) continue;
    out.push(
      insert(
        "boats",
        {
          id: quote(seedUuid("boat", 100 + user.n)),
          user_id: quote(seedUuid("user", user.n)),
          name: quote(boat.name),
          boat_type: quote(boat.type),
          length_m: boat.loa,
          beam_m: boat.beam,
          draft_m: boat.draft,
          flag_country: quote(boat.flag),
          registration_number: quote(boat.registration),
          home_port: quote(boat.homePort),
          documents: literal(boat.documents),
        },
        "(id)"
      ),
      ""
    );
  }
  return out;
}

type OwnBoat = {
  name: string;
  type: string;
  loa: string;
  beam: string;
  draft: string;
  flag: string;
  registration: string;
  homePort: string;
  documents: Enquiry["documents"];
};

// The boat a sample user keeps in their account: the one on their first sample
// arrival, and Mar Azul for the berth holder.
function ownBoat(user: SeedUser, enquiries: Enquiry[]): OwnBoat | null {
  if (user.n === HOLDER) {
    return {
      name: "Mar Azul",
      type: "sail",
      loa: "7.6",
      beam: "2.9",
      draft: "1.4",
      flag: "Portugal",
      registration: "PT-MA-2210",
      homePort: "Cascais",
      documents: { ...EMPTY_ENQUIRY_DOCUMENTS, registrationNumber: "PT-MA-2210" },
    };
  }
  const e = enquiries.find((x) => x.email === user.email);
  if (!e) return null;
  return {
    name: e.boatName,
    type: e.vesselType,
    loa: e.loa,
    beam: e.beam,
    draft: e.draft,
    flag: e.flagCountry,
    registration: e.documents.registrationNumber,
    homePort: e.homePort,
    documents: e.documents,
  };
}

function quote(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

function literal(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return quote(value);
  return `${quote(JSON.stringify(value))}::jsonb`;
}

function dateArray(values: string[] | null): string {
  if (values === null) return "null";
  return `array[${values.map(quote).join(", ")}]::date[]`;
}

// A date relative to the seed's today, for example pg_temp.d(3).
function relativeDate(iso: string, today: string): string {
  return `pg_temp.d(${daysBetween(today, iso)})`;
}

// A timestamp whose day is relative to today and whose time of day is kept.
function relativeTimestamp(iso: string | null, today: string): string {
  if (!iso) return "null";
  return `pg_temp.ts(${daysBetween(today, iso.slice(0, 10))}, ${quote(iso.slice(11, 19))})`;
}

function berthLookup(code: string | null): string {
  if (!code) return "null";
  return `(select id from public.berths where marina_id = ${quote(SEED_MARINA)} and code = ${quote(code)})`;
}

// Berth references are written as lookups by code, so the converter only
// needs to know that every code exists.
function codeIndex(): BerthIndex {
  const codes = getAllBerths().map((b) => b.id);
  return {
    codeById: new Map(codes.map((c) => [c, c])),
    idByCode: new Map(codes.map((c) => [c, c])),
  };
}

function insert(table: string, row: Record<string, string>, conflict: string): string {
  const columns = Object.keys(row);
  const values = columns.map((c) => row[c]);
  return `insert into public.${table} (${columns.join(", ")})\nvalues (${values.join(", ")})\non conflict ${conflict} do nothing;`;
}

function marinaSql(): string {
  const marina = marinas.find((m) => m.id === SEED_MARINA);
  if (!marina) throw new Error("The seed marina is missing from data/marinas.ts.");
  return insert(
    "marinas",
    { id: quote(marina.id), name: quote(marina.name), location: quote(marina.location) },
    "(id)"
  );
}

function berthsSql(): string {
  const marina = marinas.find((m) => m.id === SEED_MARINA);
  const draft = marina?.berths.maxDraftM ?? 0;
  const values = getAllBerths().map(
    (b) =>
      `  (${[
        quote(SEED_MARINA),
        quote(b.id),
        quote(b.pontoonId),
        quote(b.sizeClass),
        CLASS_LENGTH_RANGES[b.sizeClass].maxM,
        CLASS_BEAM_RANGES[b.sizeClass],
        draft,
      ].join(", ")})`
  );
  return [
    "-- Every berth on the map (data/berths.ts). Size limits are the class maximums",
    "-- from the tariff (data/marinas.ts); draft is the marina's maximum.",
    "insert into public.berths (marina_id, code, pontoon, class, max_length_m, beam_m, draft_m)",
    "values",
    values.join(",\n"),
    "on conflict (marina_id, code) do nothing;",
  ].join("\n");
}

// One customer per email address, numbered by the first arrival that has it.
function customerNumber(enquiries: Enquiry[], enquiry: Enquiry): number {
  if (!enquiry.email) return enquiries.indexOf(enquiry) + 1;
  return enquiries.findIndex((e) => e.email === enquiry.email) + 1;
}

function arrivalSql(enquiries: Enquiry[], enquiry: Enquiry, n: number, today: string): string {
  const row = enquiryToRow(enquiry, codeIndex());
  const out: Record<string, string> = {};
  for (const [column, value] of Object.entries(row)) out[column] = literal(value);
  out.id = quote(seedUuid("arrival", n));
  out.berth_id = berthLookup(enquiry.assignedBerthId);
  out.expected_arrival = relativeDate(enquiry.arrival, today);
  out.departure = enquiry.departure ? relativeDate(enquiry.departure, today) : "null";
  out.decision_at = relativeTimestamp(enquiry.decisionAt, today);
  out.arrived_at = relativeTimestamp(enquiry.arrivedAt, today);
  out.departed_at = relativeTimestamp(enquiry.departedAt, today);
  out.created_at = relativeTimestamp(enquiry.createdAt, today);
  out.customer_id = quote(seedUuid("customer", customerNumber(enquiries, enquiry)));
  const user = userFor(enquiry.email);
  if (user) {
    out.user_id = quote(seedUuid("user", user.n));
    out.boat_id = quote(seedUuid("boat", 100 + user.n));
  }
  if (enquiry.proposedArrival) {
    out.proposed_arrival = relativeDate(enquiry.proposedArrival, today);
    out.proposed_departure = enquiry.proposedDeparture
      ? relativeDate(enquiry.proposedDeparture, today)
      : "null";
  }
  if (enquiry.documents.insuranceExpiry) {
    const undated = literal({ ...enquiry.documents, insuranceExpiry: "" });
    out.documents = `jsonb_set(${undated}, '{insuranceExpiry}', to_jsonb(${relativeDate(enquiry.documents.insuranceExpiry, today)}::text))`;
  }
  return insert("arrivals", out, "(id)");
}

function reletSql(): string[] {
  return buildSeedRelettingStore().requests.map((request, i) => {
    const holder = ACCOUNTS.find((a) => a.id === request.userId)?.name ?? "Berth holder";
    const row = reletToRow(request, codeIndex(), holder);
    const out: Record<string, string> = {};
    for (const [column, value] of Object.entries(row)) out[column] = literal(value);
    out.id = quote(seedUuid("relet", i + 1));
    if (request.userId === "u-owner") {
      out.user_id = quote(seedUuid("user", HOLDER));
      out.berth_holder_ref = quote(seedUuid("user", HOLDER));
    }
    out.berth_id = berthLookup(request.berthId);
    out.booked_nights = dateArray(request.bookedNights);
    out.approved_nights = dateArray(request.approvedNights);
    return insert("relet_offers", out, "(id)");
  });
}

// An approved arrival with no berth yet, so the berth planner has something
// to place. Its draft is deeper than most berths, to show the fit warning.
function plannerArrival(today: string): Enquiry {
  return seedEnquiry({
    id: "planner-sample",
    status: "approved",
    arrival: addDaysIso(today, 2),
    eta: "15:00",
    departure: addDaysIso(today, 6),
    etd: "10:00",
    boatName: "Sea Otter",
    vesselType: "sail",
    loa: "10.5",
    beam: "3.6",
    draft: "1.9",
    flagCountry: "Netherlands",
    skipperName: "Pieter de Vries",
    phone: "+31 6 1234 5678",
    email: "pieter.devries@example.com",
    decisionAt: today + "T10:00:00.000Z",
  });
}

// Alex Morgan's three requests: one waiting for the marina, one where the
// marina offered other dates, and a stay that is over.
function alexArrivals(today: string): Enquiry[] {
  const boat = {
    boatName: "Wind Song",
    vesselType: "sail",
    loa: "8.8",
    beam: "3.0",
    draft: "1.5",
    flagCountry: "United Kingdom",
    skipperName: "Alex Morgan",
    phone: "+44 7700 900101",
    email: "alex.morgan@example.com",
    homePort: "Southampton",
    documents: {
      ...EMPTY_ENQUIRY_DOCUMENTS,
      registrationNumber: "UK-WS-4410",
      competenceCertificate: "RYA-558812",
    },
  };
  return [
    seedEnquiry({
      id: "alex-requested",
      ...boat,
      status: "new",
      arrival: addDaysIso(today, 20),
      departure: addDaysIso(today, 23),
      createdAt: today + "T08:30:00.000Z",
    }),
    seedEnquiry({
      id: "alex-proposed",
      ...boat,
      status: "dates_proposed",
      arrival: addDaysIso(today, 30),
      departure: addDaysIso(today, 33),
      proposedArrival: addDaysIso(today, 36),
      proposedDeparture: addDaysIso(today, 39),
      decisionAt: today + "T09:00:00.000Z",
      decisionNote: "The marina is full that week.",
      createdAt: addDaysIso(today, -2) + "T10:00:00.000Z",
    }),
    seedEnquiry({
      id: "alex-departed",
      ...boat,
      status: "approved",
      arrivalStatus: "departed",
      assignedBerthId: "P-2",
      arrival: addDaysIso(today, -40),
      departure: addDaysIso(today, -36),
      arrivedAt: addDaysIso(today, -40) + "T13:00:00.000Z",
      departedAt: addDaysIso(today, -36) + "T09:30:00.000Z",
      decisionAt: addDaysIso(today, -50) + "T09:00:00.000Z",
      createdAt: addDaysIso(today, -52) + "T09:00:00.000Z",
    }),
  ];
}

function customerSql(
  n: number,
  kind: string,
  name: string,
  email: string,
  phone: string,
  nationality: string
) {
  return insert(
    "customers",
    {
      id: quote(seedUuid("customer", n)),
      marina_id: quote(SEED_MARINA),
      kind: quote(kind),
      full_name: quote(name),
      email: quote(email),
      phone: quote(phone),
      nationality: quote(nationality),
    },
    "(id)"
  );
}

function boatSql(
  n: number,
  customer: number,
  e: Pick<Enquiry, "boatName" | "vesselType" | "loa" | "beam" | "draft" | "flagCountry">,
  registration: string
) {
  return insert(
    "boats",
    {
      id: quote(seedUuid("boat", n)),
      marina_id: quote(SEED_MARINA),
      customer_id: quote(seedUuid("customer", customer)),
      name: quote(e.boatName),
      boat_type: quote(e.vesselType),
      length_m: e.loa || "null",
      beam_m: e.beam || "null",
      draft_m: e.draft || "null",
      flag_country: quote(e.flagCountry),
      registration_number: quote(registration),
    },
    "(id)"
  );
}

let documentCount = 0;
function documentSql(
  customer: number,
  boat: number | null,
  kind: string,
  reference: string,
  expiresOn: string
) {
  documentCount += 1;
  return insert(
    "customer_documents",
    {
      id: quote(seedUuid("document", documentCount)),
      marina_id: quote(SEED_MARINA),
      customer_id: quote(seedUuid("customer", customer)),
      boat_id: boat === null ? "null" : quote(seedUuid("boat", boat)),
      kind: quote(kind),
      reference: quote(reference),
      expires_on: expiresOn,
    },
    "(id)"
  );
}

// Guests (one per sample arrival, with their boat and documents) and the
// berth holder of G-14 with their boat, right of use and documents. A few
// documents expire within 30 days, or already have, to show the warnings.
function customersSql(enquiries: Enquiry[], today: string): string[] {
  documentCount = 0;
  const out: string[] = [];
  enquiries.forEach((e, i) => {
    const n = i + 1;
    // A guest with several arrivals is one customer.
    if (customerNumber(enquiries, e) !== n) return;
    out.push(
      customerSql(n, "guest", e.skipperName, e.email, e.phone, e.crew[0]?.nationality ?? "")
    );
    out.push(boatSql(n, n, e, e.documents.registrationNumber));
    const d = e.documents;
    if (d.registrationNumber)
      out.push(documentSql(n, n, "registration", d.registrationNumber, "null"));
    if (d.insuranceProvider) {
      out.push(
        documentSql(
          n,
          n,
          "insurance",
          `${d.insuranceProvider} ${d.insurancePolicy}`.trim(),
          d.insuranceExpiry ? relativeDate(d.insuranceExpiry, today) : "null"
        )
      );
    }
    if (d.competenceCertificate)
      out.push(documentSql(n, null, "competence", d.competenceCertificate, "null"));
    if (d.vhfLicence) out.push(documentSql(n, null, "vhf_licence", d.vhfLicence, "null"));
  });
  // Halcyon's insurance runs out in 12 days and Windrose's ran out 5 days ago.
  out.push(documentSql(3, 3, "insurance", "AXA Marine 7781-FR", "pg_temp.d(12)"));
  out.push(documentSql(5, 5, "insurance", "Pantaenius DE-44190", "pg_temp.d(-5)"));

  out.push(
    customerSql(
      HOLDER,
      "berth_holder",
      "Jordan Reyes",
      "jordan.reyes@example.com",
      "+351 912 000 202",
      "Portuguese"
    )
  );
  out.push(
    boatSql(
      HOLDER,
      HOLDER,
      {
        boatName: "Mar Azul",
        vesselType: "sail",
        loa: "7.6",
        beam: "2.9",
        draft: "1.4",
        flagCountry: "Portugal",
      },
      "PT-MA-2210"
    )
  );
  out.push(
    insert(
      "berth_contracts",
      {
        id: quote(seedUuid("contract", 1)),
        marina_id: quote(SEED_MARINA),
        customer_id: quote(seedUuid("customer", HOLDER)),
        berth_id: berthLookup("G-14"),
        boat_id: quote(seedUuid("boat", HOLDER)),
        starts_on: quote("2026-03-12"),
        ends_on: quote("2031-03-11"),
        user_id: quote(seedUuid("user", HOLDER)),
        holder_email: quote("jordan.reyes@example.com"),
      },
      "(id)"
    )
  );
  out.push(documentSql(HOLDER, null, "right_of_use", "CASC-RU-0142", quote("2031-03-11")));
  out.push(documentSql(HOLDER, HOLDER, "registration", "PT-MA-2210", "null"));
  out.push(documentSql(HOLDER, HOLDER, "insurance", "Fidelidade NM-55102", "pg_temp.d(20)"));
  return out;
}

// The berth holder of G-14 is away from day 3 to day 10, approved for
// reletting with nothing booked yet: the planner shows it as available.
function plannerReletSql(): string {
  return insert(
    "relet_offers",
    {
      id: quote(seedUuid("relet", 2)),
      marina_id: quote(SEED_MARINA),
      berth_id: berthLookup("G-14"),
      berth_holder: quote("Jordan Reyes"),
      berth_holder_ref: quote(seedUuid("user", HOLDER)),
      user_id: quote(seedUuid("user", HOLDER)),
      away_from: "pg_temp.d(3)",
      away_to: "pg_temp.d(10)",
      status: quote("approved"),
      boat_removal_confirmed: "true",
      relet_consent: "true",
      outside_arrangement_confirmed: "true",
      terms_accepted_at: "pg_temp.ts(-6, '09:00:00')",
      readiness_confirmed_at: "pg_temp.ts(-6, '09:00:00')",
      history:
        "jsonb_build_array(jsonb_build_object('status', 'submitted', 'at', pg_temp.ts(-6, '09:00:00')), jsonb_build_object('status', 'approved', 'at', pg_temp.ts(-4, '11:00:00')))",
      conditions: literal({
        maxLengthM: null,
        maxBeamM: null,
        earliestReletDate: null,
        bufferDays: 0,
      }),
      booked_nights: "'{}'::date[]",
      approved_nights:
        "array(select generate_series(pg_temp.d(3), pg_temp.d(9), interval '1 day')::date)",
      created_at: "pg_temp.ts(-6, '09:00:00')",
    },
    "(id)"
  );
}

function taskSql(
  n: number,
  berth: string | null,
  description: string,
  days: number,
  clock: string,
  done: boolean
): string {
  return insert(
    "dock_tasks",
    {
      id: quote(seedUuid("task", n)),
      marina_id: quote(SEED_MARINA),
      berth_id: berthLookup(berth),
      description: quote(description),
      due_at: `pg_temp.ts(${days}, ${quote(clock)})`,
      status: quote(done ? "done" : "to_do"),
      done_at: done ? `pg_temp.ts(${days}, ${quote(clock)})` : "null",
      created_by: "null",
    },
    "(id)"
  );
}

function radioSql(
  n: number,
  days: number,
  clock: string,
  boat: string,
  channel: number | null,
  request: string
): string {
  return insert(
    "radio_log",
    {
      id: quote(seedUuid("radio", n)),
      marina_id: quote(SEED_MARINA),
      logged_at: `pg_temp.ts(${days}, ${quote(clock)})`,
      boat_name: quote(boat),
      source: quote(channel === null ? "walk_in" : "vhf"),
      vhf_channel: channel === null ? "null" : String(channel),
      request: quote(request),
      logged_by: "null",
    },
    "(id)"
  );
}

function tasksAndRadioSql(): string[] {
  const channel = marinas.find((m) => m.id === SEED_MARINA)?.vhfChannel ?? 9;
  return [
    taskSql(1, "P-4", "Check Aurora's mooring lines after the wind", 0, "08:00:00", false),
    taskSql(2, "P-2", "Meet Kestrel and help her moor", 0, "10:30:00", false),
    taskSql(
      3,
      "G-14",
      "Shore power pedestal is tripping, call the electrician",
      0,
      "14:00:00",
      false
    ),
    taskSql(4, "P-4", "Pump-out for Aurora", -1, "16:00:00", true),
    radioSql(1, 0, "07:40:00", "Mistral", channel, "Asks for a berth tonight, 11 m sloop"),
    radioSql(2, 0, "09:15:00", "Blue Heron", null, "Asks about the fuel dock opening hours"),
    radioSql(
      3,
      -1,
      "17:30:00",
      "Nordlys",
      channel,
      "Arriving tomorrow afternoon, 12 m, needs help mooring"
    ),
  ];
}

export function buildSeedSql(): string {
  const today = todayIso();
  const enquiries = [
    ...buildSeedEnquiryStore().enquiries,
    plannerArrival(today),
    ...alexArrivals(today),
  ];
  return [
    "-- Generated by data/supabase/seedSql.ts (npm run db:seed:build). Do not edit by hand.",
    "--",
    "-- Marina de Cascais, its berths, sample accounts (real users, with the dev",
    "-- password from data/supabase/devPersonas.ts), customers and boats, sample",
    "-- arrivals in every status, relet offers, dock tasks and radio log entries.",
    "-- Dates are relative to the Lisbon day the seed runs on. Safe to run more than",
    "-- once. FOR A DEVELOPMENT PROJECT ONLY: it creates users with a known password.",
    "",
    "create function pg_temp.d(days integer) returns date language sql as $$",
    "  select (now() at time zone 'Europe/Lisbon')::date + days",
    "$$;",
    "",
    "create function pg_temp.ts(days integer, clock text) returns timestamptz language sql as $$",
    "  select (pg_temp.d(days) + clock::time) at time zone 'UTC'",
    "$$;",
    "",
    marinaSql(),
    "",
    berthsSql(),
    "",
    ...accountsSql(enquiries),
    ...customersSql(enquiries, today).flatMap((sql) => [sql, ""]),
    ...enquiries.flatMap((e, i) => [arrivalSql(enquiries, e, i + 1, today), ""]),
    ...reletSql().flatMap((sql) => [sql, ""]),
    plannerReletSql(),
    "",
    ...tasksAndRadioSql().flatMap((sql) => [sql, ""]),
  ].join("\n");
}
