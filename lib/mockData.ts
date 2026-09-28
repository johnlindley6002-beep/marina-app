// ============================================================================
// MOCK DATA LAYER. THIS IS NOT A BACKEND.
//
// Everything about accounts, roles and owned berths lives behind the named
// functions exported here. Screens and providers must call ONLY these
// functions and never hold account or role logic themselves, so the bodies can
// later be swapped for Supabase (auth, row-level security, tables) without any
// UI change. Today the functions return hardcoded seed data or read and write
// localStorage (always inside try/catch, and everything works when empty).
//
// Delete or replace this file when the real backend arrives. Nothing here is
// secure: it is client-side and can be edited in the browser.
// ============================================================================

import { getAllBerths } from "../data/berths";
import {
  CLASS_BEAM_RANGES,
  CLASS_LENGTH_RANGES,
  getSeason,
  marinas,
  type MarinaClass,
  type RelettingTerms,
} from "../data/marinas";
import type { PreArrivalDraft } from "./prearrival/schema";

export type Role = "voyager" | "owner" | "staff";
export type Mode = "guest" | "owner";

export const MOCK_CHANGED_EVENT = "aldock-mock-changed";
const SESSION_KEY = "aldock-mock-session";
const MODE_KEY = "aldock-mode";
const PROFILE_KEY = "aldock-mock-profiles";
const RELETTING_KEY = "aldock-mock-reletting";
const DRAFT_KEY = "aldock-mock-relet-drafts";
const ENQUIRY_KEY = "aldock-mock-enquiries";
const OOS_KEY = "aldock-mock-berth-oos";
const PREARRIVAL_DRAFT_KEY = "aldock-prearrival-drafts";
const PREARRIVAL_KEY = "aldock-prearrival-checkins";

// ---------------------------------------------------------------------------
// Stored records (what a real database would hold)
// ---------------------------------------------------------------------------

// An account. Note that it carries NO roles: roles are derived (see getRoles).
type AccountRecord = {
  id: string;
  name: string;
  email: string;
  phone: string;
  // True when the person signed up themselves as a voyager. A staff member
  // created through an invitation has this false, so staff stays separate.
  selfSignedUp: boolean;
};

type BoatRecord = {
  name: string;
  type: string;
  loa: string;
  beam: string;
  draft: string;
  flag: string;
};

// Created by a MARINA when it links a berth to a person. This is the only way
// the owner role can come to exist. The person cannot create or edit it.
type BerthLinkRecord = {
  id: string;
  userId: string;
  marinaId: string;
  berthId: string;
  linkedAt: string; // ISO date
  // A released link (the berth was sold or the agreement ended) grants nothing.
  active: boolean;
  boatOnFile: BoatRecord;
};

// Created by a MARINA to invite someone as staff. It grants the staff role
// only once the invited person has accepted it.
type StaffInvitationRecord = {
  id: string;
  userId: string;
  marinaId: string;
  invitedAt: string; // ISO date
  status: "pending" | "accepted" | "revoked";
};

const ACCOUNTS: AccountRecord[] = [
  {
    id: "u-voyager",
    name: "Alex Morgan",
    email: "alex.morgan@example.com",
    phone: "+44 7700 900101",
    selfSignedUp: true,
  },
  {
    id: "u-owner",
    name: "Jordan Reyes",
    email: "jordan.reyes@example.com",
    phone: "+351 912 000 202",
    selfSignedUp: true,
  },
  {
    id: "u-staff",
    name: "Sam Okafor",
    email: "sam.okafor@example.com",
    phone: "+351 214 000 303",
    selfSignedUp: false,
  },
];

const BERTH_LINKS: BerthLinkRecord[] = [
  {
    id: "link-1",
    userId: "u-owner",
    marinaId: "cascais",
    berthId: "G-14",
    linkedAt: "2026-03-12",
    active: true,
    boatOnFile: {
      name: "Mar Azul",
      type: "sail",
      loa: "7.6",
      beam: "2.9",
      draft: "1.4",
      flag: "Portugal",
    },
  },
  // A released link. The plain voyager once held a berth, but the link is no
  // longer active, so it must NOT grant the owner role.
  {
    id: "link-2",
    userId: "u-voyager",
    marinaId: "cascais",
    berthId: "P-12",
    linkedAt: "2024-05-02",
    active: false,
    boatOnFile: {
      name: "Wind Song",
      type: "sail",
      loa: "8.8",
      beam: "3.0",
      draft: "1.5",
      flag: "United Kingdom",
    },
  },
];

const STAFF_INVITATIONS: StaffInvitationRecord[] = [
  {
    id: "invite-1",
    userId: "u-staff",
    marinaId: "cascais",
    invitedAt: "2026-01-20",
    status: "accepted",
  },
  // A pending invitation. Until it is accepted it grants nothing.
  {
    id: "invite-2",
    userId: "u-voyager",
    marinaId: "cascais",
    invitedAt: "2026-09-01",
    status: "pending",
  },
];

// ---------------------------------------------------------------------------
// Storage helpers (client only, never throw)
// ---------------------------------------------------------------------------

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function removeKey(key: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Storage blocked: nothing to remove.
  }
}

function emitChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(MOCK_CHANGED_EVENT));
}

// The storage keys, so a provider can react to changes made in another tab.
export const MOCK_STORAGE_KEYS = [
  SESSION_KEY,
  MODE_KEY,
  PROFILE_KEY,
  RELETTING_KEY,
  DRAFT_KEY,
  ENQUIRY_KEY,
  OOS_KEY,
  PREARRIVAL_DRAFT_KEY,
  PREARRIVAL_KEY,
];

// ---------------------------------------------------------------------------
// Role rules (mocked here, enforced by the real backend later)
// ---------------------------------------------------------------------------

// Whether a person can grant themselves a role.
//
//   voyager: YES. It is the default for anyone who signs up.
//   owner:   NO. Only a marina linking a berth to them creates it. In the real
//            backend this is a marina-side action, and every owner-only read or
//            write must be checked server-side (row-level security on the
//            berth links), never trusted from the client.
//   staff:   NO. Only a marina inviting them, and them accepting, creates it.
//            The real backend must verify the invitation server-side too.
export function canSelfAssignRole(role: Role): boolean {
  return role === "voyager";
}

