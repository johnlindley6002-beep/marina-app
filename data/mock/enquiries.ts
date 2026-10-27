// STAFF BACK OFFICE data: berth enquiries ("Request a berth"), the arrivals
// they become, and berths marked out of service. Gated by the staff role and
// scoped to the marina the staff member belongs to; the real backend must
// enforce that scoping server-side.

import {
  addDaysIso,
  effectiveEnquiryDeparture,
  nightDates,
  rangesOverlap,
  todayIso,
} from "@/lib/dates";
import { ENQUIRY_KEY, OOS_KEY, readJson, writeJson, removeKey, emitChange, newId } from "./storage";
import {
  BERTH_LINKS,
  getStaffMemberships,
  isStaffOfMarina,
  type StaffActionResult,
} from "./accounts";
import { loadReletStore } from "./reletting";
import { activeSnapshot } from "./snapshot";

// ============================================================================
// STAFF BACK OFFICE
//
// Everything below is for the marina's own staff: incoming berth enquiries
// (the boater's "Request a berth" flow, submitted here in addition to its
// existing mailto), the day-to-day berth map, check-in and check-out, and
// simple records. All of it is gated by the "staff" role and scoped to the
// marina(s) that staff member belongs to (see getStaffMemberships). The real
// backend must enforce that scoping server-side, exactly as commented for
// reletting above; this is still a client-side mock with no real security.
// ============================================================================

// ---- Enquiries ("Request a berth") ----

export type EnquiryStatus = "new" | "approved" | "declined";
export type EnquiryArrivalStatus = "pending" | "arrived" | "departed";

export type EnquiryDocuments = {
  registrationNumber: string;
  insuranceProvider: string;
  insurancePolicy: string;
  insuranceExpiry: string;
  competenceCertificate: string;
  vhfLicence: string;
};

export const EMPTY_ENQUIRY_DOCUMENTS: EnquiryDocuments = {
  registrationNumber: "",
  insuranceProvider: "",
  insurancePolicy: "",
  insuranceExpiry: "",
  competenceCertificate: "",
  vhfLicence: "",
};

export type EnquiryCrewMember = {
  personType: string;
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  passportNumber: string;
  role: string;
  joinDate: string;
};

export type EnquiryServices = {
  shorePower: boolean;
  amperage: string;
  water: boolean;
  helpMooring: boolean;
  helpSlipping: boolean;
  pumpOut: boolean;
  fuel: boolean;
  laundry: boolean;
};

export type Enquiry = {
  id: string;
  marinaId: string;
  status: EnquiryStatus;
  arrivalStatus: EnquiryArrivalStatus;
  createdAt: string;
  decisionAt: string | null;
  decisionNote: string;
  assignedBerthId: string | null;
  arrivedAt: string | null;
  departedAt: string | null;
  // A short staff-only note, for example "needs a tow to the berth".
  flagNote: string;

  arrival: string;
  eta: string;
  departure: string;
  etd: string;
  openEnded: boolean;

  boatName: string;
  vesselType: string;
  loa: string;
  beam: string;
  draft: string;
  flagCountry: string;
  // The berth the boater selected on the map, if any. Separate from
  // assignedBerthId, which is what staff actually confirm on approval.
  requestedBerthId: string;

  skipperName: string;
  phone: string;
  email: string;
  homePort: string;
  peopleOnBoard: string;

  services: EnquiryServices;

  vesselUse: string;
  // Filled only when vesselUse is not "private".
  operatingEntity: string;
  companyRegistration: string;
  contractName: string;
  contractRole: string;
  euStatus: "yes" | "no" | "";
  lastPort: string;
  nextPort: string;
  crew: EnquiryCrewMember[];

  // Text only, as entered by the boater. Read-only here, never uploads.
  documents: EnquiryDocuments;
};

export type EnquiryStore = { enquiries: Enquiry[] };

