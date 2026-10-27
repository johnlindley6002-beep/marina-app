// The staff back office against Supabase. Each function loads the signed-in
// staff member's marina data (row level security returns nothing else), runs
// the same rule the mock layer runs (data/mock, through snapshot.ts), and
// writes back only the rows the rule changed.
//
// Known gap: the berth conflict check runs here, not in one database
// transaction, so two staff members approving the same berth at the same
// moment could both succeed. A database function or constraint should take
// that over before the guest side goes live.

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { ACCOUNTS } from "@/data/mock/accounts";
import type { EnquiryStore, OosStore, OutOfServiceMark } from "@/data/mock/enquiries";
import type { ReletStore } from "@/data/mock/reletting";
import { runOnSnapshot, type StaffSnapshot } from "@/data/mock/snapshot";
import { emitChange } from "@/data/mock/storage";
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

export type StaffSession = {
  userId: string;
  email: string;
  marinaIds: string[];
  isAdmin: boolean;
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
  const { data: rows, error } = await client
    .from("staff_members")
    .select("marina_id, role")
    .eq("user_id", user.id);
  if (error) return null;
  const members = (rows ?? []) as { marina_id: string; role: string }[];
  return {
    userId: user.id,
    email: user.email ?? "",
    marinaIds: members.map((m) => m.marina_id),
    isAdmin: members.some((m) => m.role === "admin"),
  };
}

async function load(): Promise<Loaded> {
  const client = supabase();
  const session = await getSupabaseStaffSession();
  const [berths, arrivals, offers] = await Promise.all([
    client.from("berths").select("id, marina_id, code, status, status_reason, status_set_at"),
    client.from("arrivals").select("*"),
    client.from("relet_offers").select("*"),
  ]);
  const failed = berths.error ?? arrivals.error ?? offers.error;
  if (failed) throw failed;

  const berthRows = (berths.data ?? []) as BerthRow[];
  const index = indexBerths(berthRows);
  const offerRows = (offers.data ?? []) as ReletOfferRow[];
  return {
    index,
    holderNames: new Map(offerRows.map((r) => [r.id, r.berth_holder])),
    snapshot: {
      staffMarinaIds: session?.marinaIds ?? [],
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
): Promise<boolean> {
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
  return results.every((r) => !r.error);
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
  let saved = false;
  try {
    saved = await persist(loaded, before);
  } catch {
    saved = false;
  }
  emitChange();
  return saved ? result : { ok: false, error: SAVE_FAILED };
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
      // Staff accounts are invite only: an unknown address gets no account.
      options: { shouldCreateUser: false, emailRedirectTo: redirectTo },
    });
    if (!error) return "sent";
    if (error.status === 429) return "too-many";
    return error.status && error.status < 500 ? "sent" : "failed";
  } catch {
    return "failed";
  }
}
