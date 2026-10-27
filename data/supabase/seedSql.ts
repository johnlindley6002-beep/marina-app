// Builds supabase/seed.sql from the same data the mock layer uses, so the
// staff screens show the same content against Supabase as they do today.
// Run `npm run db:seed:build` after changing the berths or the mock seeds;
// a unit test fails while the file and this builder disagree.
//
// The mock enquiries are dated relative to today, so their dates are written
// as offsets from the Lisbon day the seed runs on.

import { getAllBerths } from "@/data/berths";
import { CLASS_BEAM_RANGES, CLASS_LENGTH_RANGES, marinas } from "@/data/marinas";
import { ACCOUNTS } from "@/data/mock/accounts";
import { buildSeedEnquiryStore, type Enquiry } from "@/data/mock/enquiries";
import { buildSeedRelettingStore } from "@/data/mock/reletting";
import { daysBetween, todayIso } from "@/lib/dates";
import { enquiryToRow, reletToRow, type BerthIndex } from "./rows";

const SEED_MARINA = "cascais";

// Fixed ids, so the seed can run twice without duplicating rows.
export function seedUuid(kind: "arrival" | "relet", n: number): string {
  const prefix = kind === "arrival" ? "a" : "b";
  return `00000000-0000-4000-8000-${prefix}${String(n).padStart(11, "0")}`;
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

function arrivalSql(enquiry: Enquiry, n: number, today: string): string {
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
    out.berth_id = berthLookup(request.berthId);
    out.booked_nights = dateArray(request.bookedNights);
    out.approved_nights = dateArray(request.approvedNights);
    return insert("relet_offers", out, "(id)");
  });
}

export function buildSeedSql(): string {
  const today = todayIso();
  const enquiries = buildSeedEnquiryStore().enquiries;
  return [
    "-- Generated by data/supabase/seedSql.ts (npm run db:seed:build). Do not edit by hand.",
    "--",
    "-- Marina de Cascais, its berths, and the sample arrivals and relet offer the",
    "-- staff screens show in the mock. Arrival dates are relative to the Lisbon day",
    "-- the seed runs on. Safe to run more than once.",
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
    ...enquiries.flatMap((e, i) => [arrivalSql(e, i + 1, today), ""]),
    ...reletSql().flatMap((sql) => [sql, ""]),
  ].join("\n");
}
