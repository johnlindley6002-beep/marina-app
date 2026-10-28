// The guest and berth holder side against Supabase: sign in with an email
// link, the profile, the user's own boats, arrival requests and relet offers.
// Row level security and the database functions decide what each person may
// do; nothing here is trusted for access. The browser holds the publishable
// key only.

import type { SupabaseClient } from "@supabase/supabase-js";
import { marinas } from "@/data/marinas";
import type { OwnedBerth } from "@/data/mock/accounts";
import type { SubmitEnquiryInput } from "@/data/mock/enquiries";
import type { RelettingRequest } from "@/data/mock/reletting";
import { emitChange } from "@/data/mock/storage";
import type { SavedBoat } from "@/features/my-boat/lib/boatProfile";
import { todayIso } from "@/lib/dates";
import { createClient } from "@/lib/supabase/client";
import { dbErrorKey, type DbErrorKey } from "./errors";
import {
  boatFromRow,
  boatToRow,
  enquiryToRequest,
  indexBerths,
  reletFromRow,
  type BoatRow,
  type ReletOfferRow,
} from "./rows";

function supabase(): SupabaseClient {
  return createClient();
}

export type DbResult<T = undefined> = { ok: true; value: T } | { ok: false; error: DbErrorKey };

function fail(error: { code?: string | null; message?: string | null } | null): {
  ok: false;
  error: DbErrorKey;
} {
  return { ok: false, error: dbErrorKey(error) };
}

// ---- Signing in ----

export type LoginLinkResult = "sent" | "too-many" | "failed";

// Anyone may sign in this way. A new address creates an account (a guest);
// berth holders and staff gain their role only when the marina links them.
export async function sendLoginLink(email: string, redirectTo: string): Promise<LoginLinkResult> {
  try {
    const { error } = await supabase().auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true, emailRedirectTo: redirectTo },
    });
    if (!error) return "sent";
    return error.status === 429 ? "too-many" : "failed";
  } catch {
    return "failed";
  }
}

// DEV ONLY. The dev switcher signs in as a seeded sample account.
export async function signInWithPassword(email: string, password: string): Promise<boolean> {
  try {
    const { error } = await supabase().auth.signInWithPassword({ email, password });
    emitChange();
    return !error;
  } catch {
    return false;
  }
}

export async function signOutAccount(): Promise<void> {
  try {
    await supabase().auth.signOut();
  } finally {
    emitChange();
  }
}

// ---- The account ----

export type ProfileFields = {
  fullName: string;
  phone: string;
  nationality: string;
  euStatus: "eu" | "non_eu" | "";
};

export type Holding = {
  id: string;
  marinaId: string;
  berthCode: string;
  pontoon: string;
  sizeClass: string;
  startsOn: string;
  endsOn: string;
};

export type Account = {
  userId: string;
  email: string;
  profile: ProfileFields;
  // The holdings that are active today. Empty for a guest.
  holdings: Holding[];
  staffMarinaIds: string[];
};

type ProfileRow = {
  full_name: string;
  phone: string;
  nationality: string;
  eu_status: ProfileFields["euStatus"];
};

type HoldingRow = {
  id: string;
  marina_id: string;
  starts_on: string;
  ends_on: string;
  berths: { code: string; pontoon: string; class: string } | null;
};

export const EMPTY_PROFILE: ProfileFields = {
  fullName: "",
  phone: "",
  nationality: "",
  euStatus: "",
};

