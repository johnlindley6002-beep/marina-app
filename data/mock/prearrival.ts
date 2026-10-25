// The boater's pre-arrival check-in: the autosaved draft (one per marina, on
// this device) and the submitted check-ins staff see. No sign-in is needed,
// the same as the enquiry form. Nothing is sent anywhere.

import { type PreArrivalDraft } from "@/features/prearrival/lib/schema";
import {
  PREARRIVAL_DRAFT_KEY,
  PREARRIVAL_KEY,
  readJson,
  writeJson,
  removeKey,
  emitChange,
  newId,
} from "./storage";
import { isStaffOfMarina, type StaffActionResult } from "./accounts";

// ============================================================================
// PRE-ARRIVAL CHECK-IN
//
// The voyager's multi-step pre-arrival wizard (features/prearrival). No sign-in is required to fill it in or submit it, the same
// as the enquiry form: the draft autosaves under a local, device-only key, and
// a submitted check-in is stored with a short reference code the boater can
// quote at the marina office. Nothing here is sent anywhere; it is a
// front-end mockup of what the marina's own system would record.
// ============================================================================

export type PreArrivalCheckIn = {
  id: string;
  referenceCode: string;
  marinaId: string;
  draft: PreArrivalDraft;
  submittedAt: string;
  // Set by staff when the boat actually checks in at the desk; moves the
  // arrivals-board card from Ready to Berthed.
  checkedInAt: string | null;
};

export type PreArrivalDraftStore = Record<string, PreArrivalDraft>;
export type PreArrivalCheckInStore = { checkIns: PreArrivalCheckIn[] };

// One in-progress draft per marina on this device (a boater is not signed in,
// so there is no per-user key to use, unlike the reletting drafts above).
export function getPreArrivalDraft(marinaId: string): PreArrivalDraft | null {
  return readJson<PreArrivalDraftStore>(PREARRIVAL_DRAFT_KEY)?.[marinaId] ?? null;
}

export function savePreArrivalDraft(marinaId: string, draft: PreArrivalDraft): void {
  const all = readJson<PreArrivalDraftStore>(PREARRIVAL_DRAFT_KEY) ?? {};
  all[marinaId] = draft;
  writeJson(PREARRIVAL_DRAFT_KEY, all);
  emitChange();
}

export function clearPreArrivalDraft(marinaId: string): void {
  const all = readJson<PreArrivalDraftStore>(PREARRIVAL_DRAFT_KEY) ?? {};
  delete all[marinaId];
  writeJson(PREARRIVAL_DRAFT_KEY, all);
  emitChange();
}

export function loadPreArrivalStore(): PreArrivalCheckInStore {
  return readJson<PreArrivalCheckInStore>(PREARRIVAL_KEY) ?? { checkIns: [] };
}

// "CAS-7F3K2Q" style: a marina prefix (first three letters of its id, upper
// case) plus six characters from a fresh id, short enough to read aloud at
// the reception desk.
export function newReferenceCode(marinaId: string): string {
  const prefix = marinaId.slice(0, 3).toUpperCase();
  const raw = newId("ref").split("-").pop() ?? "000000";
  return `${prefix}-${raw.slice(0, 6).toUpperCase()}`;
}

export function submitPreArrivalCheckIn(
  marinaId: string,
  draft: PreArrivalDraft
): PreArrivalCheckIn {
  const store = loadPreArrivalStore();
  const checkIn: PreArrivalCheckIn = {
    id: newId("prearrival"),
    referenceCode: newReferenceCode(marinaId),
    marinaId,
    draft,
    submittedAt: new Date().toISOString(),
    checkedInAt: null,
  };
  writeJson(PREARRIVAL_KEY, { checkIns: [checkIn, ...store.checkIns] });
  emitChange();
  clearPreArrivalDraft(marinaId);
  return checkIn;
}

export function getPreArrivalCheckIn(id: string): PreArrivalCheckIn | null {
  return loadPreArrivalStore().checkIns.find((c) => c.id === id) ?? null;
}

// Every submitted check-in on this device, newest first. A boater is not
// signed in, so this is device-only, exactly like the drafts above.
export function getAllPreArrivalCheckIns(): PreArrivalCheckIn[] {
  return loadPreArrivalStore().checkIns;
}

// The check-ins staff of a marina can see, for the arrivals board's
// pre-arrival panel. In the real product this would be scoped server-side by
// marina the same way enquiries and reletting requests are.
export function getPreArrivalCheckInsForStaff(staffUserId: string | null): PreArrivalCheckIn[] {
  if (!staffUserId) return [];
  return loadPreArrivalStore().checkIns.filter((c) => isStaffOfMarina(staffUserId, c.marinaId));
}

// Every in-progress draft on this device, one per marina, for the "upcoming
// stays" list in My boat.
export function getAllPreArrivalDrafts(): { marinaId: string; draft: PreArrivalDraft }[] {
  const all = readJson<PreArrivalDraftStore>(PREARRIVAL_DRAFT_KEY) ?? {};
  return Object.entries(all).map(([marinaId, draft]) => ({ marinaId, draft }));
}

export function markPreArrivalCheckedIn(id: string): StaffActionResult {
  const store = loadPreArrivalStore();
  const checkIn = store.checkIns.find((c) => c.id === id);
  if (!checkIn) return { ok: false, error: "Check-in not found." };
  if (checkIn.checkedInAt) return { ok: true };
  writeJson(PREARRIVAL_KEY, {
    checkIns: store.checkIns.map((c) =>
      c.id === id ? { ...c, checkedInAt: new Date().toISOString() } : c
    ),
  });
  emitChange();
  return { ok: true };
}

// The people list from the most recently submitted check-in on this device,
// for the "Reuse crew from my last trip" toggle. Not scoped to one marina, a
// boater's crew is usually the same wherever they are headed next.
export function getLastSubmittedCrew(): PreArrivalDraft["people"] {
  return loadPreArrivalStore().checkIns[0]?.draft.people ?? [];
}

// DEV ONLY: back to no drafts or submitted check-ins.
export function resetMockPreArrival(): void {
  removeKey(PREARRIVAL_DRAFT_KEY);
  removeKey(PREARRIVAL_KEY);
  emitChange();
}
