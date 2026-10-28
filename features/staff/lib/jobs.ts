// The dock team's day: how many people a job needs, how full each 30-minute
// slot is, staffing per hour, the busy and quiet hours of the season, and
// which job a marinheiro gets next. Pure; the screens feed it what they read.

import { addDaysIso } from "@/lib/dates";
import { lisbonToIso } from "./format";

export type JobType = "arrival" | "departure" | "return" | "power" | "inspection" | "other";
export type JobStatus = "pending" | "to_do" | "done" | "cancelled";

export type Job = {
  id: string;
  type: JobType;
  status: JobStatus;
  dueAt: string;
  berthCode: string | null;
  boatName: string;
  lengthM: number | null;
  beamM: number | null;
  peopleNeeded: number;
  sortOrder: number | null;
  doneAt: string | null;
  // The members on the job.
  members: string[];
};

export type Shift = {
  memberId: string;
  day: string;
  startsAt: string;
  endsAt: string;
};

const SLOT_MS = 30 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

// Under 12 m one person, 12 to 20 m two, over 20 m three. Unknown: one.
export function peopleForLength(lengthM: number | null): number {
  if (lengthM === null || !Number.isFinite(lengthM) || lengthM < 12) return 1;
  return lengthM <= 20 ? 2 : 3;
}

// The start of the 30-minute slot a moment falls in, as an ISO string.
// Lisbon is a whole number of hours from UTC, so slots line up either way.
export function slotOf(iso: string): string {
  const t = new Date(iso).getTime();
  return new Date(Math.floor(t / SLOT_MS) * SLOT_MS).toISOString();
}

// A shift as two moments; an end at or before the start is the next day.
export function shiftSpan(shift: Shift): { start: number; end: number } {
  const start = new Date(lisbonToIso(shift.day, shift.startsAt.slice(0, 5))).getTime();
  const endDay = shift.endsAt <= shift.startsAt ? addDaysIso(shift.day, 1) : shift.day;
  const end = new Date(lisbonToIso(endDay, shift.endsAt.slice(0, 5))).getTime();
  return { start, end };
}

// Marinheiros on shift for the whole of the slot starting at slotIso.
export function capacityAt(slotIso: string, shifts: Shift[]): number {
  const s = new Date(slotIso).getTime();
  const people = new Set<string>();
  for (const shift of shifts) {
    const { start, end } = shiftSpan(shift);
    if (start <= s && end >= s + SLOT_MS) people.add(shift.memberId);
  }
  return people.size;
}

// People booked into each slot, from jobs still to come.
export function loadBySlot(jobs: Job[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const job of jobs) {
    if (job.status !== "to_do" && job.status !== "pending") continue;
    const key = slotOf(job.dueAt);
    out.set(key, (out.get(key) ?? 0) + job.peopleNeeded);
  }
  return out;
}

export type SlotState = "free" | "full" | "over";

// Free while fewer people are booked than are on shift; full when they match
// (near capacity); over when more are booked than are on shift.
export function slotState(load: number, capacity: number): SlotState {
  if (load === 0 || load < capacity) return "free";
  return load === capacity ? "full" : "over";
}

// The slots of a Lisbon day between two wall-clock hours, as ISO strings.
export function daySlots(day: string, fromHour = 6, toHour = 22): string[] {
  const first = new Date(lisbonToIso(day, `${String(fromHour).padStart(2, "0")}:00`)).getTime();
  const count = (toHour - fromHour) * 2;
  return Array.from({ length: count }, (_, i) => new Date(first + i * SLOT_MS).toISOString());
}

export type HourStaffing = {
  hourIso: string;
  needed: number;
  onShift: number;
  state: "under" | "over" | "ok";
};

