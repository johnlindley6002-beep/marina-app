// The one place for calendar-date maths.
//
// Dates are plain "YYYY-MM-DD" strings (a calendar day, no clock, no zone).
// All arithmetic is done on whole days since the Unix epoch in UTC, so the
// result never depends on the device's time zone or on a daylight-saving
// change. The only place wall-clock time matters is "today", which is the
// current day in Portugal (Europe/Lisbon), because that is where a marina day
// starts, wherever the boater happens to be.

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})/;
const DAY_MS = 86_400_000;

export type IsoDate = string;

// Whole days since 1970-01-01 for a "YYYY-MM-DD" (or longer ISO) string, or
// null when it is not a real calendar date. A date such as 2026-02-31 is
// rejected rather than silently rolled into March.
export function toDayNumber(iso: string): number | null {
  const m = ISO_DATE.exec(iso);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const ms = Date.UTC(year, month - 1, day);
  const check = new Date(ms);
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return null;
  }
  return Math.round(ms / DAY_MS);
}

export function fromDayNumber(day: number): IsoDate {
  const d = new Date(day * DAY_MS);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export function isValidIsoDate(iso: string): boolean {
  return toDayNumber(iso) !== null;
}

export function addDaysIso(iso: IsoDate, days: number): IsoDate {
  const day = toDayNumber(iso);
  return day === null ? iso : fromDayNumber(day + days);
}

// Days from a to b (negative when b is earlier), or NaN when either is not a date.
export function daysBetween(a: IsoDate, b: IsoDate): number {
  const da = toDayNumber(a);
  const db = toDayNumber(b);
  return da === null || db === null ? Number.NaN : db - da;
}

// Nights between arrival and departure; 0 when the range is empty or invalid.
export function countNights(startDate: IsoDate, endDate: IsoDate): number {
  const n = daysBetween(startDate, endDate);
  return Number.isNaN(n) || n < 1 ? 0 : n;
}

// Every night of a stay: the arrival day up to, but not including, the
// departure day. A stay of 29 March to 2 April has the nights of the 29th,
// 30th, 31st, 1st.
export function nightDates(startDate: IsoDate, endDate: IsoDate): IsoDate[] {
  const start = toDayNumber(startDate);
  const nights = countNights(startDate, endDate);
  if (start === null || nights < 1) return [];
  return Array.from({ length: nights }, (_, i) => fromDayNumber(start + i));
}

// True while [startA, endA) and [startB, endB) share a night.
export function rangesOverlap(
  startA: IsoDate,
  endA: IsoDate,
  startB: IsoDate,
  endB: IsoDate
): boolean {
  return startA < endB && startB < endA;
}

// 1 (January) to 12 (December), read straight from the string.
export function monthOfIso(iso: IsoDate): number {
  return Number(iso.slice(5, 7));
}

const LISBON_DAY = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Lisbon",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// The current calendar day in Portugal. Pass `now` in tests.
export function todayIso(now: Date = new Date()): IsoDate {
  return LISBON_DAY.format(now);
}

// A full ISO timestamp as a Lisbon calendar day.
export function isoDateOfTimestamp(timestamp: string): IsoDate {
  const d = new Date(timestamp);
  return Number.isNaN(d.getTime()) ? timestamp.slice(0, 10) : LISBON_DAY.format(d);
}

// Whole years between a birth date and a reference day (the birthday counts
// on the day it falls). Null when either is not a date.
export function ageOn(birthDate: IsoDate, onDate: IsoDate): number | null {
  const b = ISO_DATE.exec(birthDate);
  const o = ISO_DATE.exec(onDate);
  if (!b || !o || toDayNumber(birthDate) === null || toDayNumber(onDate) === null) return null;
  let age = Number(o[1]) - Number(b[1]);
  const beforeBirthday =
    Number(o[2]) < Number(b[2]) || (Number(o[2]) === Number(b[2]) && Number(o[3]) < Number(b[3]));
  if (beforeBirthday) age -= 1;
  return age;
}

// The day a boat leaves the berth: the departure date, or one night after
// arrival for an open-ended enquiry with no departure set yet.
export function effectiveEnquiryDeparture(e: { arrival: string; departure: string }): IsoDate {
  return e.departure || addDaysIso(e.arrival, 1);
}

// "2026-07-06" as "6 July 2026". A full timestamp is shown as its Lisbon day.
// Falls back to the input when it is not a date.
export function formatLongDate(iso: string, locale = "en-GB"): string {
  const day = iso.includes("T") ? toDayNumber(isoDateOfTimestamp(iso)) : toDayNumber(iso);
  if (day === null) return iso;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(day * DAY_MS));
}

// "6 July", no year.
export function formatDayMonth(iso: string, locale = "en-GB"): string {
  const day = toDayNumber(iso);
  if (day === null) return iso;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(day * DAY_MS));
}
