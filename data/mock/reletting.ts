// A berth holder's absence and the marina's consent to relet it: requests,
// notifications, the credit split, the owner's resumable wizard and calendar,
// and the staff approval queue.

import { getAllBerths } from "@/data/berths";
import { countNights, formatDayMonth, nightDates, todayIso } from "@/lib/dates";
import { fromCents, percentOfCents, toCents, type Cents } from "@/lib/money";
import { getSeasonForIso, marinas, type RelettingTerms } from "@/data/marinas";
import {
  RELETTING_KEY,
  DRAFT_KEY,
  readJson,
  writeJson,
  removeKey,
  emitChange,
  newId,
} from "./storage";
import {
  ACCOUNTS,
  BERTH_LINKS,
  getRoles,
  getOwnedBerths,
  isStaffOfMarina,
  type StaffActionResult,
} from "./accounts";

// ---------------------------------------------------------------------------
// Reletting a held berth while its holder is away
//
// LEGAL SHAPE (mocked here, enforced by the real backend later): a berth is a
// right of use on public maritime domain, so it can be relet only with the
// marina's PRIOR CONSENT. That is why a request starts as "submitted" and
// nothing is relet until marina staff approve it. The holder never sublets to a
// visitor directly: the marina manages and approves every stay.
// ---------------------------------------------------------------------------

export type RelettingStatus =
  | "submitted"
  | "approved"
  | "declined" // shown to the holder as "Not approved"
  | "cancelled"
  | "listed"
  | "booked"
  | "completed";

// The order a request moves through once approved.
export const RELETTING_PROGRESS: RelettingStatus[] = [
  "submitted",
  "approved",
  "listed",
  "booked",
  "completed",
];

export const RELETTING_STATUS_LABELS: Record<RelettingStatus, string> = {
  submitted: "Submitted",
  approved: "Approved",
  declined: "Not approved",
  cancelled: "Cancelled",
  listed: "Listed",
  booked: "Booked",
  completed: "Completed",
};

export type RelettingEvent = {
  status: RelettingStatus;
  at: string;
  // A short plain-language note, for example "Dates changed by the holder".
  note?: string;
};

// Set by staff when approving a request: what an incoming visitor's boat
// and dates must respect for this released berth. All optional; null/0 means
// no extra restriction beyond the marina's own defaults.
export type RelettingConditions = {
  maxLengthM: number | null;
  maxBeamM: number | null;
  earliestReletDate: string | null;
  bufferDays: number;
};

export type RelettingRequest = {
  id: string;
  userId: string;
  marinaId: string;
  berthId: string;
  startDate: string; // the day the holder leaves (ISO)
  endDate: string; // the day the holder returns (ISO)
  boatRemovalConfirmed: boolean;
  reletConsent: boolean;
  // Second, separate consent: the holder will not arrange any paid use of the
  // berth themselves outside the marina (art. 29(1)(i), art. 13(1)(m)).
  outsideArrangementConfirmed: boolean;
  termsAcceptedAt: string;
  readinessConfirmedAt: string;
  status: RelettingStatus;
  history: RelettingEvent[];
  decisionNote: string;
  // Set by staff on approval; null before a decision.
  conditions: RelettingConditions | null;
  // Set when the holder asks to return before the end date.
  earlyReturnRequestedAt: string | null;
  // The nights a visitor has booked. The marina may relet only some of the
  // nights on offer, so this can be fewer than the nights away. It is empty
  // until something is booked, and a request with any booked night is locked.
  bookedNights: string[];
  // The nights the marina has cleared for transient use, chosen when it
  // approves the request. Null before a decision, or when every offered night
  // was approved and never restricted.
  approvedNights: string[] | null;
  // Set when this request replaces one the marina did not approve.
  resubmitOf: string | null;
  // Filled in once a stay is booked (from the booked nights only).
  nightsRelet: number | null;
  grossEur: number | null;
  ownerShareEur: number | null;
  feeEur: number | null;
  netEur: number | null;
  createdAt: string;
};