export function seedEnquiry(overrides: Partial<Enquiry> & Pick<Enquiry, "id">): Enquiry {
  const today = todayIso();
  return {
    marinaId: "cascais",
    status: "new",
    arrivalStatus: "pending",
    createdAt: today + "T09:00:00.000Z",
    decisionAt: null,
    decisionNote: "",
    assignedBerthId: null,
    arrivedAt: null,
    departedAt: null,
    flagNote: "",
    arrival: today,
    eta: "12:00",
    departure: addDaysIso(today, 3),
    etd: "10:00",
    openEnded: false,
    boatName: "",
    vesselType: "sail",
    loa: "9.0",
    beam: "3.1",
    draft: "1.5",
    flagCountry: "Portugal",
    requestedBerthId: "",
    skipperName: "",
    phone: "",
    email: "",
    homePort: "",
    peopleOnBoard: "2",
    services: {
      shorePower: false,
      amperage: "",
      water: false,
      helpMooring: false,
      helpSlipping: false,
      pumpOut: false,
      fuel: false,
      laundry: false,
    },
    vesselUse: "private",
    operatingEntity: "",
    companyRegistration: "",
    contractName: "",
    contractRole: "",
    euStatus: "yes",
    lastPort: "",
    nextPort: "",
    crew: [],
    documents: { ...EMPTY_ENQUIRY_DOCUMENTS },
    ...overrides,
  };
}