// Booked workload per hour (people needed) against marinheiros on shift for
// the whole hour. Under when more are needed than are on; over when at least
// two more are on than the work needs.
export function staffingByHour(day: string, jobs: Job[], shifts: Shift[]): HourStaffing[] {
  const out: HourStaffing[] = [];
  for (let hour = 6; hour < 22; hour += 1) {
    const hourIso = lisbonToIso(day, `${String(hour).padStart(2, "0")}:00`);
    const h = new Date(hourIso).getTime();
    const needed = jobs
      .filter((j) => j.status === "to_do" || j.status === "pending")
      .filter((j) => {
        const t = new Date(j.dueAt).getTime();
        return t >= h && t < h + HOUR_MS;
      })
      .reduce((sum, j) => sum + j.peopleNeeded, 0);
    const people = new Set<string>();
    for (const shift of shifts) {
      const { start, end } = shiftSpan(shift);
      if (start <= h && end >= h + HOUR_MS) people.add(shift.memberId);
    }
    const onShift = people.size;
    out.push({
      hourIso,
      needed,
      onShift,
      state: needed > onShift ? "under" : onShift - needed >= 2 ? "over" : "ok",
    });
  }
  return out;
}

// People-jobs completed in each weekday (0 Monday) and Lisbon hour, from
// finished jobs. The screen shades each cell against the busiest.
export function busyHours(jobs: Job[]): { grid: number[][]; max: number } {
  const grid = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
  const parts = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    hour: "2-digit",
    hourCycle: "h23",
    timeZone: "Europe/Lisbon",
  });
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  for (const job of jobs) {
    if (job.status !== "done") continue;
    const p = parts.formatToParts(new Date(job.dueAt));
    const weekday = days.indexOf(p.find((x) => x.type === "weekday")?.value ?? "");
    const hour = Number(p.find((x) => x.type === "hour")?.value);
    if (weekday < 0 || !Number.isFinite(hour)) continue;
    grid[weekday]![hour]! += job.peopleNeeded;
  }
  return { grid, max: Math.max(0, ...grid.flat()) };
}

// How far apart two pontoons are: their letters' distance, 0 for the same.
// A berth without a pontoon counts as far.
export function pontoonDistance(a: string | null, b: string | null): number {
  if (!a || !b) return 99;
  return Math.abs(a.toUpperCase().charCodeAt(0) - b.toUpperCase().charCodeAt(0));
}

export function pontoonOf(berthCode: string | null): string | null {
  return berthCode ? (berthCode.split("-")[0] ?? null) : null;
}

// The job a marinheiro should do next. Only open jobs they are not already on
// that still need people. A dockmaster's order comes first; otherwise the
// earliest job, and among jobs due within 30 minutes of it, the one on the
// same or nearest pontoon to where they just finished.
export function nextJob<T extends Job>(
  jobs: T[],
  memberId: string,
  lastPontoon: string | null
): T | null {
  const open = jobs.filter(
    (j) =>
      j.status === "to_do" && !j.members.includes(memberId) && j.members.length < j.peopleNeeded
  );
  if (open.length === 0) return null;
  const ordered = open
    .filter((j) => j.sortOrder !== null)
    .sort((a, b) => a.sortOrder! - b.sortOrder! || a.dueAt.localeCompare(b.dueAt));
  if (ordered.length > 0) return ordered[0]!;
  const byTime = [...open].sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const earliest = new Date(byTime[0]!.dueAt).getTime();
  const window = byTime.filter((j) => new Date(j.dueAt).getTime() - earliest <= SLOT_MS);
  return window.sort(
    (a, b) =>
      pontoonDistance(pontoonOf(a.berthCode), lastPontoon) -
        pontoonDistance(pontoonOf(b.berthCode), lastPontoon) || a.dueAt.localeCompare(b.dueAt)
  )[0]!;
}

// A job still needing people that starts within the next 30 minutes.
export function understaffedSoon(job: Job, now: Date): boolean {
  const t = new Date(job.dueAt).getTime() - now.getTime();
  return job.status === "to_do" && job.members.length < job.peopleNeeded && t >= 0 && t <= SLOT_MS;
}