// Roles are DERIVED from records, never stored on the account, so there is no
// field the UI could set to grant one. The real backend should derive them the
// same way (from the berth link and invitation tables).
export function getRoles(userId: string | null): Role[] {
  if (!userId) return [];
  const account = ACCOUNTS.find((a) => a.id === userId);
  if (!account) return [];
  const roles: Role[] = [];
  if (account.selfSignedUp) roles.push("voyager");
  if (BERTH_LINKS.some((l) => l.userId === userId && l.active)) {
    roles.push("owner");
  }
  if (
    STAFF_INVITATIONS.some((i) => i.userId === userId && i.status === "accepted")
  ) {
    roles.push("staff");
  }
  return roles;
}

// ---------------------------------------------------------------------------
// Session, profile and mode
// ---------------------------------------------------------------------------

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  initials: string;
  roles: Role[];
};

type ProfileOverrides = Record<
  string,
  Partial<Pick<AccountRecord, "name" | "email" | "phone">>
>;

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

function getSessionUserId(): string | null {
  const session = readJson<{ userId: string | null }>(SESSION_KEY);
  const id = session?.userId ?? null;
  return id && ACCOUNTS.some((a) => a.id === id) ? id : null;
}

export function getCurrentUser(): CurrentUser | null {
  const id = getSessionUserId();
  if (!id) return null;
  const account = ACCOUNTS.find((a) => a.id === id);
  if (!account) return null;
  const override = readJson<ProfileOverrides>(PROFILE_KEY)?.[id] ?? {};
  const merged = { ...account, ...override };
  return {
    id,
    name: merged.name,
    email: merged.email,
    phone: merged.phone,
    initials: initialsFor(merged.name),
    roles: getRoles(id),
  };
}

// Mock stand-in for real sign-in. Only the dev switcher calls this. The real
// backend replaces it with proper authentication.
export function signInAs(userId: string | null): void {
  if (userId === null) {
    signOut();
    return;
  }
  if (!ACCOUNTS.some((a) => a.id === userId)) return;
  writeJson(SESSION_KEY, { userId });
  // Start each session in the everyday guest experience.
  writeJson(MODE_KEY, "guest");
  emitChange();
}

export function signOut(): void {
  removeKey(SESSION_KEY);
  removeKey(MODE_KEY);
  emitChange();
}

// The modes this user may use: everyone gets guest, and only an owner can
// switch to owner mode. A plain voyager is never offered the switch.
export function getAvailableModes(user: CurrentUser | null): Mode[] {
  if (!user) return ["guest"];
  return user.roles.includes("owner") ? ["guest", "owner"] : ["guest"];
}

// The stored mode, corrected if it is no longer allowed (for example after
// signing in as someone without the owner role).
export function getMode(user: CurrentUser | null): Mode {
  const stored = readJson<Mode>(MODE_KEY);
  return stored && getAvailableModes(user).includes(stored) ? stored : "guest";
}

// Returns false when the user is not allowed that mode.
export function setMode(user: CurrentUser | null, mode: Mode): boolean {
  if (!getAvailableModes(user).includes(mode)) return false;
  writeJson(MODE_KEY, mode);
  emitChange();
  return true;
}

export function updateProfile(
  userId: string,
  patch: { name: string; email: string; phone: string }
): boolean {
  if (!ACCOUNTS.some((a) => a.id === userId)) return false;
  const all = readJson<ProfileOverrides>(PROFILE_KEY) ?? {};
  all[userId] = { name: patch.name, email: patch.email, phone: patch.phone };
  const ok = writeJson(PROFILE_KEY, all);
  emitChange();
  return ok;
}

// ---------------------------------------------------------------------------
// Owner data: which berth(s) a person holds, and the boat on file
// ---------------------------------------------------------------------------

export type BoatOnFile = BoatRecord;

export type OwnedBerth = {
  linkId: string;
  marinaId: string;
  marinaName: string;
  countrySlug: string;
  berthId: string;
  pontoon: string;
  sizeClass: string | null;
  linkedBy: string;
  linkedAt: string;
  boatOnFile: BoatOnFile;
};

// Only active links count. Returns nothing for anyone without the owner role.
export function getOwnedBerths(userId: string | null): OwnedBerth[] {
  if (!userId || !getRoles(userId).includes("owner")) return [];
  const allBerths = getAllBerths();
  return BERTH_LINKS.filter((l) => l.userId === userId && l.active).map(
    (link) => {
      const marina = marinas.find((m) => m.id === link.marinaId);
      const berth = allBerths.find((b) => b.id === link.berthId);
      return {
        linkId: link.id,
        marinaId: link.marinaId,
        marinaName: marina?.name ?? link.marinaId,
        countrySlug: marina?.countrySlug ?? "",
        berthId: link.berthId,
        pontoon: berth?.pontoonId ?? link.berthId.split("-")[0],
        sizeClass: berth?.sizeClass ?? null,
        linkedBy: marina?.name ?? link.marinaId,
        linkedAt: link.linkedAt,
        boatOnFile: link.boatOnFile,
      };
    }
  );
}

// ---------------------------------------------------------------------------
// Staff data
// ---------------------------------------------------------------------------

export type StaffMembership = {
  marinaId: string;
  marinaName: string;
  invitedBy: string;
  invitedAt: string;
};

// Only accepted invitations count. Staff tools arrive in the next step.
export function getStaffMemberships(userId: string | null): StaffMembership[] {
  if (!userId || !getRoles(userId).includes("staff")) return [];
  return STAFF_INVITATIONS.filter(
    (i) => i.userId === userId && i.status === "accepted"
  ).map((invite) => {
    const marina = marinas.find((m) => m.id === invite.marinaId);
    return {
      marinaId: invite.marinaId,
      marinaName: marina?.name ?? invite.marinaId,
      invitedBy: marina?.name ?? invite.marinaId,
      invitedAt: invite.invitedAt,
    };
  });
}

// ---------------------------------------------------------------------------
// Dev only: impersonation personas
// ---------------------------------------------------------------------------

export type DevPersona = {
  id: string;
  userId: string | null;
  label: string;
  description: string;
};

