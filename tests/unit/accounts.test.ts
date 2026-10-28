import { describe, expect, it } from "vitest";
import { dbErrorKey } from "@/data/supabase/errors";
import {
  boatFromRow,
  boatToRow,
  enquiryFromRow,
  enquiryToRequest,
  enquiryToRow,
  type ArrivalRow,
  type BerthIndex,
} from "@/data/supabase/rows";
import { buildBerthCalendar, type RelettingRequest } from "@/data/mock/reletting";
import { seedEnquiry } from "@/data/mock/enquiries";
import { guestError } from "@/features/account/lib/errors";
import { staffError } from "@/features/staff/lib/errors";
import { en } from "@/lib/i18n/locales/en";
import { staffEn } from "@/lib/i18n/staff/en";

describe("database error keys", () => {
  it("tells a double booking from an overlapping holding by the constraint that refused it", () => {
    expect(
      dbErrorKey({
        code: "23P01",
        message: 'conflicting key value violates exclusion constraint "arrivals_no_double_booking"',
      })
    ).toBe("double_booked");
    expect(
      dbErrorKey({
        code: "23P01",
        message: 'conflicting key value violates exclusion constraint "berth_contracts_no_overlap"',
      })
    ).toBe("holding_overlap");
  });

  it("reads the key a database function raised", () => {
    expect(dbErrorKey({ code: "P0001", message: "guest_confirmed" })).toBe("guest_confirmed");
    expect(dbErrorKey({ code: "P0001", message: "berth_not_available" })).toBe(
      "berth_not_available"
    );
    expect(dbErrorKey({ code: "42501", message: "staff_only" })).toBe("staff_only");
    expect(dbErrorKey({ code: "P0001", message: "arrival_not_found" })).toBe("not_found");
  });

  it("falls back to unknown for anything else, including no error", () => {
    expect(dbErrorKey({ code: "XX000", message: "something else" })).toBe("unknown");
    expect(dbErrorKey(null)).toBe("unknown");
  });

  it("has words for a key in the guest and staff dictionaries, and a fallback", () => {
    expect(guestError(en.accounts, "too_many_requests")).toBe(en.accounts.errors.too_many_requests);
    expect(guestError(en.accounts, "double_booked")).toBe(en.accounts.errors.unknown);
    expect(staffError(staffEn, "double_booked")).toBe(staffEn.requests.errors.double_booked);
    expect(staffError(staffEn, "too_many_boats")).toBe(staffEn.requests.errors.unknown);
  });
});

describe("a user's own boat as a row", () => {
  it("round-trips the saved boat, keeping the documents", () => {
    const boat = {
      id: "7f0e6a0e-0000-4000-8000-000000000001",
      name: "Wind Song",
      type: "sail",
      loa: "8.8",
      beam: "3",
      draft: "1.5",
      flag: "United Kingdom",
      homePort: "Southampton",
      documents: {
        registrationNumber: "UK-WS-4410",
        insuranceProvider: "Pantaenius",
        insurancePolicy: "P-1",
        insuranceExpiry: "2027-03-01",
        competenceCertificate: "RYA-1",
        vhfLicence: "",
      },
    };
    const row = boatToRow(boat, "user-1");
    expect(row.user_id).toBe("user-1");
    expect(row.length_m).toBe(8.8);
    expect(row.registration_number).toBe("UK-WS-4410");
    expect(boatFromRow(row)).toEqual(boat);
  });

  it("stores an unnamed boat as My boat, and a blank measure as null", () => {
    const row = boatToRow(
      {
        id: "b",
        name: "  ",
        type: "",
        loa: "",
        beam: "",
        draft: "",
        flag: "",
        homePort: "",
      },
      "user-1"
    );
    expect(row.name).toBe("My boat");
    expect(row.length_m).toBeNull();
    expect(row.documents).toEqual({});
  });
});

describe("an arrival request and a proposal", () => {
  const index: BerthIndex = { codeById: new Map(), idByCode: new Map() };

  it("sends only what the guest chooses, never a status, a user or a berth", () => {
    const { id: _id, ...enquiry } = seedEnquiry({
      id: "x",
      boatName: "Kestrel",
      arrival: "2026-11-10",
      departure: "2026-11-14",
      loa: "9.2",
    });
    const request = enquiryToRequest(enquiry);
    expect(request.expected_arrival).toBe("2026-11-10");
    expect(request.departure).toBe("2026-11-14");
    expect(request.length_m).toBe("9.2");
    for (const forbidden of ["status", "user_id", "boat_id", "berth_id", "decision_note"]) {
      expect(request).not.toHaveProperty(forbidden);
    }
  });

  it("reads other dates staff offered, and never writes them back", () => {
    const enquiry = seedEnquiry({ id: "y", status: "dates_proposed" });
    const row = enquiryToRow(enquiry, index);
    expect(row).not.toHaveProperty("proposed_arrival");
    const read = enquiryFromRow(
      { ...row, proposed_arrival: "2026-12-01", proposed_departure: null } as ArrivalRow,
      index
    );
    expect(read.status).toBe("dates_proposed");
    expect(read.proposedArrival).toBe("2026-12-01");
    expect(read.proposedDeparture).toBe("");
  });
});

describe("the berth holder's calendar from loaded offers", () => {
  const offer = (over: Partial<RelettingRequest>): RelettingRequest => ({
    id: "o",
    userId: "u",
    marinaId: "cascais",
    berthId: "G-14",
    startDate: "2026-11-02",
    endDate: "2026-11-05",
    boatRemovalConfirmed: true,
    reletConsent: true,
    outsideArrangementConfirmed: true,
    termsAcceptedAt: "",
    readinessConfirmedAt: "",
    status: "submitted",
    history: [],
    decisionNote: "",
    conditions: null,
    earlyReturnRequestedAt: null,
    bookedNights: [],
    approvedNights: null,
    resubmitOf: null,
    nightsRelet: null,
    grossEur: null,
    ownerShareEur: null,
    feeEur: null,
    netEur: null,
    createdAt: "",
    ...over,
  });

  it("marks a pending offer as awaiting approval, night by night", () => {
    const { days } = buildBerthCalendar([offer({})], 2026, 10);
    const state = (iso: string) => days.find((d) => d.iso === iso)?.state;
    expect(state("2026-11-01")).toBe("none");
    expect(state("2026-11-02")).toBe("awaiting");
    expect(state("2026-11-04")).toBe("awaiting");
    // The return day is not a night away.
    expect(state("2026-11-05")).toBe("none");
  });

  it("marks approved nights open and booked nights booked, and ignores a cancelled offer", () => {
    const { days } = buildBerthCalendar(
      [
        offer({ status: "booked", bookedNights: ["2026-11-03"] }),
        offer({ id: "c", status: "cancelled", startDate: "2026-11-20", endDate: "2026-11-25" }),
      ],
      2026,
      10
    );
    const state = (iso: string) => days.find((d) => d.iso === iso)?.state;
    expect(state("2026-11-02")).toBe("open");
    expect(state("2026-11-03")).toBe("booked");
    expect(state("2026-11-21")).toBe("none");
  });
});
