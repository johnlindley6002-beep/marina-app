// The staff back office against Supabase. Each function loads the signed-in
// staff member's marina data (row level security returns nothing else), runs
// the same rule the mock layer runs (data/mock, through snapshot.ts), and
// writes back only the rows the rule changed.
//
// The berth conflict check here runs in the browser, so two staff members
// could pass it at the same moment. The database refuses the second one (the
// exclusion constraint arrivals_no_double_booking, error 23P01), and that
// shows as DOUBLE_BOOKED. Confirm, decline and propose dates are database
// functions (data/supabase/arrivals.ts) and are atomic.

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { ACCOUNTS, type BerthLinkRecord } from "@/data/mock/accounts";
import { todayIso } from "@/lib/dates";
import type { EnquiryStore, OosStore, OutOfServiceMark } from "@/data/mock/enquiries";
import type { ReletStore } from "@/data/mock/reletting";
import { runOnSnapshot, type StaffSnapshot } from "@/data/mock/snapshot";
import { emitChange } from "@/data/mock/storage";
import type { StaffRole } from "@/features/staff/lib/roles";
import {
  enquiryFromRow,
  enquiryToRow,
  indexBerths,
  outOfServiceFromRow,
  reletFromRow,
  reletToRow,
  type ArrivalRow,
  type BerthIndex,
  type BerthRow,
  type ReletOfferRow,
} from "./rows";

export const SAVE_FAILED = "Could not save. Check your connection and try again.";
export const DOUBLE_BOOKED = "That berth was just taken for those nights. Choose another berth.";

export type StaffSession = {
  userId: string;
  email: string;
  // Marinas where the membership counts (active and in date).
  marinaIds: string[];
  // The membership in the first of them: role, team lead and what it may do.
  memberId: string | null;
  role: StaffRole | null;
  teamLead: boolean;
  displayName: string;
  capabilities: string[];
};

type Loaded = {
  snapshot: StaffSnapshot;
  index: BerthIndex;
  holderNames: Map<string, string>;
};

function supabase(): SupabaseClient {
  return createClient();
}

export async function getSupabaseStaffSession(): Promise<StaffSession | null> {
  const client = supabase();
  const { data } = await client.auth.getUser();
  const user = data.user;
  if (!user) return null;
  // Only memberships that count come back: active and not past access_until.
  const { data: rows, error } = await client.rpc("my_staff_access");
  if (error) return null;
  const members = (rows ?? []) as {
    member_id: string;
    marina_id: string;
    role: StaffRole;
    team_lead: boolean;
    display_name: string;
    capabilities: string[];
  }[];
  const first = members[0];
  return {
    userId: user.id,
    email: user.email ?? "",
    marinaIds: members.map((m) => m.marina_id),
    memberId: first?.member_id ?? null,
    role: first?.role ?? null,
    teamLead: first?.team_lead ?? false,
    displayName: first?.display_name ?? "",
    capabilities: first?.capabilities ?? [],
  };
}

async function load(): Promise<Loaded> {
  const client = supabase();
  const session = await getSupabaseStaffSession();
  const [berths, arrivals, offers, holdings] = await Promise.all([
    client.from("berths").select("id, marina_id, code, status, status_reason, status_set_at"),
    client.from("arrivals").select("*"),
    client.from("relet_offers").select("*"),
    client
      .from("berth_contracts")
      .select(
        "id, marina_id, berth_id, user_id, holder_email, starts_on, ends_on, customers(full_name)"
      ),
  ]);
  const failed = berths.error ?? arrivals.error ?? offers.error ?? holdings.error;
  if (failed) throw failed;

  const berthRows = (berths.data ?? []) as BerthRow[];
  const index = indexBerths(berthRows);
  const offerRows = (offers.data ?? []) as ReletOfferRow[];
  const holderNames = new Map(offerRows.map((r) => [r.id, r.berth_holder]));
  return {
    index,
    holderNames,
    snapshot: {
      staffMarinaIds: session?.marinaIds ?? [],
      ownerNames: Object.fromEntries(holderNames),
      holdings: ((holdings.data ?? []) as unknown as HoldingRow[]).map((h) =>
        holdingToLink(h, index)
      ),
      enquiries: {
        enquiries: ((arrivals.data ?? []) as ArrivalRow[]).map((r) => enquiryFromRow(r, index)),
      },
      relet: {
        requests: offerRows.map((r) => reletFromRow(r, index)),
        // Notifications go to berth holders, whose screens are still mock.
        notifications: [],
      },
      oos: {
        marks: berthRows.map(outOfServiceFromRow).filter((m): m is OutOfServiceMark => m !== null),
      },
    },
  };
}

type HoldingRow = {
  id: string;
  marina_id: string;
  berth_id: string;
  user_id: string | null;
  holder_email: string;
  starts_on: string;
  ends_on: string;
  customers: { full_name: string } | null;
};