export type MockNotification = {
  id: string;
  userId: string;
  kind: "approved" | "declined" | "booked" | "credit-applied";
  requestId: string;
  title: string;
  body: string;
  at: string;
  read: boolean;
};

export type ReletStore = {
  requests: RelettingRequest[];
  notifications: MockNotification[];
};

export type ReletSplit = {
  nights: number;
  grossEur: number;
  ownerShareEur: number;
  feeEur: number;
  netEur: number;
};

// The holder's credit before the marina's fee, from the marina's credit
// model: a percent of the tariff income, a fixed amount per night, or (for
// display) the nominal percent an incentive-next-year model would be worth.
export function creditBeforeFee(
  terms: RelettingTerms,
  grossCents: Cents,
  nightCount: number
): Cents {
  switch (terms.creditModel.kind) {
    case "percentage":
      return percentOfCents(grossCents, terms.creditModel.sharePercent * 100);
    case "fixed_per_night":
      return toCents(terms.creditModel.amountEur) * nightCount;
    case "incentive_next_year":
      return percentOfCents(grossCents, terms.creditModel.sharePercent * 100);
  }
}

// The money for a list of relet nights, from the marina's real tariff for the
// berth's class and its credit model and fee. The fee is a percent of the
// credit before fee, so net is credit minus fee. Pure and deterministic.
export function computeSplitForNights(
  marinaId: string,
  berthId: string,
  nights: string[]
): ReletSplit | null {
  const marina = marinas.find((m) => m.id === marinaId);
  const terms = marina?.reletting;
  const berth = getAllBerths().find((b) => b.id === berthId);
  if (!marina || !terms || !berth || nights.length === 0) return null;
  let grossCents = 0;
  for (const night of nights) {
    grossCents += toCents(marina.transientRates[berth.sizeClass][getSeasonForIso(night)]);
  }
  const shareCents = creditBeforeFee(terms, grossCents, nights.length);
  const feeCents = percentOfCents(shareCents, terms.processingFeePercent * 100);
  return {
    nights: nights.length,
    grossEur: fromCents(grossCents),
    ownerShareEur: fromCents(shareCents),
    feeEur: fromCents(feeCents),
    netEur: fromCents(shareCents - feeCents),
  };
}

// What the whole absence would earn if every night were relet. An ESTIMATE,
// never a promise: the marina may relet only some of the nights.
export function estimateReletting(
  marinaId: string,
  berthId: string,
  startDate: string,
  endDate: string
): ReletSplit | null {
  return computeSplitForNights(marinaId, berthId, nightDates(startDate, endDate));
}

