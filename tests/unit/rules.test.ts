import { describe, expect, it } from "vitest";
import { isEU, isFreeMovementNational, isSchengen } from "@/lib/countries";
import { getDocumentRequirements } from "@/features/prearrival/lib/documentRules";
import {
  draftSchema,
  getVoyageFlags,
  emptyDraft,
  type PreArrivalDraft,
} from "@/features/prearrival/lib/schema";
import { getExtraErrors, getWarnings } from "@/features/prearrival/lib/warnings";
import { getReadiness } from "@/features/prearrival/lib/readiness";
import { person, validDraft } from "../helpers/drafts";

describe("countries", () => {
  it("Ireland is in the EU and not in Schengen", () => {
    expect(isEU("Ireland")).toBe(true);
    expect(isSchengen("Ireland")).toBe(false);
  });
  it("Norway is in Schengen and not in the EU", () => {
    expect(isSchengen("Norway")).toBe(true);
    expect(isEU("Norway")).toBe(false);
  });
  it("Switzerland has free movement", () => {
    expect(isFreeMovementNational("Switzerland")).toBe(true);
  });
  it("the United Kingdom, Gibraltar, Morocco and Cape Verde are outside Schengen", () => {
    for (const country of ["United Kingdom", "Gibraltar", "Morocco", "Cape Verde"]) {
      expect(isSchengen(country), country).toBe(false);
    }
  });
});

describe("voyage flags", () => {
  const voyage = (last: string, next: string) => ({
    ...validDraft().voyage,
    lastPortCountry: last,
    nextPortCountry: next,
  });

  it("arriving from Gibraltar crosses an external border", () => {
    const flags = getVoyageFlags(voyage("Gibraltar", "Portugal"));
    expect(flags.arrivingFromOutsideSchengen).toBe(true);
    expect(flags.crossesExternalBorder).toBe(true);
  });
  it("Lisbon to Cascais does not", () => {
    const flags = getVoyageFlags(voyage("Portugal", "Portugal"));
    expect(flags.crossesExternalBorder).toBe(false);
    expect(flags.fromOrToNonEU).toBe(false);
  });
  it("leaving for Morocco is a movement to a non-EU country", () => {
    const flags = getVoyageFlags(voyage("Portugal", "Morocco"));
    expect(flags.leavingToOutsideSchengen).toBe(true);
    expect(flags.fromOrToNonEU).toBe(true);
  });
  it("Norway is outside the EU but inside Schengen", () => {
    const flags = getVoyageFlags(voyage("Norway", "Portugal"));
    expect(flags.crossesExternalBorder).toBe(false);
    expect(flags.fromOrToNonEU).toBe(true);
  });
});

function withPeople(...people: PreArrivalDraft["people"]): PreArrivalDraft {
  return validDraft({ people });
}
const warnings = (d: PreArrivalDraft) => getWarnings(d).map((w) => w.message);

describe("warnings", () => {
  it("a valid draft has none", () => {
    expect(warnings(validDraft())).toEqual([]);
  });

  it("warns when a non-EU passport expires 2 months after departure (rule: 3 months)", () => {
    // departure 20 July 2026, passport expires 20 September 2026
    const d = withPeople(
      person({ role: "skipper", nationality: "Brazil", idExpiryDate: "2026-09-20" })
    );
    expect(warnings(d).some((m) => /3 months/.test(m))).toBe(true);
  });

  it("does not warn when the passport has more than 3 months left", () => {
    const d = withPeople(
      person({ role: "skipper", nationality: "Brazil", idExpiryDate: "2026-12-20" })
    );
    expect(warnings(d).some((m) => /3 months/.test(m))).toBe(false);
  });

  it("warns when a non-EU passport was issued 11 years ago (rule: 10 years)", () => {
    const d = withPeople(
      person({ role: "skipper", nationality: "Brazil", idIssueDate: "2015-06-01" })
    );
    expect(warnings(d).some((m) => /10 years/.test(m))).toBe(true);
  });

  it("warns when a non-EU national stays 95 days (rule: 90 in 180)", () => {
    const base = validDraft();
    const d = validDraft({
      people: [person({ role: "skipper", nationality: "Brazil" })],
      voyage: {
        ...base.voyage,
        arrivalDateTime: "2026-07-01T10:00",
        departureDateTime: "2026-10-04T10:00",
      },
    });
    expect(warnings(d).some((m) => /90 days/.test(m))).toBe(true);
  });

  it("does not warn an EU national with the same data", () => {
    const base = validDraft();
    const d = validDraft({
      people: [
        person({
          role: "skipper",
          nationality: "Portugal",
          idExpiryDate: "2026-09-20",
          idIssueDate: "2015-06-01",
        }),
      ],
      voyage: {
        ...base.voyage,
        arrivalDateTime: "2026-07-01T10:00",
        departureDateTime: "2026-10-04T10:00",
      },
    });
    expect(warnings(d)).toEqual([]);
  });

  it("warns about a minor with no guardian, and stops once a guardian is chosen", () => {
    const skipper = person({ role: "skipper" });
    const child = person({ givenNames: "Leo", dateOfBirth: "2015-03-01" });
    expect(warnings(withPeople(skipper, child)).some((m) => /minor/.test(m))).toBe(true);
    const withGuardian = { ...child, guardianPersonIndex: 0 };
    expect(warnings(withPeople(skipper, withGuardian)).some((m) => /minor/.test(m))).toBe(false);
  });

  it("warns about Temporary Admission for a non-EU boat with an EU-resident owner", () => {
    const base = validDraft();
    const d = validDraft({
      boatIdentity: { ...base.boatIdentity, flagCountry: "United Kingdom" },
    });
    expect(warnings(d).some((m) => /Temporary Admission/.test(m))).toBe(true);
  });

  it("does not warn for a non-EU boat whose owner lives outside the EU", () => {
    const base = validDraft();
    const d = validDraft({
      boatIdentity: { ...base.boatIdentity, flagCountry: "United Kingdom" },
      owner: { ...base.owner, countryOfResidence: "United Kingdom", address: "1 High Street" },
    });
    expect(warnings(d).some((m) => /Temporary Admission/.test(m))).toBe(false);
  });
});

