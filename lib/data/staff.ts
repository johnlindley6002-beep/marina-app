// The staff back office's data: arrivals (enquiries), the berth map and relet
// approvals. Every function returns a Promise. By default they read and write
// Supabase; with NEXT_PUBLIC_STAFF_DATA=mock (the end-to-end tests) they run
// on the mock layer in the browser, exactly as before. The rules are the same
// code either way (data/mock), so the two cannot drift apart.

import {
  getBerthStatuses as mockGetBerthStatuses,
  suggestReleasedBerths as mockSuggestReleasedBerths,
} from "@/data/mock/berthStatus";
import {
  clearBerthOutOfService as mockClearBerthOutOfService,
  decideEnquiry as mockDecideEnquiry,
  getEnquiries as mockGetEnquiries,
  getOutOfServiceBerths as mockGetOutOfServiceBerths,
  markEnquiryArrived as mockMarkEnquiryArrived,
  markEnquiryDeparted as mockMarkEnquiryDeparted,
  reassignEnquiryBerth as mockReassignEnquiryBerth,
  setBerthOutOfService as mockSetBerthOutOfService,
  setEnquiryFlag as mockSetEnquiryFlag,
} from "@/data/mock/enquiries";
import {
  advanceRelettingStatus as mockAdvanceRelettingStatus,
  decideReletting as mockDecideReletting,
  getRelettingQueue as mockGetRelettingQueue,
} from "@/data/mock/reletting";
import { getCurrentUser, getStaffMemberships, signOut } from "@/data/mock/accounts";
import {
  getSupabaseStaffSession,
  readStaff,
  sendStaffSignInLink as supabaseSendSignInLink,
  signOutStaff as supabaseSignOut,
  writeStaff,
  type SignInLinkResult,
  type StaffSession,
} from "@/data/supabase/staff";

export type { SignInLinkResult, StaffSession };

export const STAFF_DATA_SOURCE: "supabase" | "mock" =
  process.env.NEXT_PUBLIC_STAFF_DATA === "mock" ? "mock" : "supabase";

type Result = { ok: true } | { ok: false; error: string };

function reader<A extends unknown[], T>(rule: (...args: A) => T, empty: () => NoInfer<T>) {
  return async (...args: A): Promise<T> =>
    STAFF_DATA_SOURCE === "mock" ? rule(...args) : readStaff(() => rule(...args), empty());
}

function writer<A extends unknown[], T extends Result>(rule: (...args: A) => T) {
  return async (...args: A): Promise<T | { ok: false; error: string }> =>
    STAFF_DATA_SOURCE === "mock" ? rule(...args) : writeStaff(() => rule(...args));
}

// ---- Session ----

export type StaffSignIn = {
  // The signed-in staff member. Null when no one is signed in, or the person
  // is not staff of any marina.
  session: StaffSession | null;
  // True when someone is signed in, staff or not.
  signedIn: boolean;
  // The signed-in address, staff or not. Empty when no one is signed in.
  email: string;
};

export async function getStaffSignIn(): Promise<StaffSignIn> {
  let session: StaffSession | null;
  if (STAFF_DATA_SOURCE === "mock") {
    const user = getCurrentUser();
    session = user
      ? {
          userId: user.id,
          email: user.email,
          marinaIds: getStaffMemberships(user.id).map((m) => m.marinaId),
          isAdmin: false,
        }
      : null;
  } else {
    session = await getSupabaseStaffSession();
  }
  return {
    session: session && session.marinaIds.length > 0 ? session : null,
    signedIn: session !== null,
    email: session?.email ?? "",
  };
}

export async function signOutStaff(): Promise<void> {
  if (STAFF_DATA_SOURCE === "mock") signOut();
  else await supabaseSignOut();
}

export async function sendStaffSignInLink(
  email: string,
  redirectTo: string
): Promise<SignInLinkResult> {
  return supabaseSendSignInLink(email, redirectTo);
}

// ---- Arrivals ----

export const getEnquiries = reader(mockGetEnquiries, () => []);
export const decideEnquiry = writer(mockDecideEnquiry);
export const reassignEnquiryBerth = writer(mockReassignEnquiryBerth);
export const markEnquiryArrived = writer(mockMarkEnquiryArrived);
export const markEnquiryDeparted = writer(mockMarkEnquiryDeparted);
export const setEnquiryFlag = writer(mockSetEnquiryFlag);

// ---- Berth map ----

export const getBerthStatuses = reader(mockGetBerthStatuses, () => ({}));

// The statuses for several marina and date pairs from one read, keyed
// "marinaId|date", for lists where each row needs its own day.
export const getBerthStatusesFor = reader(
  (pairs: { marinaId: string; dateIso: string }[]) =>
    Object.fromEntries(
      pairs.map((p) => [`${p.marinaId}|${p.dateIso}`, mockGetBerthStatuses(p.marinaId, p.dateIso)])
    ),
  () => ({})
);
export const suggestReleasedBerths = reader(mockSuggestReleasedBerths, () => []);
export const getOutOfServiceBerths = reader(mockGetOutOfServiceBerths, () => []);
export const setBerthOutOfService = writer(mockSetBerthOutOfService);
export const clearBerthOutOfService = writer(mockClearBerthOutOfService);

// ---- Relet approvals ----

export const getRelettingQueue = reader(mockGetRelettingQueue, () => []);
export const decideReletting = writer(mockDecideReletting);
export const advanceRelettingStatus = writer(mockAdvanceRelettingStatus);
