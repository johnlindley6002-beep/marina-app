// Accounts, roles, sessions, owned berths, staff memberships and the dev
// personas. Roles are derived from records (a berth link makes an owner, an
// accepted invitation makes staff), never stored on the account itself.

import { getAllBerths } from "@/data/berths";
import { marinas } from "@/data/marinas";
import {
  SESSION_KEY,
  MODE_KEY,
  PROFILE_KEY,
  readJson,
  writeJson,
  removeKey,
  emitChange,
} from "./storage";
import { activeSnapshot } from "./snapshot";

export type Role = "voyager" | "owner" | "staff";
export type Mode = "guest" | "owner";

// ---------------------------------------------------------------------------
// Stored records (what a real database would hold)
// ---------------------------------------------------------------------------

// An account. Note that it carries NO roles: roles are derived (see getRoles).
export type AccountRecord = {
  id: string;
  name: string;
  email: string;
  phone: string;
  // True when the person signed up themselves as a voyager. A staff member
  // created through an invitation has this false, so staff stays separate.
  selfSignedUp: boolean;
};

export type BoatRecord = {
  name: string;
  type: string;
  loa: string;
  beam: string;
  draft: string;
  flag: string;
};

// Created by a MARINA when it links a berth to a person. This is the only way
// the owner role can come to exist. The person cannot create or edit it.
export type BerthLinkRecord = {
  id: string;
  userId: string;
  marinaId: string;
  berthId: string;
  linkedAt: string; // ISO date
  // A released link (the berth was sold or the agreement ended) grants nothing.
  active: boolean;
  boatOnFile: BoatRecord;
  // Set on holdings loaded from the database, where the name is not an account here.
  holderName?: string;
};

// Created by a MARINA to invite someone as staff. It grants the staff role
// only once the invited person has accepted it.
export type StaffInvitationRecord = {
  id: string;
  userId: string;
  marinaId: string;
  invitedAt: string; // ISO date
  status: "pending" | "accepted" | "revoked";
};

export const ACCOUNTS: AccountRecord[] = [
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

export const BERTH_LINKS: BerthLinkRecord[] = [
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

export const STAFF_INVITATIONS: StaffInvitationRecord[] = [
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
// Role rules (mocked here, enforced by the real backend later)
// ---------------------------------------------------------------------------

// Whether a person can grant themselves a role:
//
//   voyager: YES. It is the default for anyone who signs up.
//   owner:   NO. Only a marina linking a berth to them creates it. In the real
//            backend this is a marina-side action, and every owner-only read or
//            write must be checked server-side (row-level security on the
//            berth links), never trusted from the client.
//   staff:   NO. Only a marina inviting them, and them accepting, creates it.
//            The real backend must verify the invitation server-side too.
//
// So roles are derived from records (see getRoles), never set by the user.

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
  if (STAFF_INVITATIONS.some((i) => i.userId === userId && i.status === "accepted")) {
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

export type ProfileOverrides = Record<
  string,
  Partial<Pick<AccountRecord, "name" | "email" | "phone">>
>;

export function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

export function getSessionUserId(): string | null {
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
  return BERTH_LINKS.filter((l) => l.userId === userId && l.active).map((link) => {
    const marina = marinas.find((m) => m.id === link.marinaId);
    const berth = allBerths.find((b) => b.id === link.berthId);
    return {
      linkId: link.id,
      marinaId: link.marinaId,
      marinaName: marina?.name ?? link.marinaId,
      countrySlug: marina?.countrySlug ?? "",
      berthId: link.berthId,
      pontoon: berth?.pontoonId ?? link.berthId.split("-")[0] ?? link.berthId,
      sizeClass: berth?.sizeClass ?? null,
      linkedBy: marina?.name ?? link.marinaId,
      linkedAt: link.linkedAt,
      boatOnFile: link.boatOnFile,
    };
  });
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

// Only accepted invitations count. Against Supabase, the signed-in user's
// staff_members rows count instead (see snapshot.ts).
export function getStaffMemberships(userId: string | null): StaffMembership[] {
  const snapshot = activeSnapshot();
  if (snapshot) {
    if (!userId) return [];
    return snapshot.staffMarinaIds.map((marinaId) => {
      const name = marinas.find((m) => m.id === marinaId)?.name ?? marinaId;
      return { marinaId, marinaName: name, invitedBy: name, invitedAt: "" };
    });
  }
  if (!userId || !getRoles(userId).includes("staff")) return [];
  return STAFF_INVITATIONS.filter((i) => i.userId === userId && i.status === "accepted").map(
    (invite) => {
      const marina = marinas.find((m) => m.id === invite.marinaId);
      return {
        marinaId: invite.marinaId,
        marinaName: marina?.name ?? invite.marinaId,
        invitedBy: marina?.name ?? invite.marinaId,
        invitedAt: invite.invitedAt,
      };
    }
  );
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
      label: "Guest",
      description: "Guest experience only",
    },
    {
      id: "owner",
      userId: "u-owner",
      label: "Guest and berth holder",
      description: "Has a linked berth (G-14), sees the mode switch",
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

export function isStaffOfMarina(staffUserId: string | null, marinaId: string): boolean {
  return getStaffMemberships(staffUserId).some((m) => m.marinaId === marinaId);
}

export type StaffActionResult = { ok: true } | { ok: false; error: string };

// ---- Records: who holds what, tied together without re-keying ----

export type MarinaBerthLink = {
  berthId: string;
  marinaId: string;
  boatOnFile: BoatOnFile;
  ownerName: string;
  linkedAt: string;
};

// The holdings the staff rules look at: the marina's own rows while a snapshot
// from Supabase is active, the sample links otherwise.
export function activeBerthLinks(): BerthLinkRecord[] {
  return activeSnapshot()?.holdings ?? BERTH_LINKS;
}

export function getMarinaBerthLinks(marinaId: string): MarinaBerthLink[] {
  return activeBerthLinks()
    .filter((l) => l.marinaId === marinaId && l.active)
    .map((l) => ({
      berthId: l.berthId,
      marinaId: l.marinaId,
      boatOnFile: l.boatOnFile,
      ownerName: l.holderName ?? ACCOUNTS.find((a) => a.id === l.userId)?.name ?? "Berth holder",
      linkedAt: l.linkedAt,
    }));
}