export function buildSeedEnquiryStore(): EnquiryStore {
  const today = todayIso();
  return {
    enquiries: [
      // Arriving today, still pending check-in: exercises Arrivals and Check-in.
      seedEnquiry({
        id: "enquiry-seed-1",
        status: "approved",
        assignedBerthId: "P-2",
        arrival: today,
        eta: "11:00",
        departure: addDaysIso(today, 3),
        etd: "10:00",
        boatName: "Kestrel",
        vesselType: "sail",
        loa: "9.2",
        beam: "3.2",
        draft: "1.6",
        flagCountry: "Portugal",
        skipperName: "Ines Ferreira",
        phone: "+351 913 000 111",
        email: "ines.ferreira@example.com",
        peopleOnBoard: "3",
        services: {
          shorePower: true,
          amperage: "16",
          water: true,
          helpMooring: true,
          helpSlipping: false,
          pumpOut: false,
          fuel: false,
          laundry: false,
        },
        decisionAt: today + "T08:00:00.000Z",
        documents: {
          registrationNumber: "PT-KE-4471",
          insuranceProvider: "Fidelidade",
          insurancePolicy: "FI-2026-88213",
          insuranceExpiry: addDaysIso(today, 200),
          competenceCertificate: "Yacht Master Coastal",
          vhfLicence: "SROC-PT-3391",
        },
      }),
      // Already on site: exercises the on-site list and check-out.
      seedEnquiry({
        id: "enquiry-seed-2",
        status: "approved",
        arrivalStatus: "arrived",
        assignedBerthId: "P-4",
        arrival: addDaysIso(today, -1),
        eta: "16:00",
        departure: today,
        etd: "12:00",
        arrivedAt: addDaysIso(today, -1) + "T16:20:00.000Z",
        boatName: "Aurora",
        vesselType: "motor",
        loa: "8.4",
        beam: "3.0",
        draft: "1.1",
        flagCountry: "Spain",
        skipperName: "Marc Duran",
        phone: "+34 611 222 333",
        email: "marc.duran@example.com",
        peopleOnBoard: "4",
        services: {
          shorePower: false,
          amperage: "",
          water: true,
          helpMooring: false,
          helpSlipping: true,
          pumpOut: false,
          fuel: true,
          laundry: false,
        },
        decisionAt: addDaysIso(today, -2) + "T10:00:00.000Z",
        documents: {
          registrationNumber: "ES-AU-1029",
          insuranceProvider: "Mapfre",
          insurancePolicy: "MP-77210",
          insuranceExpiry: addDaysIso(today, 90),
          competenceCertificate: "",
          vhfLicence: "",
        },
      }),
      // Needs a decision: exercises the Enquiries inbox.
      seedEnquiry({
        id: "enquiry-seed-3",
        status: "new",
        arrival: addDaysIso(today, 5),
        eta: "17:30",
        departure: addDaysIso(today, 8),
        etd: "09:00",
        boatName: "Halcyon",
        vesselType: "sail",
        loa: "7.8",
        beam: "2.7",
        draft: "1.4",
        flagCountry: "France",
        skipperName: "Camille Rousseau",
        phone: "+33 6 12 34 56 78",
        email: "camille.rousseau@example.com",
        peopleOnBoard: "2",
        services: {
          shorePower: true,
          amperage: "16",
          water: false,
          helpMooring: false,
          helpSlipping: false,
          pumpOut: false,
          fuel: false,
          laundry: true,
        },
        vesselUse: "private",
        euStatus: "yes",
        crew: [
          {
            personType: "crew",
            fullName: "Camille Rousseau",
            dateOfBirth: "",
            nationality: "French",
            passportNumber: "",
            role: "Skipper",
            joinDate: "",
          },
        ],
      }),
      // Needs a decision, larger boat, no berth pre-picked: a second inbox item.
      seedEnquiry({
        id: "enquiry-seed-4",
        status: "new",
        arrival: addDaysIso(today, 2),
        eta: "14:00",
        departure: addDaysIso(today, 4),
        etd: "11:00",
        boatName: "Meridian",
        vesselType: "motor",
        loa: "13.5",
        beam: "4.2",
        draft: "1.8",
        flagCountry: "United Kingdom",
        skipperName: "Oliver Hart",
        phone: "+44 7700 900555",
        email: "oliver.hart@example.com",
        peopleOnBoard: "6",
        services: {
          shorePower: true,
          amperage: "32",
          water: true,
          helpMooring: true,
          helpSlipping: true,
          pumpOut: true,
          fuel: false,
          laundry: false,
        },
        vesselUse: "bareboat",
        operatingEntity: "Solent Yacht Charters Ltd",
        companyRegistration: "GB-08217743",
        contractName: "",
        contractRole: "",
        euStatus: "no",
        lastPort: "Gibraltar",
        nextPort: "Lagos",
        crew: [
          {
            personType: "crew",
            fullName: "Oliver Hart",
            dateOfBirth: "1985-04-11",
            nationality: "British",
            passportNumber: "998211037",
            role: "Skipper",
            joinDate: "",
          },
          {
            personType: "guest",
            fullName: "Amy Hart",
            dateOfBirth: "1987-09-02",
            nationality: "British",
            passportNumber: "998211038",
            role: "Guest",
            joinDate: "",
          },
        ],
      }),
      // Declined already: fills out the inbox filter and Records.
      seedEnquiry({
        id: "enquiry-seed-5",
        status: "declined",
        arrival: addDaysIso(today, 1),
        departure: addDaysIso(today, 2),
        boatName: "Windrose",
        vesselType: "catamaran",
        loa: "11.0",
        beam: "6.2",
        draft: "1.2",
        flagCountry: "Germany",
        skipperName: "Lena Fischer",
        phone: "+49 151 22334455",
        email: "lena.fischer@example.com",
        peopleOnBoard: "5",
        decisionAt: addDaysIso(today, -1) + "T09:00:00.000Z",
        decisionNote: "No catamaran berth free for those dates.",
      }),
    ],
  };
}

export function loadEnquiryStore(): EnquiryStore {
  const snapshot = activeSnapshot();
  if (snapshot) return snapshot.enquiries;
  const stored = readJson<EnquiryStore>(ENQUIRY_KEY);
  return stored ?? buildSeedEnquiryStore();
}

export function saveEnquiryStore(store: EnquiryStore) {
  const snapshot = activeSnapshot();
  if (snapshot) {
    snapshot.enquiries = store;
    return;
  }
  writeJson(ENQUIRY_KEY, store);
  emitChange();
}