export function buildSeedRelettingStore(): ReletStore {
  const all = nightDates("2026-07-06", "2026-07-20");
  const booked = all.slice(0, 12);
  const split = computeSplitForNights("cascais", "G-14", booked);
  const request: RelettingRequest = {
    id: "relet-seed-1",
    userId: "u-owner",
    marinaId: "cascais",
    berthId: "G-14",
    startDate: "2026-07-06",
    endDate: "2026-07-20",
    boatRemovalConfirmed: true,
    reletConsent: true,
    outsideArrangementConfirmed: true,
    termsAcceptedAt: "2026-06-10T09:00:00.000Z",
    readinessConfirmedAt: "2026-06-10T09:00:00.000Z",
    status: "completed",
    history: [
      { status: "submitted", at: "2026-06-10T09:00:00.000Z" },
      { status: "approved", at: "2026-06-12T10:30:00.000Z" },
      { status: "listed", at: "2026-06-13T08:00:00.000Z" },
      { status: "booked", at: "2026-06-20T14:15:00.000Z" },
      { status: "completed", at: "2026-07-21T09:00:00.000Z" },
    ],
    decisionNote: "",
    conditions: { maxLengthM: null, maxBeamM: null, earliestReletDate: null, bufferDays: 2 },
    earlyReturnRequestedAt: null,
    bookedNights: booked,
    approvedNights: all,
    resubmitOf: null,
    nightsRelet: split?.nights ?? null,
    grossEur: split?.grossEur ?? null,
    ownerShareEur: split?.ownerShareEur ?? null,
    feeEur: split?.feeEur ?? null,
    netEur: split?.netEur ?? null,
    createdAt: "2026-06-10T09:00:00.000Z",
  };
  const credit = split ? split.netEur.toFixed(2) : "0.00";
  return {
    requests: [request],
    notifications: [
      {
        id: "note-seed-1",
        userId: "u-owner",
        kind: "approved",
        requestId: request.id,
        title: "Reletting approved",
        body: "Marina de Cascais approved your request for 6 to 20 July.",
        at: "2026-06-12T10:30:00.000Z",
        read: true,
      },
      {
        id: "note-seed-2",
        userId: "u-owner",
        kind: "booked",
        requestId: request.id,
        title: "Your berth was booked",
        body: "A visitor booked your berth for part of your absence.",
        at: "2026-06-20T14:15:00.000Z",
        read: true,
      },
      {
        id: "note-seed-3",
        userId: "u-owner",
        kind: "credit-applied",
        requestId: request.id,
        title: "Credit applied",
        body: `A credit of \u20ac${credit} was applied to your berth account.`,
        at: "2026-07-21T09:00:00.000Z",
        read: false,
      },
    ],
  };
}

export function loadReletStore(): ReletStore {
  const stored = readJson<ReletStore>(RELETTING_KEY);
  if (!stored) return buildSeedRelettingStore();
  // Older stored requests lack the newer fields.
  return {
    ...stored,
    requests: stored.requests.map((r) => ({
      ...r,
      bookedNights:
        r.bookedNights ??
        (r.nightsRelet ? nightDates(r.startDate, r.endDate).slice(0, r.nightsRelet) : []),
      approvedNights:
        r.approvedNights ?? (r.status === "submitted" ? null : nightDates(r.startDate, r.endDate)),
      resubmitOf: r.resubmitOf ?? null,
    })),
  };
}

export function saveReletStore(store: ReletStore) {
  writeJson(RELETTING_KEY, store);
  emitChange();
}

export const ACTIVE_STATUSES: RelettingStatus[] = ["submitted", "approved", "listed", "booked"];

// ---- Owner side ----

