// When a document or a right of use runs out, measured in Lisbon days.

import { daysBetween } from "@/lib/dates";

export const EXPIRY_WARNING_DAYS = 30;

export type Expiry =
  | { state: "none" }
  | { state: "expired"; days: number }
  | { state: "soon"; days: number }
  | { state: "valid"; days: number };

// "soon" covers today up to 30 days ahead; the day after the expiry date is
// the first day it counts as expired.
export function expiryOf(expiresOn: string | null, today: string): Expiry {
  if (!expiresOn) return { state: "none" };
  const days = daysBetween(today, expiresOn);
  if (Number.isNaN(days)) return { state: "none" };
  if (days < 0) return { state: "expired", days };
  if (days <= EXPIRY_WARNING_DAYS) return { state: "soon", days };
  return { state: "valid", days };
}

// How many of these dates are expired, and how many expire within 30 days.
export function countExpiries(
  dates: (string | null)[],
  today: string
): { expired: number; soon: number } {
  let expired = 0;
  let soon = 0;
  for (const date of dates) {
    const e = expiryOf(date, today);
    if (e.state === "expired") expired += 1;
    if (e.state === "soon") soon += 1;
  }
  return { expired, soon };
}
