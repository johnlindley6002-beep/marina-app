// Data for the back office screens that run on Supabase only: reception,
// the berth planner, customers, dock tasks and the radio log. Row level
// security limits every read and write to the signed-in staff member's
// marina. Reads return null or empty on failure; writes return true or false.
// Every successful write announces itself so open screens read again.

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { emitChange } from "@/data/mock/storage";
import type { Enquiry } from "@/data/mock/enquiries";
import type { RadioSource } from "@/features/staff/lib/radio";
import { enquiryFromRow, indexBerths, metresFromColumn, type ArrivalRow } from "./rows";
import { getSupabaseStaffSession } from "./staff";

function db(): SupabaseClient {
  return createClient();
}

async function done(write: PromiseLike<{ error: unknown }>): Promise<boolean> {
  try {
    const { error } = await write;
    if (error) return false;
    emitChange();
    return true;
  } catch {
    return false;
  }
}

async function berthIndex() {
  const { data, error } = await db().from("berths").select("id, code");
  if (error) throw error;
  return indexBerths((data ?? []) as { id: string; code: string }[]);
}

// ---------------------------------------------------------------------------
// Reception
// ---------------------------------------------------------------------------

export type ReceptionRecord = {
  enquiry: Enquiry;
  documentsChecked: string[];
  authorityDone: boolean;
  authorityAt: string | null;
};

