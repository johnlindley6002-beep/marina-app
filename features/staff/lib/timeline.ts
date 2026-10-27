// The berth planner's grid: one row per berth, one cell per day, each cell
// one of five kinds, built from the same live berth status the berth map uses.

import { addDaysIso } from "@/lib/dates";
import type { BerthOperationalInfo } from "@/lib/data";

export const PLANNER_DAYS = 14;

export type CellKind = "stay" | "holder" | "relet" | "free" | "oos";

export type Cell = {
  date: string;
  kind: CellKind;
  // The guest arrival in this cell, when there is one.
  enquiryId: string | null;
  // True on the first day of a run of the same stay, where its name shows.
  starts: boolean;
};

export function plannerDates(start: string, days = PLANNER_DAYS): string[] {
  return Array.from({ length: days }, (_, i) => addDaysIso(start, i));
}

// A guest aboard or expected is a stay, whether on a free berth or on a
// berth holder's relet; the holder's own boat or absence is the holder's; a
// released, unbooked night is available for reletting.
export function cellKind(info: BerthOperationalInfo | undefined): CellKind {
  if (!info) return "free";
  switch (info.status) {
    case "out-of-service":
      return "oos";
    case "released":
      return "relet";
    case "owner-away":
      return "holder";
    case "reserved":
      return "stay";
    case "occupied":
      return info.enquiryId || info.relettingId ? "stay" : "holder";
    case "free":
      return "free";
  }
}

// One berth's row across the window. statusesByDate holds the berth map's
// statuses for each date, keyed by berth code.
export function berthRow(
  berthCode: string,
  dates: string[],
  statusesByDate: Record<string, Record<string, BerthOperationalInfo>>
): Cell[] {
  const cells: Cell[] = [];
  for (const date of dates) {
    const info = statusesByDate[date]?.[berthCode];
    const kind = cellKind(info);
    const enquiryId = info?.enquiryId ?? null;
    const previous = cells[cells.length - 1];
    const starts =
      kind === "stay" &&
      (previous === undefined || previous.kind !== "stay" || previous.enquiryId !== enquiryId);
    cells.push({ date, kind, enquiryId, starts });
  }
  return cells;
}