// A holding as the rules in data/mock know a berth link. Only a holding that
// covers today is active; the boat on file is not kept for a holding.
function holdingToLink(row: HoldingRow, index: BerthIndex): BerthLinkRecord {
  const today = todayIso();
  return {
    id: row.id,
    userId: row.user_id ?? row.holder_email,
    marinaId: row.marina_id,
    berthId: index.codeById.get(row.berth_id) ?? "",
    linkedAt: row.starts_on,
    active: row.starts_on <= today && row.ends_on >= today,
    boatOnFile: { name: "", type: "", loa: "", beam: "", draft: "", flag: "" },
    holderName: row.customers?.full_name ?? row.holder_email,
  };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function changed<T extends { id: string }>(before: T[], after: T[]): T[] {
  const old = new Map(before.map((item) => [item.id, JSON.stringify(item)]));
  return after.filter((item) => old.get(item.id) !== JSON.stringify(item));
}

// Writes the rows a rule changed: arrivals, relet offers and berth service
// status. Nothing is ever deleted here.
async function persist(
  loaded: Loaded,
  before: { enquiries: EnquiryStore; relet: ReletStore; oos: OosStore }
): Promise<"saved" | "double_booked" | "failed"> {
  const client = supabase();
  const { snapshot, index, holderNames } = loaded;
  const writes: PromiseLike<{ error: unknown }>[] = [];

  const arrivals = changed(before.enquiries.enquiries, snapshot.enquiries.enquiries);
  if (arrivals.length > 0) {
    writes.push(client.from("arrivals").upsert(arrivals.map((e) => enquiryToRow(e, index))));
  }

  const offers = changed(before.relet.requests, snapshot.relet.requests);
  if (offers.length > 0) {
    const rows = offers.map((r) =>
      reletToRow(
        r,
        index,
        holderNames.get(r.id) ?? ACCOUNTS.find((a) => a.id === r.userId)?.name ?? "Berth holder"
      )
    );
    writes.push(client.from("relet_offers").upsert(rows));
  }

  const key = (m: OutOfServiceMark) => `${m.marinaId}:${m.berthId}`;
  const wasOut = new Set(before.oos.marks.map(key));
  const isOut = new Set(snapshot.oos.marks.map(key));
  for (const mark of snapshot.oos.marks.filter((m) => !wasOut.has(key(m)))) {
    writes.push(
      client
        .from("berths")
        .update({ status: "out_of_service", status_reason: mark.reason, status_set_at: mark.setAt })
        .eq("marina_id", mark.marinaId)
        .eq("code", mark.berthId)
    );
  }
  for (const mark of before.oos.marks.filter((m) => !isOut.has(key(m)))) {
    writes.push(
      client
        .from("berths")
        .update({ status: "in_service", status_reason: "", status_set_at: null })
        .eq("marina_id", mark.marinaId)
        .eq("code", mark.berthId)
    );
  }

  const results = await Promise.all(writes);
  const errors = results.map((r) => r.error as { code?: string } | null).filter(Boolean);
  if (errors.length === 0) return "saved";
  return errors.some((e) => e?.code === "23P01") ? "double_booked" : "failed";
}

// Runs a read-only rule against the staff member's data.
export async function readStaff<T>(rule: () => T, empty: T): Promise<T> {
  try {
    const loaded = await load();
    return runOnSnapshot(loaded.snapshot, rule);
  } catch {
    return empty;
  }
}

// Runs a rule that may change data, and saves what it changed when it
// succeeds. Screens re-read through the change event afterwards.
export async function writeStaff<T extends { ok: true } | { ok: false; error: string }>(
  rule: () => T
): Promise<T | { ok: false; error: string }> {
  let loaded: Loaded;
  try {
    loaded = await load();
  } catch {
    return { ok: false, error: SAVE_FAILED };
  }
  const before = clone({
    enquiries: loaded.snapshot.enquiries,
    relet: loaded.snapshot.relet,
    oos: loaded.snapshot.oos,
  });
  const result = runOnSnapshot(loaded.snapshot, rule);
  if (!result.ok) return result;
  let saved: Awaited<ReturnType<typeof persist>> = "failed";
  try {
    saved = await persist(loaded, before);
  } catch {
    saved = "failed";
  }
  emitChange();
  if (saved === "saved") return result;
  return { ok: false, error: saved === "double_booked" ? DOUBLE_BOOKED : SAVE_FAILED };
}

export async function signOutStaff(): Promise<void> {
  await supabase().auth.signOut();
  emitChange();
}

export type SignInLinkResult = "sent" | "too-many" | "failed";

// An address with no staff account gets the same "sent" answer as one with an
// account, so the form never tells anyone who works here.
export async function sendStaffSignInLink(
  email: string,
  redirectTo: string
): Promise<SignInLinkResult> {
  try {
    const { error } = await supabase().auth.signInWithOtp({
      email,
      // Someone invited on the Team page may not have an account yet: their
      // first sign-in creates it and turns the invite into a membership. An
      // address nobody invited gets an account with no staff access at all.
      options: { shouldCreateUser: true, emailRedirectTo: redirectTo },
    });
    if (!error) return "sent";
    if (error.status === 429) return "too-many";
    return error.status && error.status < 500 ? "sent" : "failed";
  } catch {
    return "failed";
  }
}