// Called by the boater's Request a berth form, in addition to (not instead of)
// its existing mailto: the email is still the record of the enquiry; this is
// what lets staff act on it in real time instead of only replying by email.
// No sign-in is needed to submit one, the same as the mailto today.
export type SubmitEnquiryInput = Omit<
  Enquiry,
  | "id"
  | "status"
  | "arrivalStatus"
  | "createdAt"
  | "decisionAt"
  | "decisionNote"
  | "assignedBerthId"
  | "arrivedAt"
  | "departedAt"
  | "flagNote"
>;

export function submitEnquiry(input: SubmitEnquiryInput): Enquiry {
  const store = loadEnquiryStore();
  const enquiry: Enquiry = {
    ...input,
    id: newId("enquiry"),
    status: "new",
    arrivalStatus: "pending",
    createdAt: new Date().toISOString(),
    decisionAt: null,
    decisionNote: "",
    assignedBerthId: null,
    arrivedAt: null,
    departedAt: null,
    flagNote: "",
  };
  saveEnquiryStore({ enquiries: [enquiry, ...store.enquiries] });
  return enquiry;
}

// Every enquiry for the marina(s) this staff member belongs to. Screens filter
// by status, date or search themselves; this always returns the full list so
// counts and filters stay in step.
export function getEnquiries(staffUserId: string | null): Enquiry[] {
  const marinaIds = getStaffMemberships(staffUserId).map((m) => m.marinaId);
  if (marinaIds.length === 0) return [];
  return loadEnquiryStore()
    .enquiries.filter((e) => marinaIds.includes(e.marinaId))
    .sort((a, b) => {
      const rank = (status: EnquiryStatus) => (status === "new" ? 0 : 1);
      return rank(a.status) - rank(b.status) || a.arrival.localeCompare(b.arrival);
    });
}

export type BerthConflictResult = { ok: true } | { ok: false; error: string };

// Whether a berth is free for a transient stay across [arrival, departure).
// Checks other approved, still-on-the-books enquiries on the same berth and,
// for a berth someone holds, whether its owner has cleared every one of those
// nights for reletting. The real backend must run the same check inside a
// transaction (or a unique constraint), so two staff members cannot double
// book a berth from two tabs.
export function checkBerthAvailability(
  marinaId: string,
  berthId: string,
  arrival: string,
  departure: string,
  excludeEnquiryId?: string
): BerthConflictResult {
  if (!(arrival < departure)) {
    return { ok: false, error: "Choose a departure date after the arrival date." };
  }
  const conflict = loadEnquiryStore().enquiries.find(
    (e) =>
      e.id !== excludeEnquiryId &&
      e.marinaId === marinaId &&
      e.assignedBerthId === berthId &&
      e.status === "approved" &&
      e.arrivalStatus !== "departed" &&
      rangesOverlap(arrival, departure, e.arrival, effectiveEnquiryDeparture(e))
  );
  if (conflict) {
    return {
      ok: false,
      error: `Berth ${berthId} already holds ${conflict.boatName || "another boat"} for overlapping dates.`,
    };
  }
  const link = BERTH_LINKS.find(
    (l) => l.marinaId === marinaId && l.berthId === berthId && l.active
  );
  if (link) {
    const nights = nightDates(arrival, departure);
    const requests = loadReletStore().requests.filter(
      (r) => r.berthId === berthId && ["approved", "listed", "booked"].includes(r.status)
    );
    const cleared = new Set(requests.flatMap((r) => r.approvedNights ?? []));
    if (nights.some((n) => !cleared.has(n))) {
      return {
        ok: false,
        error: `Berth ${berthId} is a berth holder's own berth, and it is not cleared for reletting on all of these dates.`,
      };
    }
    const alreadyBooked = requests.some((r) => nights.some((n) => r.bookedNights.includes(n)));
    if (alreadyBooked) {
      return {
        ok: false,
        error: `Berth ${berthId} already has a guest booked on part of these dates.`,
      };
    }
  }
  if (getOutOfServiceBerths(marinaId).some((m) => m.berthId === berthId)) {
    return { ok: false, error: `Berth ${berthId} is marked out of service.` };
  }
  return { ok: true };
}

