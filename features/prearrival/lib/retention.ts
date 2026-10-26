import { daysBetween } from "@/lib/dates";
import type { PreArrivalDraft } from "./schema";

// A submitted check-in holds passport and ID numbers, so it is not kept for
// ever. Once the stay is 30 days behind, it is dropped from this device. A
// check-in with no departure date is kept, since the stay may still be ahead.
export const CHECK_IN_RETENTION_DAYS = 30;

function departureDay(draft: PreArrivalDraft): string {
  return draft.voyage.departureDateTime.slice(0, 10) || draft.stay.requestedDeparture;
}

export function pruneCheckIns<T extends { draft: PreArrivalDraft }>(
  checkIns: T[],
  today: string
): T[] {
  return checkIns.filter((c) => {
    const departure = departureDay(c.draft);
    if (!departure) return true;
    const daysSince = daysBetween(departure, today);
    return Number.isNaN(daysSince) || daysSince <= CHECK_IN_RETENTION_DAYS;
  });
}
