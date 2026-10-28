// The staff side of the arrival flow against Supabase: suggested berths, the
// three decisions (each one database function, so each is one transaction),
// holding a berth for a berth holder, the berth page and live updates.
// Row level security and the functions decide who may do what.

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { dbErrorKey, type DbErrorKey } from "./errors";

function supabase(): SupabaseClient {
  return createClient();
}

export type StaffResult<T = undefined> = { ok: true; value: T } | { ok: false; error: DbErrorKey };

function fail(error: { code?: string | null; message?: string | null }): {
  ok: false;
  error: DbErrorKey;
} {
  return { ok: false, error: dbErrorKey(error) };
}

// ---- Suggested berths and the three decisions ----

export type BerthSuggestion = {
  // The database id in Supabase, the berth code on the mock.
  berthKey: string;
  code: string;
  pontoon: string;
  sizeClass: string;
  maxLengthM: number;
  beamM: number;
  draftM: number;
  // True when the berth is a berth holder's, free only because they offered it.
  viaRelet: boolean;
};

type SuggestionRow = {
  berth_id: string;
  code: string;
  pontoon: string;
  class: string;
  max_length_m: number | string;
  beam_m: number | string;
  draft_m: number | string;
  via_relet: boolean;
};

export async function suggestBerths(arrivalId: string): Promise<BerthSuggestion[] | null> {
  const { data, error } = await supabase().rpc("suggest_berths", {
    p_arrival: arrivalId,
    p_limit: 8,
  });
  if (error) return null;
  return ((data ?? []) as SuggestionRow[]).map((r) => ({
    berthKey: r.berth_id,
    code: r.code,
    pontoon: r.pontoon,
    sizeClass: r.class,
    maxLengthM: Number(r.max_length_m),
    beamM: Number(r.beam_m),
    draftM: Number(r.draft_m),
    viaRelet: r.via_relet,
  }));
}

export async function confirmArrival(
  arrivalId: string,
  berthId: string,
  note = ""
): Promise<StaffResult> {
  const { error } = await supabase().rpc("confirm_arrival", {
    p_arrival: arrivalId,
    p_berth: berthId,
    p_note: note,
  });
  return error ? fail(error) : { ok: true, value: undefined };
}

export async function declineArrival(arrivalId: string, reason: string): Promise<StaffResult> {
  const { error } = await supabase().rpc("decline_arrival", {
    p_arrival: arrivalId,
    p_reason: reason,
  });
  return error ? fail(error) : { ok: true, value: undefined };
}

export async function proposeDates(
  arrivalId: string,
  from: string,
  to: string,
  note: string
): Promise<StaffResult> {
  const { error } = await supabase().rpc("propose_dates", {
    p_arrival: arrivalId,
    p_from: from,
    p_to: to || null,
    p_note: note,
  });
  return error ? fail(error) : { ok: true, value: undefined };
}

// ---- Holding a berth ----

export async function linkBerthHolder(
  berthId: string,
  email: string,
  startsOn: string,
  endsOn: string,
  name: string
): Promise<StaffResult<string>> {
  const { data, error } = await supabase().rpc("link_berth_holder", {
    p_berth: berthId,
    p_email: email,
    p_starts: startsOn,
    p_ends: endsOn,
    p_name: name,
  });
  return error ? fail(error) : { ok: true, value: String(data) };
}

export async function endBerthHolding(contractId: string): Promise<StaffResult> {
  const { error } = await supabase().rpc("end_berth_holding", { p_contract: contractId });
  return error ? fail(error) : { ok: true, value: undefined };
}

// ---- A berth's page ----

export type BerthDetails = {
  id: string;
  marinaId: string;
  code: string;
  pontoon: string;
  sizeClass: string;
  maxLengthM: number;
  beamM: number;
  draftM: number;
  inService: boolean;
};

export type BerthHolding = {
  id: string;
  holderName: string;
  holderEmail: string;
  startsOn: string;
  endsOn: string;
  // False while the person has not signed in with that email yet.
  linked: boolean;
};

export type BerthStay = {
  id: string;
  boatName: string;
  skipperName: string;
  arrival: string;
  departure: string;
  status: string;
  arrivalStatus: string;
};

export type BerthOffer = {
  id: string;
  holderName: string;
  from: string;
  to: string;
  status: string;
};

export type BerthEvent = {
  id: string;
  subject: "arrival" | "relet_offer" | "berth_holding";
  fromStatus: string;
  toStatus: string;
  note: string;
  actorName: string;
  actorRole: "staff" | "guest" | "berth_holder" | "system";
  at: string;
};

export type BerthPage = {
  berth: BerthDetails;
  holdings: BerthHolding[];
  stays: BerthStay[];
  offers: BerthOffer[];
  events: BerthEvent[];
};