// The signed-in person's profile and active holdings, or null when signed out.
export async function loadAccount(): Promise<Account | null> {
  const client = supabase();
  const { data } = await client.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  const userId = claims.sub;
  const today = todayIso();

  const [profile, holdings, staff] = await Promise.all([
    client
      .from("profiles")
      .select("full_name, phone, nationality, eu_status")
      .eq("user_id", userId)
      .maybeSingle(),
    client
      .from("berth_contracts")
      .select("id, marina_id, starts_on, ends_on, berths(code, pontoon, class)")
      .eq("user_id", userId)
      .lte("starts_on", today)
      .gte("ends_on", today),
    client.from("staff_members").select("marina_id").eq("user_id", userId),
  ]);

  const row = profile.data as ProfileRow | null;
  return {
    userId,
    email: typeof claims.email === "string" ? claims.email : "",
    profile: row
      ? {
          fullName: row.full_name,
          phone: row.phone,
          nationality: row.nationality,
          euStatus: row.eu_status,
        }
      : { ...EMPTY_PROFILE },
    holdings: ((holdings.data ?? []) as unknown as HoldingRow[])
      .filter((h) => h.berths)
      .map((h) => ({
        id: h.id,
        marinaId: h.marina_id,
        berthCode: h.berths?.code ?? "",
        pontoon: h.berths?.pontoon ?? "",
        sizeClass: h.berths?.class ?? "",
        startsOn: h.starts_on,
        endsOn: h.ends_on,
      })),
    staffMarinaIds: ((staff.data ?? []) as { marina_id: string }[]).map((m) => m.marina_id),
  };
}

export async function saveProfile(patch: Partial<ProfileFields>): Promise<boolean> {
  const client = supabase();
  const { data } = await client.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) return false;
  const update: Partial<ProfileRow> = {};
  if (patch.fullName !== undefined) update.full_name = patch.fullName;
  if (patch.phone !== undefined) update.phone = patch.phone;
  if (patch.nationality !== undefined) update.nationality = patch.nationality;
  if (patch.euStatus !== undefined) update.eu_status = patch.euStatus;
  const { error } = await client.from("profiles").update(update).eq("user_id", userId);
  emitChange();
  return !error;
}

// The berths a holder holds, in the shape the My berth screens use.
export function ownedBerthsFrom(account: Account | null, boat: SavedBoat | null): OwnedBerth[] {
  if (!account) return [];
  return account.holdings.map((h) => {
    const marina = marinas.find((m) => m.id === h.marinaId);
    return {
      linkId: h.id,
      marinaId: h.marinaId,
      marinaName: marina?.name ?? h.marinaId,
      countrySlug: marina?.countrySlug ?? "",
      berthId: h.berthCode,
      pontoon: h.pontoon,
      sizeClass: h.sizeClass || null,
      linkedBy: marina?.name ?? h.marinaId,
      linkedAt: h.startsOn,
      boatOnFile: {
        name: boat?.name ?? "",
        type: boat?.type ?? "",
        loa: boat?.loa ?? "",
        beam: boat?.beam ?? "",
        draft: boat?.draft ?? "",
        flag: boat?.flag ?? "",
      },
    };
  });
}

// ---- Boats ----

export async function listBoats(): Promise<SavedBoat[] | null> {
  const { data, error } = await supabase()
    .from("boats")
    .select("*")
    .not("user_id", "is", null)
    .order("created_at");
  if (error) return null;
  return ((data ?? []) as BoatRow[]).map(boatFromRow);
}

export async function upsertBoat(boat: SavedBoat): Promise<boolean> {
  const client = supabase();
  const { data } = await client.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) return false;
  const { error } = await client.from("boats").upsert(boatToRow(boat, userId));
  return !error;
}

export async function deleteBoat(id: string): Promise<boolean> {
  const { error } = await supabase().from("boats").delete().eq("id", id);
  return !error;
}

// ---- Arrival requests ----

export async function requestArrival(
  marinaId: string,
  boatId: string,
  enquiry: SubmitEnquiryInput
): Promise<DbResult<string>> {
  const { data, error } = await supabase().rpc("request_arrival", {
    p_marina: marinaId,
    p_boat: boatId,
    p: enquiryToRequest(enquiry),
  });
  emitChange();
  return error ? fail(error) : { ok: true, value: String(data) };
}

export type MyArrivalStatus =
  "requested" | "confirmed" | "declined" | "arrived" | "departed" | "dates_proposed";

