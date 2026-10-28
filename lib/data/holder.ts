// The berth holder's side of reletting: their offers, the calendar, the
// updates, and offering, cancelling and returning early. On the mock these run
// the browser rules in data/mock. On Supabase the offers are rows the holder
// can read, and every change goes through a database function, so the holder
// never writes a field the marina owns. Messages here are English, like the
// rest of the berth holder screens.

import {
  buildBerthCalendar,
  cancelRelettingRequest as mockCancel,
  getBerthCalendar as mockCalendar,
  getNotifications as mockNotifications,
  getRelettingRequests as mockRequests,
  markNotificationsRead as mockMarkRead,
  requestEarlyReturn as mockEarlyReturn,
  submitRelettingRequest as mockSubmit,
  type CalendarDay,
  type MockNotification,
  type RelettingRequest,
  type SubmitRelettingInput,
} from "@/data/mock/reletting";
import {
  cancelReletOffer,
  listMyBerthIds,
  listMyOffers,
  requestReletEarlyReturn,
  submitReletOffer,
} from "@/data/supabase/accounts";
import type { DbErrorKey } from "@/data/supabase/errors";
import { emitChange } from "@/data/mock/storage";
import { formatDayMonth } from "@/lib/dates";
import { ACCOUNT_DATA_SOURCE } from "./account";

type Done = { ok: true } | { ok: false; error: string };
type Submitted = { ok: true; request: RelettingRequest } | { ok: false; error: string };

const MESSAGES: Partial<Record<DbErrorKey, string>> = {
  guest_confirmed:
    "A guest is already confirmed on your berth in this period, so this cannot be cancelled here. Contact the marina.",
  offer_overlaps: "You already have a request that overlaps these dates.",
  not_a_berth_holder: "Only the berth holder can offer this berth.",
  invalid_dates: "Choose a return date after the day you leave.",
  dates_in_past: "The day you leave cannot be in the past.",
  confirmations_needed: "Every confirmation is needed before the marina can consider your request.",
  not_signed_in: "Sign in to continue.",
  not_found: "This request could not be found.",
};

const FAILED = "Could not save. Check your connection and try again.";

function ownerMessage(key: DbErrorKey): string {
  return MESSAGES[key] ?? FAILED;
}

async function loadOffers(): Promise<RelettingRequest[]> {
  const berths = await listMyBerthIds();
  return (await listMyOffers(berths)) ?? [];
}

export async function getMyRelettingRequests(userId: string | null): Promise<RelettingRequest[]> {
  if (!userId) return [];
  return ACCOUNT_DATA_SOURCE === "mock" ? mockRequests(userId) : loadOffers();
}

// On Supabase the updates are worked out from the offers themselves: the
// marina's decision and a booking, newest first.
export async function getMyNotifications(userId: string | null): Promise<MockNotification[]> {
  if (!userId) return [];
  if (ACCOUNT_DATA_SOURCE === "mock") return mockNotifications(userId);
  const read = readIds();
  const notes: MockNotification[] = [];
  for (const r of await loadOffers()) {
    const span = `${formatDayMonth(r.startDate)} to ${formatDayMonth(r.endDate)}`;
    for (const event of r.history) {
      if (event.status === "approved") {
        notes.push(
          note(
            r,
            "approved",
            "Reletting approved",
            `The marina approved your request for ${span}.`,
            event.at,
            read
          )
        );
      } else if (event.status === "declined") {
        const reason = r.decisionNote ? ` Reason: ${r.decisionNote.replace(/[.]+$/, "")}.` : "";
        notes.push(
          note(
            r,
            "declined",
            "Reletting not approved",
            `The marina did not approve your request for ${span}.${reason}`,
            event.at,
            read
          )
        );
      } else if (event.status === "booked") {
        notes.push(
          note(
            r,
            "booked",
            "Your berth was booked",
            `A guest booked ${r.bookedNights.length} nights of your absence.`,
            event.at,
            read
          )
        );
      }
    }
  }
  return notes.sort((a, b) => b.at.localeCompare(a.at));
}

function note(
  r: RelettingRequest,
  kind: MockNotification["kind"],
  title: string,
  body: string,
  at: string,
  read: Set<string>
): MockNotification {
  const id = `${r.id}-${kind}-${at}`;
  return { id, userId: r.userId, kind, requestId: r.id, title, body, at, read: read.has(id) };
}

const READ_KEY = "aldock-read-updates";

function readIds(): Set<string> {
  try {
    return new Set(JSON.parse(window.localStorage.getItem(READ_KEY) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}

export async function markMyNotificationsRead(userId: string | null): Promise<void> {
  if (!userId) return;
  if (ACCOUNT_DATA_SOURCE === "mock") {
    mockMarkRead(userId);
    return;
  }
  const ids = readIds();
  for (const n of await getMyNotifications(userId)) ids.add(n.id);
  try {
    window.localStorage.setItem(READ_KEY, JSON.stringify([...ids]));
  } catch {
    // Storage unavailable: the updates show as unread next time.
  }
  emitChange();
}

export async function getMyBerthCalendar(
  userId: string | null,
  year: number,
  monthIndex: number
): Promise<{ label: string; days: CalendarDay[] }> {
  if (ACCOUNT_DATA_SOURCE === "mock") return mockCalendar(userId, year, monthIndex);
  return buildBerthCalendar(userId ? await loadOffers() : [], year, monthIndex);
}

export async function submitMyRelettingRequest(
  userId: string | null,
  input: SubmitRelettingInput
): Promise<Submitted> {
  if (ACCOUNT_DATA_SOURCE === "mock") return mockSubmit(userId, input);
  const result = await submitReletOffer(input);
  if (!result.ok) return { ok: false, error: ownerMessage(result.error) };
  const created = (await loadOffers()).find((r) => r.id === result.value);
  return created ? { ok: true, request: created } : { ok: false, error: FAILED };
}

// Refused by the database while a guest is confirmed in the period.
export async function cancelMyRelettingRequest(
  userId: string | null,
  requestId: string
): Promise<Done> {
  if (ACCOUNT_DATA_SOURCE === "mock") return mockCancel(userId, requestId);
  const result = await cancelReletOffer(requestId);
  return result.ok ? { ok: true } : { ok: false, error: ownerMessage(result.error) };
}

export async function requestMyEarlyReturn(
  userId: string | null,
  requestId: string
): Promise<Done> {
  if (ACCOUNT_DATA_SOURCE === "mock") return mockEarlyReturn(userId, requestId);
  const result = await requestReletEarlyReturn(requestId);
  return result.ok ? { ok: true } : { ok: false, error: ownerMessage(result.error) };
}
