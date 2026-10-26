import { nightDates } from "@/lib/dates";

// The nights of a holder's absence the marina offers to visitors. The last
// `bufferDays` nights before the holder returns are kept clear, so the berth is
// empty and ready when they are back. A night is the date a boat sleeps there,
// so for an absence from 10 to 20 July with a 2 day buffer, the offered nights
// are 10 to 17 July, and 18 and 19 July stay clear.
export function nightsOfferedToVisitors(
  startDate: string,
  endDate: string,
  bufferDays: number
): string[] {
  const nights = nightDates(startDate, endDate);
  const keep = Math.max(0, nights.length - Math.max(0, bufferDays));
  return nights.slice(0, keep);
}

// Whether a visitor staying from arrival to departure fits the offered nights.
export function visitorStayFits(
  absence: { startDate: string; endDate: string },
  stay: { arrival: string; departure: string },
  bufferDays: number
): boolean {
  const offered = new Set(nightsOfferedToVisitors(absence.startDate, absence.endDate, bufferDays));
  const wanted = nightDates(stay.arrival, stay.departure);
  return wanted.length > 0 && wanted.every((night) => offered.has(night));
}