export type MyArrival = {
  id: string;
  marinaId: string;
  marinaName: string;
  status: MyArrivalStatus;
  arrival: string;
  departure: string;
  openEnded: boolean;
  boatName: string;
  // Only once staff have confirmed this guest into it.
  berthCode: string;
  note: string;
  proposedArrival: string;
  proposedDeparture: string;
  createdAt: string;
};

type MyArrivalRow = {
  id: string;
  marina_id: string;
  marina_name: string;
  display_status: MyArrivalStatus;
  expected_arrival: string;
  departure: string | null;
  open_ended: boolean;
  boat_name: string;
  berth_code: string | null;
  decision_note: string;
  proposed_arrival: string | null;
  proposed_departure: string | null;
  created_at: string;
};

export async function listMyArrivals(): Promise<MyArrival[] | null> {
  const { data, error } = await supabase()
    .from("my_arrivals")
    .select("*")
    .order("expected_arrival", { ascending: false });
  if (error) return null;
  return ((data ?? []) as MyArrivalRow[]).map((r) => ({
    id: r.id,
    marinaId: r.marina_id,
    marinaName: r.marina_name,
    status: r.display_status,
    arrival: r.expected_arrival,
    departure: r.departure ?? "",
    openEnded: r.open_ended,
    boatName: r.boat_name,
    berthCode: r.berth_code ?? "",
    note: r.decision_note,
    proposedArrival: r.proposed_arrival ?? "",
    proposedDeparture: r.proposed_departure ?? "",
    createdAt: r.created_at,
  }));
}

export async function acceptProposedDates(arrivalId: string): Promise<DbResult> {
  const { error } = await supabase().rpc("accept_proposed_dates", { p_arrival: arrivalId });
  emitChange();
  return error ? fail(error) : { ok: true, value: undefined };
}

// ---- Relet offers ----

// The signed-in holder's offers, newest first, in the shape the screens use.
export async function listMyOffers(
  berths: { id: string; code: string }[]
): Promise<RelettingRequest[] | null> {
  const { data, error } = await supabase()
    .from("relet_offers")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return null;
  const index = indexBerths(berths);
  return ((data ?? []) as ReletOfferRow[]).map((r) => reletFromRow(r, index));
}

// The ids behind the codes of the berths the holder holds, for listMyOffers.
export async function listMyBerthIds(): Promise<{ id: string; code: string }[]> {
  const { data } = await supabase().from("berths").select("id, code");
  return (data ?? []) as { id: string; code: string }[];
}

export type ReletOfferInput = {
  startDate: string;
  endDate: string;
  boatRemovalConfirmed: boolean;
  reletConsent: boolean;
  outsideArrangementConfirmed: boolean;
  termsAccepted: boolean;
  readinessConfirmed: boolean;
  resubmitOf?: string;
};

export async function submitReletOffer(input: ReletOfferInput): Promise<DbResult<string>> {
  const { data, error } = await supabase().rpc("submit_relet_offer", {
    p: {
      away_from: input.startDate,
      away_to: input.endDate,
      boat_removal_confirmed: input.boatRemovalConfirmed,
      relet_consent: input.reletConsent,
      outside_arrangement_confirmed: input.outsideArrangementConfirmed,
      terms_accepted: input.termsAccepted,
      readiness_confirmed: input.readinessConfirmed,
      resubmit_of: input.resubmitOf ?? null,
    },
  });
  emitChange();
  return error ? fail(error) : { ok: true, value: String(data) };
}

// Refused by the database when a guest is already confirmed in the period.
export async function cancelReletOffer(offerId: string): Promise<DbResult> {
  const { error } = await supabase().rpc("cancel_relet_offer", { p_offer: offerId });
  emitChange();
  return error ? fail(error) : { ok: true, value: undefined };
}

export async function requestReletEarlyReturn(offerId: string): Promise<DbResult> {
  const { error } = await supabase().rpc("request_early_return", { p_offer: offerId });
  emitChange();
  return error ? fail(error) : { ok: true, value: undefined };
}
