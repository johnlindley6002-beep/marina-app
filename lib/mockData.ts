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
import { getSeason, marinas } from "../data/marinas";

export type Role = "voyager" | "owner" | "staff";
export type Mode = "guest" | "owner";

export const MOCK_CHANGED_EVENT = "aldock-mock-changed";
const SESSION_KEY = "aldock-mock-session";
const MODE_KEY = "aldock-mode";
const PROFILE_KEY = "aldock-mock-profiles";
const RELETTING_KEY = "aldock-mock-reletting";

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
  | "declined"
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
  declined: "Declined",
  listed: "Listed",
  booked: "Booked",
  completed: "Completed",
};

export type RelettingEvent = { status: RelettingStatus; at: string };

export type RelettingRequest = {
  id: string;
  userId: string;
  marinaId: string;
  berthId: string;
  startDate: string; // the day the holder leaves (ISO)
  endDate: string; // the day the holder returns (ISO)
  boatRemovalConfirmed: boolean;
  reletConsent: boolean;
  termsAcceptedAt: string;
  readinessConfirmedAt: string;
  status: RelettingStatus;
  history: RelettingEvent[];
  decisionNote: string;
  // Filled in once a stay is booked.
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

// The money for relet nights, from the marina's real tariff for the berth's
// class and the placeholder share and fee in its data. The holder's share is a
// percent of the tariff income (excluding VAT), and the fee is a percent of
// that share, so net is share minus fee. Pure and deterministic.
export function computeReletSplit(
  marinaId: string,
  berthId: string,
  startDate: string,
  nights: number
): ReletSplit | null {
  const marina = marinas.find((m) => m.id === marinaId);
  const terms = marina?.reletting;
  const start = parseIso(startDate);
  const berth = getAllBerths().find((b) => b.id === berthId);
  if (!marina || !terms || !start || !berth || nights <= 0) return null;
  let gross = 0;
  const cursor = new Date(start);
  for (let i = 0; i < nights; i++) {
    gross += marina.transientRates[berth.sizeClass][getSeason(cursor)];
    cursor.setDate(cursor.getDate() + 1);
  }
  const share = (gross * terms.ownerSharePercent) / 100;
  const fee = (share * terms.processingFeePercent) / 100;
  return {
    nights,
    grossEur: cents(gross),
    ownerShareEur: cents(share),
    feeEur: cents(fee),
    netEur: cents(share - fee),
  };
}

// What the whole absence would earn if every night were relet. An illustration,
// never a promise.
export function estimateReletting(
  marinaId: string,
  berthId: string,
  startDate: string,
  endDate: string
): ReletSplit | null {
  return computeReletSplit(
    marinaId,
    berthId,
    startDate,
    countNights(startDate, endDate)
  );
}

function buildSeedRelettingStore(): ReletStore {
  const split = computeReletSplit("cascais", "G-14", "2026-07-06", 12);
  const request: RelettingRequest = {
    id: "relet-seed-1",
    userId: "u-owner",
    marinaId: "cascais",
    berthId: "G-14",
    startDate: "2026-07-06",
    endDate: "2026-07-20",
    boatRemovalConfirmed: true,
    reletConsent: true,
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
  return readJson<ReletStore>(RELETTING_KEY) ?? buildSeedRelettingStore();
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
  termsAccepted: boolean;
  readinessConfirmed: boolean;
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
  if (!marinas.find((m) => m.id === berth.marinaId)?.reletting) {
    return { ok: false, error: "This marina does not offer reletting." };
  }
  const nights = countNights(input.startDate, input.endDate);
  if (nights < 1) {
    return { ok: false, error: "Choose a return date after the day you leave." };
  }
  if (input.startDate < todayIso()) {
    return { ok: false, error: "The day you leave cannot be in the past." };
  }
  if (!input.boatRemovalConfirmed || !input.reletConsent || !input.termsAccepted || !input.readinessConfirmed) {
    return { ok: false, error: "Every confirmation is needed before the marina can consider your request." };
  }
  const store = loadReletStore();
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
    termsAcceptedAt: now,
    readinessConfirmedAt: now,
    status: "submitted",
    history: [{ status: "submitted", at: now }],
    decisionNote: "",
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
  note = ""
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
  const span = `${dateLabel(request.startDate)} to ${dateLabel(request.endDate)}`;
  const next = {
    ...withEvent(request, decision === "approve" ? "approved" : "declined"),
    decisionNote: note.trim(),
  };
  const message =
    decision === "approve"
      ? notification(next, "approved", "Reletting approved", `Marina de Cascais approved your request for ${span}.`)
      : notification(
          next,
          "declined",
          "Reletting declined",
          `Marina de Cascais declined your request for ${span}.${note.trim() ? ` Note: ${note.trim()}` : ""}`
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
  requestId: string
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
    // Mock: assume every night of the absence was booked.
    const split = computeReletSplit(
      request.marinaId,
      request.berthId,
      request.startDate,
      countNights(request.startDate, request.endDate)
    );
    if (split) {
      next = {
        ...next,
        nightsRelet: split.nights,
        grossEur: split.grossEur,
        ownerShareEur: split.ownerShareEur,
        feeEur: split.feeEur,
        netEur: split.netEur,
      };
    }
    added.push(
      notification(next, "booked", "Your berth was booked", "A visitor booked your berth during your absence.")
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
  emitChange();
}