export type EnquiryActionResult = { ok: true; enquiry: Enquiry } | { ok: false; error: string };

// Approve assigns a berth (conflict-checked) and is the real-time reply to the
// boater. Decline can carry a short reason. Both are final; use
// reassignEnquiryBerth afterwards to move an approved boat to another berth.
export function decideEnquiry(
  staffUserId: string | null,
  enquiryId: string,
  decision: "approve" | "decline",
  options: { berthId?: string; reason?: string } = {}
): EnquiryActionResult {
  const store = loadEnquiryStore();
  const enquiry = store.enquiries.find((e) => e.id === enquiryId);
  if (!enquiry) return { ok: false, error: "Enquiry not found." };
  if (!isStaffOfMarina(staffUserId, enquiry.marinaId)) {
    return { ok: false, error: "Only staff of this marina can decide." };
  }
  if (enquiry.status !== "new") {
    return { ok: false, error: "This enquiry has already been decided." };
  }
  if (decision === "approve") {
    if (!options.berthId) {
      return { ok: false, error: "Choose a berth to assign before approving." };
    }
    const check = checkBerthAvailability(
      enquiry.marinaId,
      options.berthId,
      enquiry.arrival,
      effectiveEnquiryDeparture(enquiry)
    );
    if (!check.ok) return check;
  }
  const next: Enquiry = {
    ...enquiry,
    status: decision === "approve" ? "approved" : "declined",
    decisionAt: new Date().toISOString(),
    decisionNote: (options.reason ?? "").trim(),
    assignedBerthId: decision === "approve" ? (options.berthId as string) : null,
  };
  saveEnquiryStore({ enquiries: store.enquiries.map((e) => (e.id === enquiryId ? next : e)) });
  return { ok: true, enquiry: next };
}

// Assign or change the berth on an already-approved enquiry, conflict-checked
// against everything else on the books.
export function reassignEnquiryBerth(
  staffUserId: string | null,
  enquiryId: string,
  berthId: string
): EnquiryActionResult {
  const store = loadEnquiryStore();
  const enquiry = store.enquiries.find((e) => e.id === enquiryId);
  if (!enquiry) return { ok: false, error: "Enquiry not found." };
  if (!isStaffOfMarina(staffUserId, enquiry.marinaId)) {
    return { ok: false, error: "Only staff of this marina can do this." };
  }
  if (enquiry.status !== "approved") {
    return { ok: false, error: "Only an approved enquiry can be assigned a berth." };
  }
  if (enquiry.arrivalStatus === "departed") {
    return { ok: false, error: "This boat has already departed." };
  }
  const check = checkBerthAvailability(
    enquiry.marinaId,
    berthId,
    enquiry.arrival,
    effectiveEnquiryDeparture(enquiry),
    enquiry.id
  );
  if (!check.ok) return check;
  const next = { ...enquiry, assignedBerthId: berthId };
  saveEnquiryStore({ enquiries: store.enquiries.map((e) => (e.id === enquiryId ? next : e)) });
  return { ok: true, enquiry: next };
}

export function markEnquiryArrived(
  staffUserId: string | null,
  enquiryId: string
): EnquiryActionResult {
  const store = loadEnquiryStore();
  const enquiry = store.enquiries.find((e) => e.id === enquiryId);
  if (!enquiry) return { ok: false, error: "Enquiry not found." };
  if (!isStaffOfMarina(staffUserId, enquiry.marinaId)) {
    return { ok: false, error: "Only staff of this marina can do this." };
  }
  if (enquiry.status !== "approved" || enquiry.arrivalStatus !== "pending") {
    return { ok: false, error: "This boat cannot be marked arrived from its current state." };
  }
  const next: Enquiry = {
    ...enquiry,
    arrivalStatus: "arrived",
    arrivedAt: new Date().toISOString(),
  };
  saveEnquiryStore({ enquiries: store.enquiries.map((e) => (e.id === enquiryId ? next : e)) });
  return { ok: true, enquiry: next };
}