type HoldingRow = {
  id: string;
  holder_email: string;
  user_id: string | null;
  starts_on: string;
  ends_on: string;
  customers: { full_name: string } | null;
};

type StayRow = {
  id: string;
  boat_name: string;
  skipper_name: string;
  expected_arrival: string;
  departure: string | null;
  status: string;
  arrival_status: string;
};

type OfferRow = {
  id: string;
  berth_holder: string;
  away_from: string;
  away_to: string;
  status: string;
};

type EventRow = {
  id: string;
  subject: BerthEvent["subject"];
  from_status: string | null;
  to_status: string;
  note: string;
  actor_name: string;
  actor_role: BerthEvent["actorRole"];
  created_at: string;
};

export async function getBerthPage(marinaId: string, code: string): Promise<BerthPage | null> {
  const client = supabase();
  const { data: berth, error } = await client
    .from("berths")
    .select("id, marina_id, code, pontoon, class, max_length_m, beam_m, draft_m, status")
    .eq("marina_id", marinaId)
    .eq("code", code)
    .maybeSingle();
  if (error || !berth) return null;
  const id = berth.id as string;

  const [holdings, stays, offers, events] = await Promise.all([
    client
      .from("berth_contracts")
      .select("id, holder_email, user_id, starts_on, ends_on, customers(full_name)")
      .eq("berth_id", id)
      .order("starts_on", { ascending: false }),
    client
      .from("arrivals")
      .select("id, boat_name, skipper_name, expected_arrival, departure, status, arrival_status")
      .eq("berth_id", id)
      .order("expected_arrival", { ascending: false })
      .limit(50),
    client
      .from("relet_offers")
      .select("id, berth_holder, away_from, away_to, status")
      .eq("berth_id", id)
      .order("away_from", { ascending: false }),
    client
      .from("berth_events")
      .select("id, subject, from_status, to_status, note, actor_name, actor_role, created_at")
      .eq("berth_id", id)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  return {
    berth: {
      id,
      marinaId: berth.marina_id as string,
      code: berth.code as string,
      pontoon: berth.pontoon as string,
      sizeClass: berth.class as string,
      maxLengthM: Number(berth.max_length_m),
      beamM: Number(berth.beam_m),
      draftM: Number(berth.draft_m),
      inService: berth.status === "in_service",
    },
    holdings: ((holdings.data ?? []) as unknown as HoldingRow[]).map((h) => ({
      id: h.id,
      holderName: h.customers?.full_name ?? h.holder_email,
      holderEmail: h.holder_email,
      startsOn: h.starts_on,
      endsOn: h.ends_on,
      linked: h.user_id !== null,
    })),
    stays: ((stays.data ?? []) as StayRow[]).map((s) => ({
      id: s.id,
      boatName: s.boat_name,
      skipperName: s.skipper_name,
      arrival: s.expected_arrival,
      departure: s.departure ?? "",
      status: s.status,
      arrivalStatus: s.arrival_status,
    })),
    offers: ((offers.data ?? []) as OfferRow[]).map((o) => ({
      id: o.id,
      holderName: o.berth_holder,
      from: o.away_from,
      to: o.away_to,
      status: o.status,
    })),
    events: ((events.data ?? []) as EventRow[]).map((e) => ({
      id: e.id,
      subject: e.subject,
      fromStatus: e.from_status ?? "",
      toStatus: e.to_status,
      note: e.note,
      actorName: e.actor_name,
      actorRole: e.actor_role,
      at: e.created_at,
    })),
  };
}

// ---- Live updates ----

export type ArrivalChange = {
  kind: "INSERT" | "UPDATE" | "DELETE";
  table: "arrivals" | "relet_offers";
  // The new row's boat name and status, when the change carries them.
  boatName: string;
  status: string;
};

// Calls back whenever an arrival or a relet offer of the staff member's marina
// changes. Realtime applies the table policies, so nothing else arrives.
// Returns the function that stops listening.
export function subscribeToArrivals(onChange: (change: ArrivalChange) => void): () => void {
  const client = supabase();
  const listen = (table: ArrivalChange["table"]) =>
    ({ event: "*", schema: "public", table }) as const;
  const channel = client
    .channel("staff-arrivals")
    .on("postgres_changes", listen("arrivals"), (payload) => {
      const row = payload.new as { boat_name?: string; status?: string };
      onChange({
        kind: payload.eventType,
        table: "arrivals",
        boatName: row.boat_name ?? "",
        status: row.status ?? "",
      });
    })
    .on("postgres_changes", listen("relet_offers"), (payload) => {
      const row = payload.new as { status?: string };
      onChange({
        kind: payload.eventType,
        table: "relet_offers",
        boatName: "",
        status: row.status ?? "",
      });
    })
    .subscribe();
  return () => {
    void client.removeChannel(channel);
  };
}