describe("insurance (DL 93/2018, art. 33)", () => {
  const insuranceRequired = (d: PreArrivalDraft) =>
    getDocumentRequirements(d).find((r) => r.key === "thirdPartyInsurance")!.required;
  const boat = (zone: 1 | 2 | 3 | 4 | 5 | null, length: string, propulsion: "sail" | "power") => {
    const base = validDraft();
    return validDraft({
      boatIdentity: { ...base.boatIdentity, navigationZoneType: zone },
      boatSpecs: { ...base.boatSpecs, lengthOverall: length, propulsion },
    });
  };

  it("is required in navigation zones 1 to 4", () => {
    for (const zone of [1, 2, 3, 4] as const) {
      expect(insuranceRequired(boat(zone, "6", "sail")), `zone ${zone}`).toBe(true);
    }
  });
  it("is required in zone 5 for a motorised boat", () => {
    expect(insuranceRequired(boat(5, "6", "power"))).toBe(true);
  });
  it("is required in zone 5 for a sailboat over 7 m", () => {
    expect(insuranceRequired(boat(5, "7.5", "sail"))).toBe(true);
  });
  it("is not required in zone 5 for a 6 m sailboat without an engine", () => {
    expect(insuranceRequired(boat(5, "6", "sail"))).toBe(false);
  });
  it("is still asked of a foreign-flagged boat, whatever its size", () => {
    const base = boat(5, "6", "sail");
    const foreign = {
      ...base,
      boatIdentity: { ...base.boatIdentity, flagCountry: "France" },
    };
    expect(insuranceRequired(foreign)).toBe(true);
  });
});

describe("validation", () => {
  const issues = (d: PreArrivalDraft) => {
    const r = draftSchema.safeParse(d);
    return r.success ? [] : r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
  };

  it("accepts a complete draft", () => {
    expect(issues(validDraft())).toEqual([]);
  });

  it("requires exactly one skipper", () => {
    const none = issues(withPeople(person({ role: "crew" })));
    expect(none.some((m) => /Exactly one person must be the skipper/.test(m))).toBe(true);
    const two = issues(withPeople(person({ role: "skipper" }), person({ role: "skipper" })));
    expect(two.some((m) => /Exactly one person must be the skipper/.test(m))).toBe(true);
    expect(issues(withPeople(person({ role: "skipper" })))).toEqual([]);
  });

  it("requires departure after arrival", () => {
    const base = validDraft();
    const d = validDraft({
      voyage: { ...base.voyage, departureDateTime: "2026-07-09T10:00" },
    });
    expect(issues(d)).toContain("voyage.departureDateTime: Departure must be after arrival.");
  });

  it("treats an ID that expires before departure as an error", () => {
    const d = withPeople(person({ role: "skipper", idExpiryDate: "2026-07-15" }));
    expect(
      getExtraErrors(d).some((e) => /expires before the planned departure/.test(e.message))
    ).toBe(true);
  });

  it("treats a missing required document as an error", () => {
    const base = validDraft();
    const documents = {
      ...base.documents,
      registration: { ...base.documents.registration, number: "" },
    };
    const errors = getExtraErrors(validDraft({ documents }));
    expect(errors.some((e) => e.path === "documents.registration")).toBe(true);
  });
});

describe("readiness", () => {
  it("a complete draft scores 5 of 5 with nothing to do", () => {
    const r = getReadiness(validDraft());
    expect(r).toMatchObject({ complete: 5, total: 5, items: [] });
  });

  it("an empty draft scores 0 of 5 for the sections that need input", () => {
    const r = getReadiness(emptyDraft());
    expect(r.total).toBe(5);
    expect(r.complete).toBeLessThan(5);
    expect(r.items.length).toBeGreaterThan(0);
  });

  it("a problem in one section costs exactly one point", () => {
    const base = validDraft();
    const d = validDraft({ voyage: { ...base.voyage, lastPortName: "" } });
    const r = getReadiness(d);
    expect(r.complete).toBe(4);
    expect(r.items.every((i) => i.step === 2)).toBe(true);
  });
});