// Frees the berth: once departed, the enquiry no longer counts toward any
// conflict check or occupancy status for that berth.
export function markEnquiryDeparted(
  staffUserId: string | null,
  enquiryId: string
): EnquiryActionResult {
  const store = loadEnquiryStore();
  const enquiry = store.enquiries.find((e) => e.id === enquiryId);
  if (!enquiry) return { ok: false, error: "Enquiry not found." };
  if (!isStaffOfMarina(staffUserId, enquiry.marinaId)) {
    return { ok: false, error: "Only staff of this marina can do this." };
  }
  if (enquiry.arrivalStatus !== "arrived") {
    return { ok: false, error: "Only a boat that has arrived can be marked departed." };
  }
  const next: Enquiry = {
    ...enquiry,
    arrivalStatus: "departed",
    departedAt: new Date().toISOString(),
  };
  saveEnquiryStore({ enquiries: store.enquiries.map((e) => (e.id === enquiryId ? next : e)) });
  return { ok: true, enquiry: next };
}

// A short staff-only note, for example "needs a tow" or "engine trouble on
// arrival". Never sent to the boater.
export function setEnquiryFlag(
  staffUserId: string | null,
  enquiryId: string,
  note: string
): EnquiryActionResult {
  const store = loadEnquiryStore();
  const enquiry = store.enquiries.find((e) => e.id === enquiryId);
  if (!enquiry) return { ok: false, error: "Enquiry not found." };
  if (!isStaffOfMarina(staffUserId, enquiry.marinaId)) {
    return { ok: false, error: "Only staff of this marina can do this." };
  }
  const next: Enquiry = { ...enquiry, flagNote: note.trim() };
  saveEnquiryStore({ enquiries: store.enquiries.map((e) => (e.id === enquiryId ? next : e)) });
  return { ok: true, enquiry: next };
}

// DEV ONLY: back to the seed enquiries.
export function resetMockEnquiries(): void {
  removeKey(ENQUIRY_KEY);
  emitChange();
}

// ---- Out of service ----

export type OutOfServiceMark = {
  berthId: string;
  marinaId: string;
  reason: string;
  setAt: string;
};

export type OosStore = { marks: OutOfServiceMark[] };

export function loadOosStore(): OosStore {
  const snapshot = activeSnapshot();
  if (snapshot) return snapshot.oos;
  return readJson<OosStore>(OOS_KEY) ?? { marks: [] };
}

export function saveOosStore(store: OosStore) {
  const snapshot = activeSnapshot();
  if (snapshot) {
    snapshot.oos = store;
    return;
  }
  writeJson(OOS_KEY, store);
  emitChange();
}

export function getOutOfServiceBerths(marinaId: string): OutOfServiceMark[] {
  return loadOosStore().marks.filter((m) => m.marinaId === marinaId);
}

export function setBerthOutOfService(
  staffUserId: string | null,
  marinaId: string,
  berthId: string,
  reason: string
): StaffActionResult {
  if (!isStaffOfMarina(staffUserId, marinaId)) {
    return { ok: false, error: "Only staff of this marina can do this." };
  }
  const store = loadOosStore();
  if (store.marks.some((m) => m.berthId === berthId)) {
    return { ok: false, error: "This berth is already out of service." };
  }
  saveOosStore({
    marks: [
      ...store.marks,
      { berthId, marinaId, reason: reason.trim(), setAt: new Date().toISOString() },
    ],
  });
  return { ok: true };
}

export function clearBerthOutOfService(
  staffUserId: string | null,
  marinaId: string,
  berthId: string
): StaffActionResult {
  if (!isStaffOfMarina(staffUserId, marinaId)) {
    return { ok: false, error: "Only staff of this marina can do this." };
  }
  saveOosStore({ marks: loadOosStore().marks.filter((m) => m.berthId !== berthId) });
  return { ok: true };
}

// DEV ONLY: back to no marks.
export function resetMockOutOfService(): void {
  removeKey(OOS_KEY);
  emitChange();
}
