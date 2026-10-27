// The berth map as an operational tool: one live status per berth, built from
// out-of-service marks, holder reletting and approved enquiries, plus the
// released-berth suggestions staff use when allocating a visitor.

import { getAllBerths } from "@/data/berths";
import { addDaysIso, effectiveEnquiryDeparture, nightDates } from "@/lib/dates";
import { CLASS_BEAM_RANGES, CLASS_LENGTH_RANGES, type MarinaClass } from "@/data/marinas";
import { ACCOUNTS, BERTH_LINKS } from "./accounts";
import { loadReletStore, formatWindow } from "./reletting";
import { loadEnquiryStore, getOutOfServiceBerths } from "./enquiries";

// ---- The berth map as an operational tool ----

export type BerthOperationalStatus =
  "occupied" | "free" | "reserved" | "owner-away" | "released" | "out-of-service";

export type BerthOperationalInfo = {
  status: BerthOperationalStatus;
  detail: string;
  enquiryId?: string;
  relettingId?: string;
};

// A live status per berth for one date (default: today), built entirely from
// the records above: out-of-service marks, a holder's own boat versus their
// reletting, and approved enquiries. Every berth in the marina gets an entry.
export function getBerthStatuses(
  marinaId: string,
  dateIso: string
): Record<string, BerthOperationalInfo> {
  const out: Record<string, BerthOperationalInfo> = {};
  const oosMarks = getOutOfServiceBerths(marinaId);
  const oos = new Map(oosMarks.map((m) => [m.berthId, m]));
  const approvedEnquiries = loadEnquiryStore().enquiries.filter(
    (e) => e.marinaId === marinaId && e.status === "approved"
  );
  const reletRequests = loadReletStore().requests.filter(
    (r) => r.marinaId === marinaId && ["approved", "listed", "booked"].includes(r.status)
  );

  for (const berth of getAllBerths()) {
    const mark = oos.get(berth.id);
    if (mark) {
      out[berth.id] = { status: "out-of-service", detail: mark.reason || "Marked out of service." };
      continue;
    }

    const link = BERTH_LINKS.find(
      (l) => l.marinaId === marinaId && l.berthId === berth.id && l.active
    );
    if (link) {
      const request = reletRequests.find(
        (r) => r.berthId === berth.id && dateIso >= r.startDate && dateIso < r.endDate
      );
      if (request) {
        if (request.bookedNights.includes(dateIso)) {
          out[berth.id] = {
            status: "occupied",
            detail: "A guest is aboard for these dates.",
            relettingId: request.id,
          };
        } else if ((request.approvedNights ?? []).includes(dateIso)) {
          out[berth.id] = {
            status: "released",
            detail: `Released by the berth holder, ${formatWindow(request.startDate, request.endDate)}.`,
            relettingId: request.id,
          };
        } else {
          out[berth.id] = {
            status: "owner-away",
            detail: "The berth holder is away; not cleared for reletting on this date.",
            relettingId: request.id,
          };
        }
      } else {
        out[berth.id] = {
          status: "occupied",
          detail: `${link.boatOnFile.name}, the berth holder's own boat.`,
        };
      }
      continue;
    }

    // A boat that has arrived still occupies the berth through its departure
    // day, until staff actually check it out; a not-yet-arrived booking only
    // reserves the berth up to (not including) its departure day, so the next
    // guest's arrival day is free to show as such.
    const enquiry = approvedEnquiries.find(
      (e) =>
        e.assignedBerthId === berth.id &&
        e.arrivalStatus !== "departed" &&
        dateIso >= e.arrival &&
        (e.arrivalStatus === "arrived"
          ? dateIso <= effectiveEnquiryDeparture(e)
          : dateIso < effectiveEnquiryDeparture(e))
    );
    if (enquiry) {
      out[berth.id] =
        enquiry.arrivalStatus === "arrived"
          ? {
              status: "occupied",
              detail: `${enquiry.boatName || "A guest boat"}, on site.`,
              enquiryId: enquiry.id,
            }
          : {
              status: "reserved",
              detail: `${enquiry.boatName || "A guest boat"}, arriving ${enquiry.eta || "soon"}.`,
              enquiryId: enquiry.id,
            };
    } else {
      out[berth.id] = { status: "free", detail: "No booking for this date." };
    }
  }
  return out;
}

export function boatFitsMarinaClass(
  dims: { loa: number; beam: number },
  sizeClass: MarinaClass
): boolean {
  return (
    dims.loa <= CLASS_LENGTH_RANGES[sizeClass].maxM && dims.beam <= CLASS_BEAM_RANGES[sizeClass]
  );
}

export type ReleasedBerthSuggestion = {
  berthId: string;
  sizeClass: MarinaClass;
  requestId: string;
  ownerName: string;
  availableFrom: string;
  availableTo: string;
};

// Released holder berths that fit a boat and clear every night of a stay,
// respecting the marina's own buffer and any staff-set conditions from the
// approval. Used to suggest a berth when staff assign an incoming visitor.
export function suggestReleasedBerths(
  marinaId: string,
  dims: { loa: number; beam: number },
  stay: { arrival: string; departure: string }
): ReleasedBerthSuggestion[] {
  const nights = nightDates(stay.arrival, stay.departure);
  if (nights.length === 0) return [];
  const allBerths = getAllBerths();
  const requests = loadReletStore().requests.filter(
    (r) => r.marinaId === marinaId && ["approved", "listed", "booked"].includes(r.status)
  );
  const out: ReleasedBerthSuggestion[] = [];
  for (const request of requests) {
    const berth = allBerths.find((b) => b.id === request.berthId);
    if (!berth) continue;
    const approved = new Set(request.approvedNights ?? []);
    const booked = new Set(request.bookedNights);
    const everyNightClear = nights.every((n) => approved.has(n) && !booked.has(n));
    if (!everyNightClear) continue;

    const cond = request.conditions;
    if (cond?.maxLengthM && dims.loa > cond.maxLengthM) continue;
    if (cond?.maxBeamM && dims.beam > cond.maxBeamM) continue;
    if (cond?.earliestReletDate && stay.arrival < cond.earliestReletDate) continue;
    const bufferDays = cond?.bufferDays ?? 0;
    if (bufferDays > 0 && stay.departure > addDaysIso(request.endDate, -bufferDays)) continue;
    if (!boatFitsMarinaClass(dims, berth.sizeClass)) continue;

    const owner = ACCOUNTS.find((a) => a.id === request.userId);
    out.push({
      berthId: berth.id,
      sizeClass: berth.sizeClass,
      requestId: request.id,
      ownerName: owner?.name ?? "Berth holder",
      availableFrom: request.startDate,
      availableTo: request.endDate,
    });
  }
  return out;
}