// MOCK / DEV ONLY. The real product has no impersonation. Remove with the
// switcher component before launch.
export function listDevPersonas(): DevPersona[] {
  return [
    {
      id: "signed-out",
      userId: null,
      label: "Signed out",
      description: "A visitor with no account",
    },
    {
      id: "voyager",
      userId: "u-voyager",
      label: "Plain voyager",
      description: "Guest experience only",
    },
    {
      id: "owner",
      userId: "u-owner",
      label: "Voyager and owner",
      description: "Holds berth G-14, sees the mode switch",
    },
    {
      id: "staff",
      userId: "u-staff",
      label: "Marina staff",
      description: "Invited by Marina de Cascais",
    },
  ];
}

export function getActivePersonaId(): string {
  const id = getSessionUserId();
  return listDevPersonas().find((p) => p.userId === id)?.id ?? "signed-out";
}

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

type ReletStore = {
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

function parseIso(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function countNights(startDate: string, endDate: string): number {
  const a = parseIso(startDate);
  const b = parseIso(endDate);
  if (!a || !b || b <= a) return 0;
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

const cents = (n: number) => Math.round(n * 100) / 100;

// Every night of an absence as ISO dates: the day the holder leaves up to, but
// not including, the day they return.
export function nightDates(startDate: string, endDate: string): string[] {
  const start = parseIso(startDate);
  const nights = countNights(startDate, endDate);
  if (!start || nights < 1) return [];
  const pad = (n: number) => String(n).padStart(2, "0");
  const out: string[] = [];
  const cursor = new Date(start);
  for (let i = 0; i < nights; i++) {
    out.push(
      `${cursor.getFullYear()}-${pad(cursor.getMonth() + 1)}-${pad(cursor.getDate())}`
    );
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

// The holder's credit before the marina's fee, from the marina's credit
// model: a percent of the tariff income, a fixed amount per night, or (for
// display) the nominal percent an incentive-next-year model would be worth.
function creditBeforeFee(terms: RelettingTerms, grossEur: number, nightCount: number): number {
  switch (terms.creditModel.kind) {
    case "percentage":
      return (grossEur * terms.creditModel.sharePercent) / 100;
    case "fixed_per_night":
      return terms.creditModel.amountEur * nightCount;
    case "incentive_next_year":
      return (grossEur * terms.creditModel.sharePercent) / 100;
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
  let gross = 0;
  for (const night of nights) {
    const date = parseIso(night);
    if (date) gross += marina.transientRates[berth.sizeClass][getSeason(date)];
  }
  const share = creditBeforeFee(terms, gross, nights.length);
  const fee = (share * terms.processingFeePercent) / 100;
  return {
    nights: nights.length,
    grossEur: cents(gross),
    ownerShareEur: cents(share),
    feeEur: cents(fee),
    netEur: cents(share - fee),
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

function buildSeedRelettingStore(): ReletStore {
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

function loadReletStore(): ReletStore {
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
      approvedNights: r.approvedNights ?? (r.status === "submitted" ? null : nightDates(r.startDate, r.endDate)),
      resubmitOf: r.resubmitOf ?? null,
    })),
  };
}

function saveReletStore(store: ReletStore) {
  writeJson(RELETTING_KEY, store);
  emitChange();
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const ACTIVE_STATUSES: RelettingStatus[] = [
  "submitted",
  "approved",
  "listed",
  "booked",
];

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
  | { ok: true; request: RelettingRequest }
  | { ok: false; error: string };

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
    return { ok: false, error: "Every confirmation is needed before the marina can consider your request." };
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
    notifications: store.notifications.map((n) =>
      n.userId === userId ? { ...n, read: true } : n
    ),
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

function isStaffOfMarina(staffUserId: string | null, marinaId: string): boolean {
  return getStaffMemberships(staffUserId).some((m) => m.marinaId === marinaId);
}

function dateLabel(iso: string): string {
  const d = parseIso(iso);
  return d
    ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long" }).format(d)
    : iso;
}

function formatWindow(startIso: string, endIso: string): string {
  return `available ${dateLabel(startIso)} to ${dateLabel(endIso)}`;
}

// Only requests for marinas the staff member belongs to. The real backend must
// filter by the staff membership server-side, never trust the client.
export function getRelettingQueue(
  staffUserId: string | null
): RelettingQueueItem[] {
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
        berthClass:
          allBerths.find((b) => b.id === request.berthId)?.sizeClass ?? null,
        estimate: estimateReletting(
          request.marinaId,
          request.berthId,
          request.startDate,
          request.endDate
        ),
      };
    })
    .sort((a, b) => {
      const rank = (s: RelettingStatus) => (s === "submitted" ? 0 : ACTIVE_STATUSES.includes(s) ? 1 : 2);
      return (
        rank(a.request.status) - rank(b.request.status) ||
        a.request.startDate.localeCompare(b.request.startDate)
      );
    });
}

function withEvent(
  request: RelettingRequest,
  status: RelettingStatus
): RelettingRequest {
  return {
    ...request,
    status,
    history: [...request.history, { status, at: new Date().toISOString() }],
  };
}

function notification(
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

export type StaffActionResult = { ok: true } | { ok: false; error: string };

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
  const cleared = decision === "approve"
    ? (approvedNights ?? offered).filter((n) => offered.includes(n))
    : null;
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
  if (request.status === "declined" || index < 1 || index >= RELETTING_PROGRESS.length - 1) {
    return { ok: false, error: "There is no next step for this request." };
  }
  const nextStatus = RELETTING_PROGRESS[index + 1];
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
  return request.status === "booked" || (request.status === "listed" && request.bookedNights.length > 0);
}

function ownedRequest(
  userId: string | null,
  requestId: string
): { store: ReletStore; request: RelettingRequest } | null {
  if (!userId || !getRoles(userId).includes("owner")) return null;
  const store = loadReletStore();
  const request = store.requests.find((r) => r.id === requestId);
  return request && request.userId === userId ? { store, request } : null;
}

export type ChangeRelettingResult =
  | { ok: true; request: RelettingRequest }
  | { ok: false; error: string };

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
    return { ok: false, error: "A visitor has booked this, so it cannot be cancelled here. Contact the marina." };
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
      { status: request.status, at: new Date().toISOString(), note: "Holder asked to return early" },
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

type DraftStore = Record<string, RelettingDraft>;

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

const CALENDAR_RANK: Record<CalendarState, number> = {
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

// ============================================================================
// STAFF BACK OFFICE
//
// Everything below is for the marina's own staff: incoming berth enquiries
// (the boater's "Request a berth" flow, submitted here in addition to its
// existing mailto), the day-to-day berth map, check-in and check-out, and
// simple records. All of it is gated by the "staff" role and scoped to the
// marina(s) that staff member belongs to (see getStaffMemberships). The real
// backend must enforce that scoping server-side, exactly as commented for
// reletting above; this is still a client-side mock with no real security.
// ============================================================================

function addDaysIso(iso: string, days: number): string {
  const d = parseIso(iso);
  if (!d) return iso;
  d.setDate(d.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// True while [startA,endA) and [startB,endB) share a night.
function rangesOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  return startA < endB && startB < endA;
}

// A blank departure means an open-ended stay; treated as one night for display
// and conflict purposes until the boater confirms an end date.
function effectiveEnquiryDeparture(e: { arrival: string; departure: string }): string {
  return e.departure || addDaysIso(e.arrival, 1);
}

// ---- Enquiries ("Request a berth") ----

export type EnquiryStatus = "new" | "approved" | "declined";
export type EnquiryArrivalStatus = "pending" | "arrived" | "departed";

export type EnquiryDocuments = {
  registrationNumber: string;
  insuranceProvider: string;
  insurancePolicy: string;
  insuranceExpiry: string;
  competenceCertificate: string;
  vhfLicence: string;
};

export const EMPTY_ENQUIRY_DOCUMENTS: EnquiryDocuments = {
  registrationNumber: "",
  insuranceProvider: "",
  insurancePolicy: "",
  insuranceExpiry: "",
  competenceCertificate: "",
  vhfLicence: "",
};

export type EnquiryCrewMember = {
  personType: string;
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  passportNumber: string;
  role: string;
  joinDate: string;
};

export type EnquiryServices = {
  shorePower: boolean;
  amperage: string;
  water: boolean;
  helpMooring: boolean;
  helpSlipping: boolean;
  pumpOut: boolean;
  fuel: boolean;
  laundry: boolean;
};

export type Enquiry = {
  id: string;
  marinaId: string;
  status: EnquiryStatus;
  arrivalStatus: EnquiryArrivalStatus;
  createdAt: string;
  decisionAt: string | null;
  decisionNote: string;
  assignedBerthId: string | null;
  arrivedAt: string | null;
  departedAt: string | null;
  // A short staff-only note, for example "needs a tow to the berth".
  flagNote: string;

  arrival: string;
  eta: string;
  departure: string;
  etd: string;
  openEnded: boolean;

  boatName: string;
  vesselType: string;
  loa: string;
  beam: string;
  draft: string;
  flagCountry: string;
  // The berth the boater selected on the map, if any. Separate from
  // assignedBerthId, which is what staff actually confirm on approval.
  requestedBerthId: string;

  skipperName: string;
  phone: string;
  email: string;
  homePort: string;
  peopleOnBoard: string;

  services: EnquiryServices;

  vesselUse: string;
  // Filled only when vesselUse is not "private".
  operatingEntity: string;
  companyRegistration: string;
  contractName: string;
  contractRole: string;
  euStatus: "yes" | "no" | "";
  lastPort: string;
  nextPort: string;
  crew: EnquiryCrewMember[];

  // Text only, as entered by the boater. Read-only here, never uploads.
  documents: EnquiryDocuments;
};

type EnquiryStore = { enquiries: Enquiry[] };

function seedEnquiry(overrides: Partial<Enquiry> & Pick<Enquiry, "id">): Enquiry {
  const today = todayIso();
  return {
    marinaId: "cascais",
    status: "new",
    arrivalStatus: "pending",
    createdAt: today + "T09:00:00.000Z",
    decisionAt: null,
    decisionNote: "",
    assignedBerthId: null,
    arrivedAt: null,
    departedAt: null,
    flagNote: "",
    arrival: today,
    eta: "12:00",
    departure: addDaysIso(today, 3),
    etd: "10:00",
    openEnded: false,
    boatName: "",
    vesselType: "sail",
    loa: "9.0",
    beam: "3.1",
    draft: "1.5",
    flagCountry: "Portugal",
    requestedBerthId: "",
    skipperName: "",
    phone: "",
    email: "",
    homePort: "",
    peopleOnBoard: "2",
    services: {
      shorePower: false,
      amperage: "",
      water: false,
      helpMooring: false,
      helpSlipping: false,
      pumpOut: false,
      fuel: false,
      laundry: false,
    },
    vesselUse: "private",
    operatingEntity: "",
    companyRegistration: "",
    contractName: "",
    contractRole: "",
    euStatus: "yes",
    lastPort: "",
    nextPort: "",
    crew: [],
    documents: { ...EMPTY_ENQUIRY_DOCUMENTS },
    ...overrides,
  };
}

function buildSeedEnquiryStore(): EnquiryStore {
  const today = todayIso();
  return {
    enquiries: [
      // Arriving today, still pending check-in: exercises Arrivals and Check-in.
      seedEnquiry({
        id: "enquiry-seed-1",
        status: "approved",
        assignedBerthId: "P-2",
        arrival: today,
        eta: "11:00",
        departure: addDaysIso(today, 3),
        etd: "10:00",
        boatName: "Kestrel",
        vesselType: "sail",
        loa: "9.2",
        beam: "3.2",
        draft: "1.6",
        flagCountry: "Portugal",
        skipperName: "Ines Ferreira",
        phone: "+351 913 000 111",
        email: "ines.ferreira@example.com",
        peopleOnBoard: "3",
        services: {
          shorePower: true,
          amperage: "16",
          water: true,
          helpMooring: true,
          helpSlipping: false,
          pumpOut: false,
          fuel: false,
          laundry: false,
        },
        decisionAt: today + "T08:00:00.000Z",
        documents: {
          registrationNumber: "PT-KE-4471",
          insuranceProvider: "Fidelidade",
          insurancePolicy: "FI-2026-88213",
          insuranceExpiry: addDaysIso(today, 200),
          competenceCertificate: "Yacht Master Coastal",
          vhfLicence: "SROC-PT-3391",
        },
      }),
      // Already on site: exercises the on-site list and check-out.
      seedEnquiry({
        id: "enquiry-seed-2",
        status: "approved",
        arrivalStatus: "arrived",
        assignedBerthId: "P-4",
        arrival: addDaysIso(today, -1),
        eta: "16:00",
        departure: today,
        etd: "12:00",
        arrivedAt: addDaysIso(today, -1) + "T16:20:00.000Z",
        boatName: "Aurora",
        vesselType: "motor",
        loa: "8.4",
        beam: "3.0",
        draft: "1.1",
        flagCountry: "Spain",
        skipperName: "Marc Duran",
        phone: "+34 611 222 333",
        email: "marc.duran@example.com",
        peopleOnBoard: "4",
        services: { shorePower: false, amperage: "", water: true, helpMooring: false, helpSlipping: true, pumpOut: false, fuel: true, laundry: false },
        decisionAt: addDaysIso(today, -2) + "T10:00:00.000Z",
        documents: {
          registrationNumber: "ES-AU-1029",
          insuranceProvider: "Mapfre",
          insurancePolicy: "MP-77210",
          insuranceExpiry: addDaysIso(today, 90),
          competenceCertificate: "",
          vhfLicence: "",
        },
      }),
      // Needs a decision: exercises the Enquiries inbox.
      seedEnquiry({
        id: "enquiry-seed-3",
        status: "new",
        arrival: addDaysIso(today, 5),
        eta: "17:30",
        departure: addDaysIso(today, 8),
        etd: "09:00",
        boatName: "Halcyon",
        vesselType: "sail",
        loa: "7.8",
        beam: "2.7",
        draft: "1.4",
        flagCountry: "France",
        skipperName: "Camille Rousseau",
        phone: "+33 6 12 34 56 78",
        email: "camille.rousseau@example.com",
        peopleOnBoard: "2",
        services: { shorePower: true, amperage: "16", water: false, helpMooring: false, helpSlipping: false, pumpOut: false, fuel: false, laundry: true },
        vesselUse: "private",
        euStatus: "yes",
        crew: [
          { personType: "crew", fullName: "Camille Rousseau", dateOfBirth: "", nationality: "French", passportNumber: "", role: "Skipper", joinDate: "" },
        ],
      }),
      // Needs a decision, larger boat, no berth pre-picked: a second inbox item.
      seedEnquiry({
        id: "enquiry-seed-4",
        status: "new",
        arrival: addDaysIso(today, 2),
        eta: "14:00",
        departure: addDaysIso(today, 4),
        etd: "11:00",
        boatName: "Meridian",
        vesselType: "motor",
        loa: "13.5",
        beam: "4.2",
        draft: "1.8",
        flagCountry: "United Kingdom",
        skipperName: "Oliver Hart",
        phone: "+44 7700 900555",
        email: "oliver.hart@example.com",
        peopleOnBoard: "6",
        services: { shorePower: true, amperage: "32", water: true, helpMooring: true, helpSlipping: true, pumpOut: true, fuel: false, laundry: false },
        vesselUse: "bareboat",
        operatingEntity: "Solent Yacht Charters Ltd",
        companyRegistration: "GB-08217743",
        contractName: "",
        contractRole: "",
        euStatus: "no",
        lastPort: "Gibraltar",
        nextPort: "Lagos",
        crew: [
          { personType: "crew", fullName: "Oliver Hart", dateOfBirth: "1985-04-11", nationality: "British", passportNumber: "998211037", role: "Skipper", joinDate: "" },
          { personType: "guest", fullName: "Amy Hart", dateOfBirth: "1987-09-02", nationality: "British", passportNumber: "998211038", role: "Guest", joinDate: "" },
        ],
      }),
      // Declined already: fills out the inbox filter and Records.
      seedEnquiry({
        id: "enquiry-seed-5",
        status: "declined",
        arrival: addDaysIso(today, 1),
        departure: addDaysIso(today, 2),
        boatName: "Windrose",
        vesselType: "catamaran",
        loa: "11.0",
        beam: "6.2",
        draft: "1.2",
        flagCountry: "Germany",
        skipperName: "Lena Fischer",
        phone: "+49 151 22334455",
        email: "lena.fischer@example.com",
        peopleOnBoard: "5",
        decisionAt: addDaysIso(today, -1) + "T09:00:00.000Z",
        decisionNote: "No catamaran berth free for those dates.",
      }),
    ],
  };
}

function loadEnquiryStore(): EnquiryStore {
  const stored = readJson<EnquiryStore>(ENQUIRY_KEY);
  return stored ?? buildSeedEnquiryStore();
}

function saveEnquiryStore(store: EnquiryStore) {
  writeJson(ENQUIRY_KEY, store);
  emitChange();
}

// Called by the boater's Request a berth form, in addition to (not instead of)
// its existing mailto: the email is still the record of the enquiry; this is
// what lets staff act on it in real time instead of only replying by email.
// No sign-in is needed to submit one, the same as the mailto today.
export type SubmitEnquiryInput = Omit<
  Enquiry,
  | "id"
  | "status"
  | "arrivalStatus"
  | "createdAt"
  | "decisionAt"
  | "decisionNote"
  | "assignedBerthId"
  | "arrivedAt"
  | "departedAt"
  | "flagNote"
>;

export function submitEnquiry(input: SubmitEnquiryInput): Enquiry {
  const store = loadEnquiryStore();
  const enquiry: Enquiry = {
    ...input,
    id: newId("enquiry"),
    status: "new",
    arrivalStatus: "pending",
    createdAt: new Date().toISOString(),
    decisionAt: null,
    decisionNote: "",
    assignedBerthId: null,
    arrivedAt: null,
    departedAt: null,
    flagNote: "",
  };
  saveEnquiryStore({ enquiries: [enquiry, ...store.enquiries] });
  return enquiry;
}

// Every enquiry for the marina(s) this staff member belongs to. Screens filter
// by status, date or search themselves; this always returns the full list so
// counts and filters stay in step.
export function getEnquiries(staffUserId: string | null): Enquiry[] {
  const marinaIds = getStaffMemberships(staffUserId).map((m) => m.marinaId);
  if (marinaIds.length === 0) return [];
  return loadEnquiryStore()
    .enquiries.filter((e) => marinaIds.includes(e.marinaId))
    .sort((a, b) => {
      const rank = (status: EnquiryStatus) => (status === "new" ? 0 : 1);
      return rank(a.status) - rank(b.status) || a.arrival.localeCompare(b.arrival);
    });
}

export type BerthConflictResult = { ok: true } | { ok: false; error: string };

// Whether a berth is free for a transient stay across [arrival, departure).
// Checks other approved, still-on-the-books enquiries on the same berth and,
// for a berth someone holds, whether its owner has cleared every one of those
// nights for reletting. The real backend must run the same check inside a
// transaction (or a unique constraint), so two staff members cannot double
// book a berth from two tabs.
export function checkBerthAvailability(
  marinaId: string,
  berthId: string,
  arrival: string,
  departure: string,
  excludeEnquiryId?: string
): BerthConflictResult {
  if (!(arrival < departure)) {
    return { ok: false, error: "Choose a departure date after the arrival date." };
  }
  const conflict = loadEnquiryStore().enquiries.find(
    (e) =>
      e.id !== excludeEnquiryId &&
      e.marinaId === marinaId &&
      e.assignedBerthId === berthId &&
      e.status === "approved" &&
      e.arrivalStatus !== "departed" &&
      rangesOverlap(arrival, departure, e.arrival, effectiveEnquiryDeparture(e))
  );
  if (conflict) {
    return {
      ok: false,
      error: `Berth ${berthId} already holds ${conflict.boatName || "another boat"} for overlapping dates.`,
    };
  }
  const link = BERTH_LINKS.find((l) => l.marinaId === marinaId && l.berthId === berthId && l.active);
  if (link) {
    const nights = nightDates(arrival, departure);
    const requests = loadReletStore().requests.filter(
      (r) => r.berthId === berthId && ["approved", "listed", "booked"].includes(r.status)
    );
    const cleared = new Set(requests.flatMap((r) => r.approvedNights ?? []));
    if (nights.some((n) => !cleared.has(n))) {
      return {
        ok: false,
        error: `Berth ${berthId} is a berth holder's own berth, and it is not cleared for reletting on all of these dates.`,
      };
    }
    const alreadyBooked = requests.some((r) => nights.some((n) => r.bookedNights.includes(n)));
    if (alreadyBooked) {
      return { ok: false, error: `Berth ${berthId} already has a visitor booked on part of these dates.` };
    }
  }
  if (getOutOfServiceBerths(marinaId).some((m) => m.berthId === berthId)) {
    return { ok: false, error: `Berth ${berthId} is marked out of service.` };
  }
  return { ok: true };
}

export type EnquiryActionResult = { ok: true; enquiry: Enquiry } | { ok: false; error: string };

// Approve assigns a berth (conflict-checked) and is the real-time reply to the
// boater. Decline can carry a short reason. Both are final; use
// reassignEnquiryBerth afterwards to move an approved boat to another berth.
export function decideEnquiry(
  staffUserId: string | null,
  enquiryId: string,
  decision: "approve" | "decline",
  options: { berthId?: string; reason?: string } = {}
): EnquiryActionResult {
  const store = loadEnquiryStore();
  const enquiry = store.enquiries.find((e) => e.id === enquiryId);
  if (!enquiry) return { ok: false, error: "Enquiry not found." };
  if (!isStaffOfMarina(staffUserId, enquiry.marinaId)) {
    return { ok: false, error: "Only staff of this marina can decide." };
  }
  if (enquiry.status !== "new") {
    return { ok: false, error: "This enquiry has already been decided." };
  }
  if (decision === "approve") {
    if (!options.berthId) {
      return { ok: false, error: "Choose a berth to assign before approving." };
    }
    const check = checkBerthAvailability(
      enquiry.marinaId,
      options.berthId,
      enquiry.arrival,
      effectiveEnquiryDeparture(enquiry)
    );
    if (!check.ok) return check;
  }
  const next: Enquiry = {
    ...enquiry,
    status: decision === "approve" ? "approved" : "declined",
    decisionAt: new Date().toISOString(),
    decisionNote: (options.reason ?? "").trim(),
    assignedBerthId: decision === "approve" ? (options.berthId as string) : null,
  };
  saveEnquiryStore({ enquiries: store.enquiries.map((e) => (e.id === enquiryId ? next : e)) });
  return { ok: true, enquiry: next };
}

// Assign or change the berth on an already-approved enquiry, conflict-checked
// against everything else on the books.
export function reassignEnquiryBerth(
  staffUserId: string | null,
  enquiryId: string,
  berthId: string
): EnquiryActionResult {
  const store = loadEnquiryStore();
  const enquiry = store.enquiries.find((e) => e.id === enquiryId);
  if (!enquiry) return { ok: false, error: "Enquiry not found." };
  if (!isStaffOfMarina(staffUserId, enquiry.marinaId)) {
    return { ok: false, error: "Only staff of this marina can do this." };
  }
  if (enquiry.status !== "approved") {
    return { ok: false, error: "Only an approved enquiry can be assigned a berth." };
  }
  if (enquiry.arrivalStatus === "departed") {
    return { ok: false, error: "This boat has already departed." };
  }
  const check = checkBerthAvailability(
    enquiry.marinaId,
    berthId,
    enquiry.arrival,
    effectiveEnquiryDeparture(enquiry),
    enquiry.id
  );
  if (!check.ok) return check;
  const next = { ...enquiry, assignedBerthId: berthId };
  saveEnquiryStore({ enquiries: store.enquiries.map((e) => (e.id === enquiryId ? next : e)) });
  return { ok: true, enquiry: next };
}

export function markEnquiryArrived(
  staffUserId: string | null,
  enquiryId: string
): EnquiryActionResult {
  const store = loadEnquiryStore();
  const enquiry = store.enquiries.find((e) => e.id === enquiryId);
  if (!enquiry) return { ok: false, error: "Enquiry not found." };
  if (!isStaffOfMarina(staffUserId, enquiry.marinaId)) {
    return { ok: false, error: "Only staff of this marina can do this." };
  }
  if (enquiry.status !== "approved" || enquiry.arrivalStatus !== "pending") {
    return { ok: false, error: "This boat cannot be marked arrived from its current state." };
  }
  const next: Enquiry = { ...enquiry, arrivalStatus: "arrived", arrivedAt: new Date().toISOString() };
  saveEnquiryStore({ enquiries: store.enquiries.map((e) => (e.id === enquiryId ? next : e)) });
  return { ok: true, enquiry: next };
}

// Frees the berth: once departed, the enquiry no longer counts toward any
// conflict check or occupancy status for that berth.
export function markEnquiryDeparted(
  staffUserId: string | null,
  enquiryId: string
): EnquiryActionResult {
  const store = loadEnquiryStore();
  const enquiry = store.enquiries.find((e) => e.id === enquiryId);
  if (!enquiry) return { ok: false, error: "Enquiry not found." };
  if (!isStaffOfMarina(staffUserId, enquiry.marinaId)) {
    return { ok: false, error: "Only staff of this marina can do this." };
  }
  if (enquiry.arrivalStatus !== "arrived") {
    return { ok: false, error: "Only a boat that has arrived can be marked departed." };
  }
  const next: Enquiry = { ...enquiry, arrivalStatus: "departed", departedAt: new Date().toISOString() };
  saveEnquiryStore({ enquiries: store.enquiries.map((e) => (e.id === enquiryId ? next : e)) });
  return { ok: true, enquiry: next };
}

// A short staff-only note, for example "needs a tow" or "engine trouble on
// arrival". Never sent to the boater.
export function setEnquiryFlag(
  staffUserId: string | null,
  enquiryId: string,
  note: string
): EnquiryActionResult {
  const store = loadEnquiryStore();
  const enquiry = store.enquiries.find((e) => e.id === enquiryId);
  if (!enquiry) return { ok: false, error: "Enquiry not found." };
  if (!isStaffOfMarina(staffUserId, enquiry.marinaId)) {
    return { ok: false, error: "Only staff of this marina can do this." };
  }
  const next: Enquiry = { ...enquiry, flagNote: note.trim() };
  saveEnquiryStore({ enquiries: store.enquiries.map((e) => (e.id === enquiryId ? next : e)) });
  return { ok: true, enquiry: next };
}

// DEV ONLY: back to the seed enquiries.
export function resetMockEnquiries(): void {
  removeKey(ENQUIRY_KEY);
  emitChange();
}

// ---- Out of service ----

export type OutOfServiceMark = {
  berthId: string;
  marinaId: string;
  reason: string;
  setAt: string;
};

type OosStore = { marks: OutOfServiceMark[] };

function loadOosStore(): OosStore {
  return readJson<OosStore>(OOS_KEY) ?? { marks: [] };
}

function saveOosStore(store: OosStore) {
  writeJson(OOS_KEY, store);
  emitChange();
}

export function getOutOfServiceBerths(marinaId: string): OutOfServiceMark[] {
  return loadOosStore().marks.filter((m) => m.marinaId === marinaId);
}

export function setBerthOutOfService(
  staffUserId: string | null,
  marinaId: string,
  berthId: string,
  reason: string
): StaffActionResult {
  if (!isStaffOfMarina(staffUserId, marinaId)) {
    return { ok: false, error: "Only staff of this marina can do this." };
  }
  const store = loadOosStore();
  if (store.marks.some((m) => m.berthId === berthId)) {
    return { ok: false, error: "This berth is already out of service." };
  }
  saveOosStore({
    marks: [
      ...store.marks,
      { berthId, marinaId, reason: reason.trim(), setAt: new Date().toISOString() },
    ],
  });
  return { ok: true };
}

export function clearBerthOutOfService(
  staffUserId: string | null,
  marinaId: string,
  berthId: string
): StaffActionResult {
  if (!isStaffOfMarina(staffUserId, marinaId)) {
    return { ok: false, error: "Only staff of this marina can do this." };
  }
  saveOosStore({ marks: loadOosStore().marks.filter((m) => m.berthId !== berthId) });
  return { ok: true };
}

// DEV ONLY: back to no marks.
export function resetMockOutOfService(): void {
  removeKey(OOS_KEY);
  emitChange();
}

// ---- The berth map as an operational tool ----

export type BerthOperationalStatus =
  | "occupied"
  | "free"
  | "reserved"
  | "owner-away"
  | "released"
  | "out-of-service";

export type BerthOperationalInfo = {
  status: BerthOperationalStatus;
  detail: string;
  enquiryId?: string;
  relettingId?: string;
};

// A live status per berth for one date (default: today), built entirely from
// the records above: out-of-service marks, a holder's own boat versus their
// reletting, and approved enquiries. Every berth in the marina gets an entry.
export function getBerthStatuses(
  marinaId: string,
  dateIso: string
): Record<string, BerthOperationalInfo> {
  const out: Record<string, BerthOperationalInfo> = {};
  const oosMarks = getOutOfServiceBerths(marinaId);
  const oos = new Map(oosMarks.map((m) => [m.berthId, m]));
  const approvedEnquiries = loadEnquiryStore().enquiries.filter(
    (e) => e.marinaId === marinaId && e.status === "approved"
  );
  const reletRequests = loadReletStore().requests.filter(
    (r) => r.marinaId === marinaId && ["approved", "listed", "booked"].includes(r.status)
  );

  for (const berth of getAllBerths()) {
    const mark = oos.get(berth.id);
    if (mark) {
      out[berth.id] = { status: "out-of-service", detail: mark.reason || "Marked out of service." };
      continue;
    }

    const link = BERTH_LINKS.find(
      (l) => l.marinaId === marinaId && l.berthId === berth.id && l.active
    );
    if (link) {
      const request = reletRequests.find(
        (r) => r.berthId === berth.id && dateIso >= r.startDate && dateIso < r.endDate
      );
      if (request) {
        if (request.bookedNights.includes(dateIso)) {
          out[berth.id] = {
            status: "occupied",
            detail: "A visitor is aboard for these dates.",
            relettingId: request.id,
          };
        } else if ((request.approvedNights ?? []).includes(dateIso)) {
          out[berth.id] = {
            status: "released",
            detail: `Released by the holder, ${formatWindow(request.startDate, request.endDate)}.`,
            relettingId: request.id,
          };
        } else {
          out[berth.id] = {
            status: "owner-away",
            detail: "The holder is away; not cleared for reletting on this date.",
            relettingId: request.id,
          };
        }
      } else {
        out[berth.id] = {
          status: "occupied",
          detail: `${link.boatOnFile.name}, the holder's own boat.`,
        };
      }
      continue;
    }

    // A boat that has arrived still occupies the berth through its departure
    // day, until staff actually check it out; a not-yet-arrived booking only
    // reserves the berth up to (not including) its departure day, so the next
    // guest's arrival day is free to show as such.
    const enquiry = approvedEnquiries.find(
      (e) =>
        e.assignedBerthId === berth.id &&
        e.arrivalStatus !== "departed" &&
        dateIso >= e.arrival &&
        (e.arrivalStatus === "arrived"
          ? dateIso <= effectiveEnquiryDeparture(e)
          : dateIso < effectiveEnquiryDeparture(e))
    );
    if (enquiry) {
      out[berth.id] =
        enquiry.arrivalStatus === "arrived"
          ? { status: "occupied", detail: `${enquiry.boatName || "A visiting boat"}, on site.`, enquiryId: enquiry.id }
          : {
              status: "reserved",
              detail: `${enquiry.boatName || "A visiting boat"}, arriving ${enquiry.eta || "soon"}.`,
              enquiryId: enquiry.id,
            };
    } else {
      out[berth.id] = { status: "free", detail: "No booking for this date." };
    }
  }
  return out;
}

function boatFitsMarinaClass(dims: { loa: number; beam: number }, sizeClass: MarinaClass): boolean {
  return dims.loa <= CLASS_LENGTH_RANGES[sizeClass].maxM && dims.beam <= CLASS_BEAM_RANGES[sizeClass];
}

export type ReleasedBerthSuggestion = {
  berthId: string;
  sizeClass: MarinaClass;
  requestId: string;
  ownerName: string;
  availableFrom: string;
  availableTo: string;
};

// Released holder berths that fit a boat and clear every night of a stay,
// respecting the marina's own buffer and any staff-set conditions from the
// approval. Used to suggest a berth when staff assign an incoming visitor.
export function suggestReleasedBerths(
  marinaId: string,
  dims: { loa: number; beam: number },
  stay: { arrival: string; departure: string }
): ReleasedBerthSuggestion[] {
  const nights = nightDates(stay.arrival, stay.departure);
  if (nights.length === 0) return [];
  const allBerths = getAllBerths();
  const requests = loadReletStore().requests.filter(
    (r) => r.marinaId === marinaId && ["approved", "listed", "booked"].includes(r.status)
  );
  const out: ReleasedBerthSuggestion[] = [];
  for (const request of requests) {
    const berth = allBerths.find((b) => b.id === request.berthId);
    if (!berth) continue;
    const approved = new Set(request.approvedNights ?? []);
    const booked = new Set(request.bookedNights);
    const everyNightClear = nights.every((n) => approved.has(n) && !booked.has(n));
    if (!everyNightClear) continue;

    const cond = request.conditions;
    if (cond?.maxLengthM && dims.loa > cond.maxLengthM) continue;
    if (cond?.maxBeamM && dims.beam > cond.maxBeamM) continue;
    if (cond?.earliestReletDate && stay.arrival < cond.earliestReletDate) continue;
    const bufferDays = cond?.bufferDays ?? 0;
    if (bufferDays > 0 && stay.departure > addDaysIso(request.endDate, -bufferDays)) continue;
    if (!boatFitsMarinaClass(dims, berth.sizeClass)) continue;

    const owner = ACCOUNTS.find((a) => a.id === request.userId);
    out.push({
      berthId: berth.id,
      sizeClass: berth.sizeClass,
      requestId: request.id,
      ownerName: owner?.name ?? "Berth holder",
      availableFrom: request.startDate,
      availableTo: request.endDate,
    });
  }
  return out;
}

// ---- Records: who holds what, tied together without re-keying ----

export type MarinaBerthLink = {
  berthId: string;
  marinaId: string;
  boatOnFile: BoatOnFile;
  ownerName: string;
  linkedAt: string;
};

export function getMarinaBerthLinks(marinaId: string): MarinaBerthLink[] {
  return BERTH_LINKS.filter((l) => l.marinaId === marinaId && l.active).map((l) => ({
    berthId: l.berthId,
    marinaId: l.marinaId,
    boatOnFile: l.boatOnFile,
    ownerName: ACCOUNTS.find((a) => a.id === l.userId)?.name ?? "Berth holder",
    linkedAt: l.linkedAt,
  }));
}

// ============================================================================
// PRE-ARRIVAL CHECK-IN
//
// The voyager's multi-step pre-arrival wizard (app/marinas/[country]/[marina]/
// pre-arrival/). No sign-in is required to fill it in or submit it, the same
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

type PreArrivalDraftStore = Record<string, PreArrivalDraft>;
type PreArrivalCheckInStore = { checkIns: PreArrivalCheckIn[] };

// One in-progress draft per marina on this device (a boater is not signed in,
// so there is no per-user key to use, unlike the reletting drafts above).
export function getPreArrivalDraft(marinaId: string): PreArrivalDraft | null {
  return readJson<PreArrivalDraftStore>(PREARRIVAL_DRAFT_KEY)?.[marinaId] ?? null;
}

export function savePreArrivalDraft(
  marinaId: string,
  draft: PreArrivalDraft
): void {
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

function loadPreArrivalStore(): PreArrivalCheckInStore {
  return readJson<PreArrivalCheckInStore>(PREARRIVAL_KEY) ?? { checkIns: [] };
}

// "CAS-7F3K2Q" style: a marina prefix (first three letters of its id, upper
// case) plus six characters from a fresh id, short enough to read aloud at
// the reception desk.
function newReferenceCode(marinaId: string): string {
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
    checkIns: store.checkIns.map((c) => (c.id === id ? { ...c, checkedInAt: new Date().toISOString() } : c)),
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