// The holder's own requests, newest first.
export function getRelettingRequests(userId: string | null): RelettingRequest[] {
  if (!userId) return [];
  return loadReletStore()
    .requests.filter((r) => r.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export type SubmitRelettingInput = {
  berthId: string;
  startDate: string;
  endDate: string;
  boatRemovalConfirmed: boolean;
  reletConsent: boolean;
  outsideArrangementConfirmed: boolean;
  termsAccepted: boolean;
  readinessConfirmed: boolean;
  // When set, this replaces a request the marina did not approve.
  resubmitOf?: string;
};

export type SubmitRelettingResult =
  { ok: true; request: RelettingRequest } | { ok: false; error: string };

// This is the marina PRIOR-CONSENT step: it only ever creates a "submitted"
// request. The real backend must check server-side that the caller holds the
// berth (owner role via an active berth link), that every consent is true, and
// that the dates are valid and do not overlap, exactly as done here.
export function submitRelettingRequest(
  userId: string | null,
  input: SubmitRelettingInput
): SubmitRelettingResult {
  const berth = getOwnedBerths(userId).find((b) => b.berthId === input.berthId);
  if (!userId || !berth) {
    return { ok: false, error: "Only the holder of this berth can make it available." };
  }
  const terms = marinas.find((m) => m.id === berth.marinaId)?.reletting;
  if (!terms) {
    return { ok: false, error: "This marina does not offer reletting." };
  }
  if (terms.reletAllowed !== "marina_mediated") {
    return { ok: false, error: "This marina does not offer a marina-mediated relet." };
  }
  const nights = countNights(input.startDate, input.endDate);
  if (nights < 1) {
    return { ok: false, error: "Choose a return date after the day you leave." };
  }
  if (input.startDate < todayIso()) {
    return { ok: false, error: "The day you leave cannot be in the past." };
  }
  if (
    !input.boatRemovalConfirmed ||
    !input.reletConsent ||
    !input.outsideArrangementConfirmed ||
    !input.termsAccepted ||
    !input.readinessConfirmed
  ) {
    return {
      ok: false,
      error: "Every confirmation is needed before the marina can consider your request.",
    };
  }
  const store = loadReletStore();
  if (input.resubmitOf) {
    const original = store.requests.find((r) => r.id === input.resubmitOf);
    if (!original || original.userId !== userId || original.status !== "declined") {
      return { ok: false, error: "Only a request the marina did not approve can be resubmitted." };
    }
  }
  const overlaps = store.requests.some(
    (r) =>
      r.userId === userId &&
      r.berthId === input.berthId &&
      ACTIVE_STATUSES.includes(r.status) &&
      input.startDate < r.endDate &&
      r.startDate < input.endDate
  );
  if (overlaps) {
    return { ok: false, error: "You already have a request that overlaps these dates." };
  }
  const now = new Date().toISOString();
  const request: RelettingRequest = {
    id: newId("relet"),
    userId,
    marinaId: berth.marinaId,
    berthId: berth.berthId,
    startDate: input.startDate,
    endDate: input.endDate,
    boatRemovalConfirmed: true,
    reletConsent: true,
    outsideArrangementConfirmed: true,
    termsAcceptedAt: now,
    readinessConfirmedAt: now,
    status: "submitted",
    history: [
      {
        status: "submitted",
        at: now,
        note: input.resubmitOf ? "Adjusted and sent again after it was not approved" : undefined,
      },
    ],
    decisionNote: "",
    conditions: null,
    earlyReturnRequestedAt: null,
    bookedNights: [],
    approvedNights: null,
    resubmitOf: input.resubmitOf ?? null,
    nightsRelet: null,
    grossEur: null,
    ownerShareEur: null,
    feeEur: null,
    netEur: null,
    createdAt: now,
  };
  saveReletStore({ ...store, requests: [request, ...store.requests] });
  return { ok: true, request };
}

export function getNotifications(userId: string | null): MockNotification[] {
  if (!userId) return [];
  return loadReletStore()
    .notifications.filter((n) => n.userId === userId)
    .sort((a, b) => b.at.localeCompare(a.at));
}

export function markNotificationsRead(userId: string | null): void {
  if (!userId) return;
  const store = loadReletStore();
  saveReletStore({
    ...store,
    notifications: store.notifications.map((n) => (n.userId === userId ? { ...n, read: true } : n)),
  });
}

// ---- Staff side ----

export type RelettingQueueItem = {
  request: RelettingRequest;
  ownerName: string;
  boatName: string;
  berthClass: string | null;
  estimate: ReletSplit | null;
};

export function dateLabel(iso: string): string {
  return formatDayMonth(iso);
}

export function formatWindow(startIso: string, endIso: string): string {
  return `available ${dateLabel(startIso)} to ${dateLabel(endIso)}`;
}

// Only requests for marinas the staff member belongs to. The real backend must
// filter by the staff membership server-side, never trust the client.
export function getRelettingQueue(staffUserId: string | null): RelettingQueueItem[] {
  if (!staffUserId) return [];
  const allBerths = getAllBerths();
  return loadReletStore()
    .requests.filter((r) => isStaffOfMarina(staffUserId, r.marinaId))
    .map((request) => {
      const owner = ACCOUNTS.find((a) => a.id === request.userId);
      const link = BERTH_LINKS.find(
        (l) => l.userId === request.userId && l.berthId === request.berthId
      );
      return {
        request,
        ownerName: owner?.name ?? "Berth holder",
        boatName: link?.boatOnFile.name ?? "",
        berthClass: allBerths.find((b) => b.id === request.berthId)?.sizeClass ?? null,
        estimate: estimateReletting(
          request.marinaId,
          request.berthId,
          request.startDate,
          request.endDate
        ),
      };
    })
    .sort((a, b) => {
      const rank = (s: RelettingStatus) =>
        s === "submitted" ? 0 : ACTIVE_STATUSES.includes(s) ? 1 : 2;
      return (
        rank(a.request.status) - rank(b.request.status) ||
        a.request.startDate.localeCompare(b.request.startDate)
      );
    });
}

export function withEvent(request: RelettingRequest, status: RelettingStatus): RelettingRequest {
  return {
    ...request,
    status,
    history: [...request.history, { status, at: new Date().toISOString() }],
  };
}

export function notification(
  request: RelettingRequest,
  kind: MockNotification["kind"],
  title: string,
  body: string
): MockNotification {
  return {
    id: newId("note"),
    userId: request.userId,
    kind,
    requestId: request.id,
    title,
    body,
    at: new Date().toISOString(),
    read: false,
  };
}

// The marina's consent decision. Only staff of that marina, only on a
// submitted request.
export function decideReletting(
  staffUserId: string | null,
  requestId: string,
  decision: "approve" | "decline",
  note = "",
  // The nights to clear for transient use. Defaults to every night offered.
  // Fewer than that is a partial approval, reflected in the owner's ledger.
  approvedNights?: string[],
  // Conditions for the incoming visitor's boat and dates, set on approval.
  conditions?: RelettingConditions
): StaffActionResult {
  const store = loadReletStore();
  const request = store.requests.find((r) => r.id === requestId);
  if (!request) return { ok: false, error: "Request not found." };
  if (!isStaffOfMarina(staffUserId, request.marinaId)) {
    return { ok: false, error: "Only staff of this marina can decide." };
  }
  if (request.status !== "submitted") {
    return { ok: false, error: "This request has already been decided." };
  }
  const offered = nightDates(request.startDate, request.endDate);
  const cleared =
    decision === "approve" ? (approvedNights ?? offered).filter((n) => offered.includes(n)) : null;
  const span = `${dateLabel(request.startDate)} to ${dateLabel(request.endDate)}`;
  const partial = cleared !== null && cleared.length < offered.length;
  const next = {
    ...withEvent(request, decision === "approve" ? "approved" : "declined"),
    decisionNote: note.trim(),
    approvedNights: cleared,
    conditions: decision === "approve" ? (conditions ?? request.conditions) : request.conditions,
  };
  const message =
    decision === "approve"
      ? notification(
          next,
          "approved",
          "Reletting approved",
          partial
            ? `Marina de Cascais approved ${cleared!.length} of your ${offered.length} nights for ${span}.`
            : `Marina de Cascais approved your request for ${span}.`
        )
      : notification(
          next,
          "declined",
          "Reletting not approved",
          `Marina de Cascais did not approve your request for ${span}.${note.trim() ? ` Reason: ${note.trim().replace(/[.]+$/, "")}.` : ""} You can adjust it and send it again.`
        );
  saveReletStore({
    requests: store.requests.map((r) => (r.id === requestId ? next : r)),
    notifications: [message, ...store.notifications],
  });
  return { ok: true };
}

// MOCK ONLY. Moves an approved request through listed, booked and completed so
// the ledger and notifications can be previewed. In reality these come from the
// marina's own system and from real visitor bookings, not from a button.
export function advanceRelettingStatus(
  staffUserId: string | null,
  requestId: string,
  options: { nightsBooked?: number } = {}
): StaffActionResult {
  const store = loadReletStore();
  const request = store.requests.find((r) => r.id === requestId);
  if (!request) return { ok: false, error: "Request not found." };
  if (!isStaffOfMarina(staffUserId, request.marinaId)) {
    return { ok: false, error: "Only staff of this marina can do this." };
  }
  const index = RELETTING_PROGRESS.indexOf(request.status);
  const nextStatus = RELETTING_PROGRESS[index + 1];
  if (request.status === "declined" || index < 1 || !nextStatus) {
    return { ok: false, error: "There is no next step for this request." };
  }
  let next = withEvent(request, nextStatus);
  const added: MockNotification[] = [];

  if (nextStatus === "booked") {
    // Mock: a visitor books some of the APPROVED nights, as a run from the
    // first one. The staff member chooses how many.
    const all = request.approvedNights ?? nightDates(request.startDate, request.endDate);
    const wanted = Math.round(options.nightsBooked ?? defaultNightsBooked(all.length));
    const booked = all.slice(0, Math.min(Math.max(wanted, 1), all.length));
    const split = computeSplitForNights(request.marinaId, request.berthId, booked);
    if (split) {
      next = {
        ...next,
        bookedNights: booked,
        nightsRelet: split.nights,
        grossEur: split.grossEur,
        ownerShareEur: split.ownerShareEur,
        feeEur: split.feeEur,
        netEur: split.netEur,
      };
    }
    added.push(
      notification(
        next,
        "booked",
        "Your berth was booked",
        `A visitor booked ${next.bookedNights.length} of your ${all.length} nights.`
      )
    );
  }
  if (nextStatus === "completed" && next.netEur !== null) {
    added.push(
      notification(
        next,
        "credit-applied",
        "Credit applied",
        `A credit of \u20ac${next.netEur.toFixed(2)} was applied to your berth account.`
      )
    );
  }
  saveReletStore({
    requests: store.requests.map((r) => (r.id === requestId ? next : r)),
    notifications: [...added, ...store.notifications],
  });
  return { ok: true };
}

// DEV ONLY: back to the seed data.
export function resetMockReletting(): void {
  removeKey(RELETTING_KEY);
  removeKey(DRAFT_KEY);
  emitChange();
}

// The nights a mock booking covers by default: all but two, and at least one.
export function defaultNightsBooked(totalNights: number): number {
  return totalNights > 3 ? totalNights - 2 : totalNights;
}

// ---- Owner: change or cancel ----

// A request can be changed or cancelled until any night is booked. Once a
// visitor has booked, the marina has made a commitment, so it is locked.
export function isRelettingEditable(request: RelettingRequest): boolean {
  return (
    ["submitted", "approved", "listed"].includes(request.status) &&
    request.bookedNights.length === 0
  );
}

export function isRelettingLocked(request: RelettingRequest): boolean {
  return (
    request.status === "booked" || (request.status === "listed" && request.bookedNights.length > 0)
  );
}

export function ownedRequest(
  userId: string | null,
  requestId: string
): { store: ReletStore; request: RelettingRequest } | null {
  if (!userId || !getRoles(userId).includes("owner")) return null;
  const store = loadReletStore();
  const request = store.requests.find((r) => r.id === requestId);
  return request && request.userId === userId ? { store, request } : null;
}

export type ChangeRelettingResult =
  { ok: true; request: RelettingRequest } | { ok: false; error: string };

// Change the dates of a request that is still Submitted, Approved or Listed
// with nothing booked. The marina consented to the OLD dates, so an approved or
// listed request goes back to "submitted" and needs consent again. The real
// backend must enforce all of this server-side.
export function updateRelettingRequest(
  userId: string | null,
  requestId: string,
  dates: { startDate: string; endDate: string }
): ChangeRelettingResult {
  const found = ownedRequest(userId, requestId);
  if (!found) return { ok: false, error: "Only the holder can change this request." };
  const { store, request } = found;
  if (!isRelettingEditable(request)) {
    return { ok: false, error: "A visitor has booked this, so it can no longer be changed here." };
  }
  if (countNights(dates.startDate, dates.endDate) < 1) {
    return { ok: false, error: "Choose a return date after the day you leave." };
  }
  if (dates.startDate < todayIso()) {
    return { ok: false, error: "The day you leave cannot be in the past." };
  }
  const overlaps = store.requests.some(
    (r) =>
      r.id !== request.id &&
      r.userId === request.userId &&
      r.berthId === request.berthId &&
      ACTIVE_STATUSES.includes(r.status) &&
      dates.startDate < r.endDate &&
      r.startDate < dates.endDate
  );
  if (overlaps) {
    return { ok: false, error: "You already have a request that overlaps these dates." };
  }
  const now = new Date().toISOString();
  const needsConsent = request.status !== "submitted";
  const next: RelettingRequest = {
    ...request,
    startDate: dates.startDate,
    endDate: dates.endDate,
    status: "submitted",
    history: [
      ...request.history,
      {
        status: "submitted",
        at: now,
        note: needsConsent
          ? "Dates changed by the holder, so the marina's consent is needed again"
          : "Dates changed by the holder",
      },
    ],
  };
  saveReletStore({
    ...store,
    requests: store.requests.map((r) => (r.id === requestId ? next : r)),
  });
  return { ok: true, request: next };
}

export function cancelRelettingRequest(
  userId: string | null,
  requestId: string
): ChangeRelettingResult {
  const found = ownedRequest(userId, requestId);
  if (!found) return { ok: false, error: "Only the holder can cancel this request." };
  const { store, request } = found;
  if (!isRelettingEditable(request)) {
    return {
      ok: false,
      error: "A visitor has booked this, so it cannot be cancelled here. Contact the marina.",
    };
  }
  const next: RelettingRequest = {
    ...request,
    status: "cancelled",
    history: [
      ...request.history,
      { status: "cancelled", at: new Date().toISOString(), note: "Cancelled by the holder" },
    ],
  };
  saveReletStore({
    ...store,
    requests: store.requests.map((r) => (r.id === requestId ? next : r)),
  });
  return { ok: true, request: next };
}

// The holder asks to come back before the end date. Recorded for the marina
// to see; the marina either finds the holder a temporary berth or asks them
// to coordinate with whoever is aboard, per its own rule (mocked as a note).
export function requestEarlyReturn(
  userId: string | null,
  requestId: string
): ChangeRelettingResult {
  const found = ownedRequest(userId, requestId);
  if (!found) return { ok: false, error: "Only the holder can do this." };
  const { store, request } = found;
  if (!["approved", "listed", "booked"].includes(request.status)) {
    return { ok: false, error: "This request is not currently active." };
  }
  if (request.earlyReturnRequestedAt) {
    return { ok: true, request };
  }
  const next: RelettingRequest = {
    ...request,
    earlyReturnRequestedAt: new Date().toISOString(),
    history: [
      ...request.history,
      {
        status: request.status,
        at: new Date().toISOString(),
        note: "Holder asked to return early",
      },
    ],
  };
  saveReletStore({
    ...store,
    requests: store.requests.map((r) => (r.id === requestId ? next : r)),
  });
  return { ok: true, request: next };
}

// ---- Owner: a wizard that can be resumed ----

export type RelettingDraft = {
  mode: "new" | "edit" | "resubmit";
  // The request being changed or replaced, for edit and resubmit.
  requestId: string | null;
  step: number;
  startDate: string;
  endDate: string;
  boatRemoval: boolean;
  consent: boolean;
  outsideArrangementConfirmed: boolean;
  termsAccepted: boolean;
  boatReady: boolean;
  berthReady: boolean;
  updatedAt: string;
};

export type DraftStore = Record<string, RelettingDraft>;

export function getRelettingDraft(userId: string | null): RelettingDraft | null {
  if (!userId) return null;
  return readJson<DraftStore>(DRAFT_KEY)?.[userId] ?? null;
}

export function saveRelettingDraft(
  userId: string | null,
  draft: Omit<RelettingDraft, "updatedAt">
): void {
  if (!userId) return;
  const all = readJson<DraftStore>(DRAFT_KEY) ?? {};
  all[userId] = { ...draft, updatedAt: new Date().toISOString() };
  writeJson(DRAFT_KEY, all);
  emitChange();
}

export function clearRelettingDraft(userId: string | null): void {
  if (!userId) return;
  const all = readJson<DraftStore>(DRAFT_KEY) ?? {};
  delete all[userId];
  writeJson(DRAFT_KEY, all);
  emitChange();
}

// Opens the wizard pre-filled from an existing request. Consents already given
// stay ticked, so changing dates is quick.
export function startRelettingDraftFrom(
  userId: string | null,
  requestId: string,
  mode: "edit" | "resubmit"
): boolean {
  const found = ownedRequest(userId, requestId);
  if (!found) return false;
  const { request } = found;
  if (mode === "edit" && !isRelettingEditable(request)) return false;
  if (mode === "resubmit" && request.status !== "declined") return false;
  saveRelettingDraft(userId, {
    mode,
    requestId,
    step: 1,
    startDate: request.startDate,
    endDate: request.endDate,
    boatRemoval: true,
    consent: true,
    outsideArrangementConfirmed: true,
    termsAccepted: true,
    boatReady: true,
    berthReady: true,
  });
  return true;
}

// ---- Owner: a month calendar of the berth ----

export type CalendarState = "none" | "awaiting" | "open" | "booked" | "away";

export type CalendarDay = {
  iso: string;
  day: number;
  inMonth: boolean;
  state: CalendarState;
};

export const CALENDAR_RANK: Record<CalendarState, number> = {
  none: 0,
  away: 1,
  awaiting: 2,
  open: 3,
  booked: 4,
};

// A month as weeks starting on Monday. Each night of an absence is marked:
// booked (a visitor has it), open (approved or listed and still free), awaiting
// (submitted, not yet approved) or away (a finished absence's unbooked night).
export function getBerthCalendar(
  userId: string | null,
  year: number,
  monthIndex: number
): { label: string; days: CalendarDay[] } {
  const requests = getRelettingRequests(userId);
  const stateByNight = new Map<string, CalendarState>();
  const mark = (night: string, state: CalendarState) => {
    const current = stateByNight.get(night) ?? "none";
    if (CALENDAR_RANK[state] > CALENDAR_RANK[current]) stateByNight.set(night, state);
  };
  for (const r of requests) {
    if (r.status === "declined" || r.status === "cancelled") continue;
    for (const night of nightDates(r.startDate, r.endDate)) {
      if (r.bookedNights.includes(night)) mark(night, "booked");
      else if (r.status === "submitted") mark(night, "awaiting");
      else if (r.status === "completed") mark(night, "away");
      else mark(night, "open");
    }
  }
  const first = new Date(year, monthIndex, 1);
  const offset = (first.getDay() + 6) % 7; // Monday first
  const start = new Date(year, monthIndex, 1 - offset);
  const pad = (n: number) => String(n).padStart(2, "0");
  const days: CalendarDay[] = [];
  const cursor = new Date(start);
  for (let i = 0; i < 42; i++) {
    const iso = `${cursor.getFullYear()}-${pad(cursor.getMonth() + 1)}-${pad(cursor.getDate())}`;
    days.push({
      iso,
      day: cursor.getDate(),
      inMonth: cursor.getMonth() === monthIndex,
      state: stateByNight.get(iso) ?? "none",
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  // Drop a trailing week that holds no day of this month.
  const trimmed = days.slice(35).some((d) => d.inMonth) ? days : days.slice(0, 35);
  return {
    label: new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(first),
    days: trimmed,
  };
}

// DEV ONLY: an owner with nothing yet, to see the first-time view.
export function emptyMockReletting(): void {
  writeJson(RELETTING_KEY, { requests: [], notifications: [] });
  removeKey(DRAFT_KEY);
  emitChange();
}