type ReceptionRow = ArrivalRow & {
  documents_checked: string[];
  authority_formalities_done: boolean;
  authority_formalities_at: string | null;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getReceptionRecord(id: string): Promise<ReceptionRecord | null> {
  if (!UUID.test(id)) return null;
  try {
    const [index, { data, error }] = await Promise.all([
      berthIndex(),
      db().from("arrivals").select("*").eq("id", id).maybeSingle(),
    ]);
    if (error || !data) return null;
    const row = data as ReceptionRow;
    return {
      enquiry: enquiryFromRow(row, index),
      documentsChecked: row.documents_checked ?? [],
      authorityDone: row.authority_formalities_done,
      authorityAt: row.authority_formalities_at,
    };
  } catch {
    return null;
  }
}

export type ReceptionDetails = {
  boatName: string;
  loa: number | null;
  beam: number | null;
  draft: number | null;
  flagCountry: string;
  skipperName: string;
  phone: string;
  email: string;
  peopleOnBoard: string;
};

export function saveReceptionDetails(id: string, details: ReceptionDetails): Promise<boolean> {
  return done(
    db()
      .from("arrivals")
      .update({
        boat_name: details.boatName.trim(),
        length_m: details.loa,
        beam_m: details.beam,
        draft_m: details.draft,
        flag_country: details.flagCountry.trim(),
        skipper_name: details.skipperName.trim(),
        phone: details.phone.trim(),
        email: details.email.trim(),
        people_on_board: details.peopleOnBoard.trim(),
      })
      .eq("id", id)
  );
}

export function setDocumentsChecked(id: string, keys: string[]): Promise<boolean> {
  return done(db().from("arrivals").update({ documents_checked: keys }).eq("id", id));
}

export async function setAuthorityFormalities(id: string, completed: boolean): Promise<boolean> {
  const session = await getSupabaseStaffSession();
  return done(
    db()
      .from("arrivals")
      .update({
        authority_formalities_done: completed,
        authority_formalities_at: completed ? new Date().toISOString() : null,
        authority_formalities_by: completed ? (session?.userId ?? null) : null,
      })
      .eq("id", id)
  );
}

// ---------------------------------------------------------------------------
// Berth planner
// ---------------------------------------------------------------------------

export type PlannerBerth = {
  code: string;
  pontoon: string;
  sizeClass: string;
  maxLengthM: number;
  beamM: number;
  draftM: number;
};

function berthNumber(code: string): number {
  return Number(code.split("-").pop()) || 0;
}

export async function getPlannerBerths(): Promise<PlannerBerth[]> {
  try {
    const { data, error } = await db()
      .from("berths")
      .select("code, pontoon, class, max_length_m, beam_m, draft_m");
    if (error) return [];
    return (
      (data ?? []) as {
        code: string;
        pontoon: string;
        class: string;
        max_length_m: number | string;
        beam_m: number | string;
        draft_m: number | string;
      }[]
    )
      .map((r) => ({
        code: r.code,
        pontoon: r.pontoon,
        sizeClass: r.class,
        maxLengthM: Number(r.max_length_m),
        beamM: Number(r.beam_m),
        draftM: Number(r.draft_m),
      }))
      .sort(
        (a, b) => a.pontoon.localeCompare(b.pontoon) || berthNumber(a.code) - berthNumber(b.code)
      );
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------

export type CustomerKind = "berth_holder" | "guest";

export type CustomerBoat = {
  id: string;
  name: string;
  boatType: string;
  loa: string;
  beam: string;
  draft: string;
  flagCountry: string;
  registration: string;
};

export type CustomerContract = {
  id: string;
  berthCode: string;
  boatName: string;
  startsOn: string;
  endsOn: string;
};

export type CustomerDocument = {
  id: string;
  kind: string;
  reference: string;
  boatName: string;
  expiresOn: string | null;
};

export type CustomerStay = {
  id: string;
  arrival: string;
  departure: string | null;
  berthCode: string | null;
  status: string;
  arrivalStatus: "pending" | "arrived" | "departed";
};

export type Customer = {
  id: string;
  kind: CustomerKind;
  fullName: string;
  email: string;
  phone: string;
  nationality: string;
  boats: CustomerBoat[];
  contracts: CustomerContract[];
  documents: CustomerDocument[];
  stays: CustomerStay[];
};

const CUSTOMER_SELECT = `id, kind, full_name, email, phone, nationality,
  boats(id, name, boat_type, length_m, beam_m, draft_m, flag_country, registration_number),
  berth_contracts(id, starts_on, ends_on, berths(code), boats(name)),
  customer_documents(id, kind, reference, expires_on, boats(name)),
  arrivals(id, expected_arrival, departure, status, arrival_status, berths(code))`;

type CustomerRow = {
  id: string;
  kind: CustomerKind;
  full_name: string;
  email: string;
  phone: string;
  nationality: string;
  boats: {
    id: string;
    name: string;
    boat_type: string;
    length_m: number | string | null;
    beam_m: number | string | null;
    draft_m: number | string | null;
    flag_country: string;
    registration_number: string;
  }[];
  berth_contracts: {
    id: string;
    starts_on: string;
    ends_on: string;
    berths: { code: string } | null;
    boats: { name: string } | null;
  }[];
  customer_documents: {
    id: string;
    kind: string;
    reference: string;
    expires_on: string | null;
    boats: { name: string } | null;
  }[];
  arrivals: {
    id: string;
    expected_arrival: string;
    departure: string | null;
    status: string;
    arrival_status: CustomerStay["arrivalStatus"];
    berths: { code: string } | null;
  }[];
};

function customerFromRow(r: CustomerRow): Customer {
  return {
    id: r.id,
    kind: r.kind,
    fullName: r.full_name,
    email: r.email,
    phone: r.phone,
    nationality: r.nationality,
    boats: r.boats.map((b) => ({
      id: b.id,
      name: b.name,
      boatType: b.boat_type,
      loa: metresFromColumn(b.length_m),
      beam: metresFromColumn(b.beam_m),
      draft: metresFromColumn(b.draft_m),
      flagCountry: b.flag_country,
      registration: b.registration_number,
    })),
    contracts: r.berth_contracts
      .map((c) => ({
        id: c.id,
        berthCode: c.berths?.code ?? "",
        boatName: c.boats?.name ?? "",
        startsOn: c.starts_on,
        endsOn: c.ends_on,
      }))
      .sort((a, b) => b.endsOn.localeCompare(a.endsOn)),
    documents: r.customer_documents
      .map((d) => ({
        id: d.id,
        kind: d.kind,
        reference: d.reference,
        boatName: d.boats?.name ?? "",
        expiresOn: d.expires_on,
      }))
      .sort((a, b) => (a.expiresOn ?? "9999").localeCompare(b.expiresOn ?? "9999")),
    stays: r.arrivals
      .map((a) => ({
        id: a.id,
        arrival: a.expected_arrival,
        departure: a.departure,
        berthCode: a.berths?.code ?? null,
        status: a.status,
        arrivalStatus: a.arrival_status,
      }))
      .sort((a, b) => b.arrival.localeCompare(a.arrival)),
  };
}

export async function listCustomers(): Promise<Customer[]> {
  try {
    const { data, error } = await db().from("customers").select(CUSTOMER_SELECT).order("full_name");
    if (error) return [];
    return ((data ?? []) as unknown as CustomerRow[]).map(customerFromRow);
  } catch {
    return [];
  }
}

export async function getCustomer(id: string): Promise<Customer | null> {
  if (!UUID.test(id)) return null;
  try {
    const { data, error } = await db()
      .from("customers")
      .select(CUSTOMER_SELECT)
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return customerFromRow(data as unknown as CustomerRow);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Radio and walk-in log
// ---------------------------------------------------------------------------

export type RadioEntry = {
  id: string;
  loggedAt: string;
  boatName: string;
  source: RadioSource;
  channel: number | null;
  request: string;
  arrivalId: string | null;
};

export async function getRadioLog(sinceIso: string): Promise<RadioEntry[]> {
  try {
    const { data, error } = await db()
      .from("radio_log")
      .select("id, logged_at, boat_name, source, vhf_channel, request, arrival_id")
      .gte("logged_at", sinceIso)
      .order("logged_at", { ascending: false });
    if (error) return [];
    return (
      (data ?? []) as {
        id: string;
        logged_at: string;
        boat_name: string;
        source: RadioSource;
        vhf_channel: number | null;
        request: string;
        arrival_id: string | null;
      }[]
    ).map((r) => ({
      id: r.id,
      loggedAt: r.logged_at,
      boatName: r.boat_name,
      source: r.source,
      channel: r.vhf_channel,
      request: r.request,
      arrivalId: r.arrival_id,
    }));
  } catch {
    return [];
  }
}

export async function addRadioEntry(entry: {
  loggedAt: string;
  boatName: string;
  source: RadioSource;
  channel: number | null;
  request: string;
}): Promise<boolean> {
  const session = await getSupabaseStaffSession();
  const marinaId = session?.marinaIds[0];
  if (!marinaId) return false;
  return done(
    db()
      .from("radio_log")
      .insert({
        marina_id: marinaId,
        logged_at: entry.loggedAt,
        boat_name: entry.boatName.trim(),
        source: entry.source,
        vhf_channel: entry.source === "vhf" ? entry.channel : null,
        request: entry.request.trim(),
      })
  );
}

export function radioEntryToArrival(id: string): Promise<boolean> {
  return done(db().rpc("radio_entry_to_arrival", { entry_id: id }));
}
