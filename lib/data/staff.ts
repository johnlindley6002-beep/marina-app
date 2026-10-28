// The staff back office's data: arrivals (enquiries), the berth map and relet
// approvals. Every function returns a Promise. By default they read and write
// Supabase; with NEXT_PUBLIC_STAFF_DATA=mock (the end-to-end tests) they run
// on the mock layer in the browser, exactly as before. The rules are the same
// code either way (data/mock), so the two cannot drift apart.

import { ALL_CAPABILITIES } from "@/features/staff/lib/roles";
import {
  getBerthStatuses as mockGetBerthStatuses,
  suggestReleasedBerths as mockSuggestReleasedBerths,
} from "@/data/mock/berthStatus";
import {
  checkBerthAvailability,
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
import { CLASS_BEAM_RANGES, CLASS_LENGTH_RANGES } from "@/data/marinas";
import { getAllBerths } from "@/data/berths";
import {
  getCurrentUser,
  getMarinaBerthLinks as mockGetMarinaBerthLinks,
  getStaffMemberships,
  signOut,
} from "@/data/mock/accounts";
import { emitChange } from "@/data/mock/storage";
import { effectiveEnquiryDeparture } from "@/lib/dates";
import {
  confirmArrival,
  declineArrival,
  endBerthHolding,
  getBerthPage,
  linkBerthHolder,
  proposeDates,
  subscribeToArrivals,
  suggestBerths,
  type ArrivalChange,
  type BerthPage,
  type BerthSuggestion,
  type StaffResult,
} from "@/data/supabase/arrivals";
import type { DbErrorKey } from "@/data/supabase/errors";
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
export { DOUBLE_BOOKED, SAVE_FAILED } from "@/data/supabase/staff";

// Reception, the berth planner, customers, dock tasks and the radio log run
// on Supabase only; in mock mode their screens show a note instead.
export {
  addRadioEntry,
  getCustomer,
  getPlannerBerths,
  getRadioLog,
  getReceptionRecord,
  listCustomers,
  radioEntryToArrival,
  saveReceptionDetails,
  setAuthorityFormalities,
  setDocumentsChecked,
  type Customer,
  type PlannerBerth,
  type RadioEntry,
  type ReceptionRecord,
} from "@/data/supabase/backoffice";

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
          // The browser mock has one kind of staff member, who may do
          // everything, so the end-to-end tests see every screen.
          memberId: null,
          role: "director",
          teamLead: false,
          displayName: user.name,
          capabilities: ALL_CAPABILITIES,
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

// The berths a berth holder holds today, from the marina's own records.
export const getMarinaBerthLinks = reader(mockGetMarinaBerthLinks, () => []);

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

// ---- Arrival requests: suggested berths and the three decisions ----

export type { BerthSuggestion } from "@/data/supabase/arrivals";
export type {
  ArrivalChange,
  BerthEvent,
  BerthHolding,
  BerthOffer,
  BerthPage,
  BerthStay,
} from "@/data/supabase/arrivals";

// Supabase answers with an error key the screens translate; the mock's rules
// answer with an English sentence.
export type RequestOutcome = { ok: true } | { ok: false; error: string; key?: DbErrorKey };

function outcome<T>(result: StaffResult<T>): RequestOutcome {
  emitChange();
  return result.ok ? { ok: true } : { ok: false, error: result.error, key: result.error };
}

function mockSuggestions(arrivalId: string): BerthSuggestion[] {
  const enquiry = mockGetEnquiries(getCurrentUser()?.id ?? null).find((e) => e.id === arrivalId);
  if (!enquiry) return [];
  const departure = effectiveEnquiryDeparture(enquiry);
  const loa = Number(enquiry.loa) || 0;
  const beam = Number(enquiry.beam) || 0;
  const held = new Set(mockGetMarinaBerthLinks(enquiry.marinaId).map((l) => l.berthId));
  return getAllBerths()
    .filter(
      (b) =>
        loa <= CLASS_LENGTH_RANGES[b.sizeClass].maxM &&
        beam <= CLASS_BEAM_RANGES[b.sizeClass] &&
        checkBerthAvailability(enquiry.marinaId, b.id, enquiry.arrival, departure).ok
    )
    .map((b) => ({
      berthKey: b.id,
      code: b.id,
      pontoon: b.pontoonId,
      sizeClass: b.sizeClass,
      maxLengthM: CLASS_LENGTH_RANGES[b.sizeClass].maxM,
      beamM: CLASS_BEAM_RANGES[b.sizeClass],
      draftM: 0,
      viaRelet: held.has(b.id),
    }))
    .sort(
      (a, b) =>
        Number(a.viaRelet) - Number(b.viaRelet) ||
        a.maxLengthM - loa - (b.maxLengthM - loa) ||
        a.code.localeCompare(b.code)
    )
    .slice(0, 8);
}

// Berths that fit the boat and are free for every night of the stay, including
// berths a berth holder offered while away. Staff only.
export async function getSuggestedBerths(arrivalId: string): Promise<BerthSuggestion[]> {
  if (STAFF_DATA_SOURCE === "mock") return mockSuggestions(arrivalId);
  return (await suggestBerths(arrivalId)) ?? [];
}

// Confirms the request into the berth in one step.
export async function confirmWithBerth(
  staffId: string | null,
  arrivalId: string,
  berthKey: string,
  note = ""
): Promise<RequestOutcome> {
  if (STAFF_DATA_SOURCE === "mock") {
    const result = mockDecideEnquiry(staffId, arrivalId, "approve", { berthId: berthKey });
    return result.ok ? { ok: true } : result;
  }
  return outcome(await confirmArrival(arrivalId, berthKey, note));
}

export async function declineWithReason(
  staffId: string | null,
  arrivalId: string,
  reason: string
): Promise<RequestOutcome> {
  if (STAFF_DATA_SOURCE === "mock") {
    const result = mockDecideEnquiry(staffId, arrivalId, "decline", { reason });
    return result.ok ? { ok: true } : result;
  }
  return outcome(await declineArrival(arrivalId, reason));
}

export async function proposeOtherDates(
  arrivalId: string,
  from: string,
  to: string,
  note: string
): Promise<RequestOutcome> {
  if (STAFF_DATA_SOURCE === "mock") {
    return { ok: false, error: "Proposing other dates needs the marina's database." };
  }
  return outcome(await proposeDates(arrivalId, from, to, note));
}

// ---- A berth's page ----

export async function getBerthPageData(marinaId: string, code: string): Promise<BerthPage | null> {
  if (STAFF_DATA_SOURCE === "mock") return null;
  return getBerthPage(marinaId, code);
}

export async function linkHolder(
  berthId: string,
  email: string,
  startsOn: string,
  endsOn: string,
  name: string
): Promise<RequestOutcome> {
  return outcome(await linkBerthHolder(berthId, email, startsOn, endsOn, name));
}

export async function endHolding(contractId: string): Promise<RequestOutcome> {
  return outcome(await endBerthHolding(contractId));
}

// Calls back when an arrival or relet offer of the staff member's marina
// changes, and refreshes every staff screen. Does nothing on the mock, where
// screens already follow the browser's own change event.
export function watchArrivals(onChange?: (change: ArrivalChange) => void): () => void {
  if (STAFF_DATA_SOURCE === "mock") return () => {};
  return subscribeToArrivals((change) => {
    emitChange();
    onChange?.(change);
  });
}
export * from "@/data/supabase/dock";
// Asks every open staff screen to read its data again.
export { emitChange as refreshStaffData } from "@/data/mock/storage";
