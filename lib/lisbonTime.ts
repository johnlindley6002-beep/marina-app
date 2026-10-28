// Times on the Lisbon clock, for the staff screens and the guest side alike.

const ZONE = "Europe/Lisbon";

// "14:30" for a timestamp.
export function formatClock(timestamp: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: ZONE,
  }).format(new Date(timestamp));
}

// "Tue 27" for a YYYY-MM-DD day, used as a planner column heading.
export function formatWeekday(iso: string, locale: string): { weekday: string; day: string } {
  const date = new Date(`${iso}T12:00:00Z`);
  return {
    weekday: new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }).format(date),
    day: String(date.getUTCDate()),
  };
}

// The current Lisbon wall clock as "HH:MM".
export function lisbonClockNow(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: ZONE,
  }).format(now);
}

// A Lisbon day and wall-clock time as an ISO timestamp, whatever the
// device's own time zone is.
export function lisbonToIso(day: string, clock: string): string {
  const [y, m, d] = day.split("-").map(Number);
  const [hh, mm] = clock.split(":").map(Number);
  const guess = Date.UTC(y!, m! - 1, d!, hh!, mm!);
  // The Lisbon offset at that moment, from the difference between the guess
  // read back on the Lisbon clock and the clock that was asked for.
  const shown = new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: ZONE,
  }).formatToParts(new Date(guess));
  const part = (type: string) => Number(shown.find((p) => p.type === type)?.value);
  const shownUtc = Date.UTC(
    part("year"),
    part("month") - 1,
    part("day"),
    part("hour"),
    part("minute")
  );
  return new Date(guess - (shownUtc - guess)).toISOString();
}
