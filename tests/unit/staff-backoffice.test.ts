import { describe, expect, it } from "vitest";
import { berthFitProblems } from "@/features/staff/lib/berthFit";
import { formatClock, lisbonClockNow, lisbonToIso } from "@/features/staff/lib/format";
import { countExpiries, expiryOf } from "@/features/staff/lib/expiry";
import {
  checklistComplete,
  checklistFor,
  isEuBoat,
  parseMetres,
  validateBoatDetails,
} from "@/features/staff/lib/reception";
import { validRadioChannel, validateRadioEntry } from "@/features/staff/lib/radio";
import { isOverdue, sortTasks, validateTask } from "@/features/staff/lib/tasks";
import { berthRow, cellKind, plannerDates } from "@/features/staff/lib/timeline";

describe("reception checklist", () => {
  it("an EU boat needs the five standard documents", () => {
    expect(checklistFor(true)).toEqual([
      "registration",
      "insurance",
      "skipperLicence",
      "vhfLicence",
      "crewList",
    ]);
  });

  it("a non-EU boat also needs passports, border control and customs", () => {
    expect(checklistFor(false)).toEqual([
      "registration",
      "insurance",
      "skipperLicence",
      "vhfLicence",
      "crewList",
      "passports",
      "borderCheck",
      "customs",
    ]);
  });

  it("the guest's own answer decides, then the flag, then non-EU by default", () => {
    expect(isEuBoat({ euStatus: "no", flagCountry: "Portugal" })).toBe(false);
    expect(isEuBoat({ euStatus: "yes", flagCountry: "United Kingdom" })).toBe(true);
    expect(isEuBoat({ euStatus: "", flagCountry: "France" })).toBe(true);
    expect(isEuBoat({ euStatus: "", flagCountry: "United Kingdom" })).toBe(false);
    expect(isEuBoat({ euStatus: "", flagCountry: "" })).toBe(false);
  });

  it("is complete only when every listed document is ticked", () => {
    const eu = ["registration", "insurance", "skipperLicence", "vhfLicence", "crewList"];
    expect(checklistComplete(true, eu)).toBe(true);
    expect(checklistComplete(false, eu)).toBe(false);
    expect(checklistComplete(true, eu.slice(1))).toBe(false);
  });

  it("checks the corrected boat details", () => {
    expect(parseMetres("9,5")).toBe(9.5);
    expect(parseMetres("")).toBeNull();
    expect(parseMetres("0")).toBe("invalid");
    expect(parseMetres("120")).toBe("invalid");
    expect(validateBoatDetails({ boatName: " ", loa: "9.2", beam: "abc", draft: "" })).toEqual({
      boatName: "required",
      beam: "number",
    });
    expect(
      validateBoatDetails({ boatName: "Kestrel", loa: "9.2", beam: "3.2", draft: "1.6" })
    ).toEqual({});
  });
});

describe("berth fit", () => {
  // A class III berth at Cascais: up to 10 m long, 3.8 m beam, 6 m draft.
  const berth = { maxLengthM: 10, beamM: 3.8, draftM: 6 };

  it("a boat inside every limit fits", () => {
    expect(berthFitProblems({ loa: 9.2, beam: 3.2, draft: 1.6 }, berth)).toEqual([]);
  });

  it("a boat exactly at the limit fits", () => {
    expect(berthFitProblems({ loa: 10, beam: 3.8, draft: 6 }, berth)).toEqual([]);
  });

  it("names each measure that is too big", () => {
    // Sea Otter: 10.5 m long, 3.6 m beam; a 2 m draft against a 1.8 m berth.
    expect(
      berthFitProblems(
        { loa: 10.5, beam: 3.6, draft: 2 },
        { maxLengthM: 10, beamM: 3.8, draftM: 1.8 }
      )
    ).toEqual([
      { measure: "length", boat: 10.5, berth: 10 },
      { measure: "draft", boat: 2, berth: 1.8 },
    ]);
  });

  it("does not check a measure the guest left out", () => {
    expect(
      berthFitProblems({ loa: 9, beam: 0, draft: 0 }, { maxLengthM: 10, beamM: 1, draftM: 1 })
    ).toEqual([]);
  });
});

describe("expiry", () => {
  const today = "2026-10-27";

  it("counts today up to 30 days ahead as expiring soon", () => {
    expect(expiryOf("2026-10-27", today)).toEqual({ state: "soon", days: 0 });
    // 27 October to 26 November is 30 days.
    expect(expiryOf("2026-11-26", today)).toEqual({ state: "soon", days: 30 });
    expect(expiryOf("2026-11-27", today)).toEqual({ state: "valid", days: 31 });
  });

  it("counts the day after the expiry date as expired", () => {
    expect(expiryOf("2026-10-26", today)).toEqual({ state: "expired", days: -1 });
  });

  it("treats a missing date as no expiry", () => {
    expect(expiryOf(null, today)).toEqual({ state: "none" });
  });

  it("counts expired and soon separately", () => {
    expect(countExpiries(["2026-10-01", "2026-11-05", "2027-05-01", null], today)).toEqual({
      expired: 1,
      soon: 1,
    });
  });
});

describe("berth planner", () => {
  it("covers 14 days from the start date", () => {
    const dates = plannerDates("2026-10-27");
    expect(dates).toHaveLength(14);
    expect(dates[0]).toBe("2026-10-27");
    expect(dates[13]).toBe("2026-11-09");
  });

  it("maps each berth status to a planner colour", () => {
    expect(cellKind({ status: "reserved", detail: "", enquiryId: "e1" })).toBe("stay");
    expect(cellKind({ status: "occupied", detail: "", enquiryId: "e1" })).toBe("stay");
    expect(cellKind({ status: "occupied", detail: "", relettingId: "r1" })).toBe("stay");
    expect(cellKind({ status: "occupied", detail: "" })).toBe("holder");
    expect(cellKind({ status: "owner-away", detail: "" })).toBe("holder");
    expect(cellKind({ status: "released", detail: "" })).toBe("relet");
    expect(cellKind({ status: "out-of-service", detail: "" })).toBe("oos");
    expect(cellKind({ status: "free", detail: "" })).toBe("free");
    expect(cellKind(undefined)).toBe("free");
  });

  it("marks where each stay starts", () => {
    const dates = ["2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30"];
    const statuses = {
      "2026-10-27": { "P-2": { status: "reserved" as const, detail: "", enquiryId: "a" } },
      "2026-10-28": { "P-2": { status: "reserved" as const, detail: "", enquiryId: "a" } },
      "2026-10-29": { "P-2": { status: "reserved" as const, detail: "", enquiryId: "b" } },
      "2026-10-30": { "P-2": { status: "free" as const, detail: "" } },
    };
    expect(berthRow("P-2", dates, statuses).map((c) => [c.kind, c.starts])).toEqual([
      ["stay", true],
      ["stay", false],
      ["stay", true],
      ["free", false],
    ]);
  });
});

describe("dock tasks", () => {
  const berths = new Set(["G-14", "P-2"]);

  it("needs a description and a time, and a berth that exists", () => {
    expect(
      validateTask(
        { berthCode: "g-14", description: "Check lines", date: "2026-10-27", time: "09:00" },
        berths
      )
    ).toEqual({});
    expect(
      validateTask({ berthCode: "Z-1", description: " ", date: "", time: "09:00" }, berths)
    ).toEqual({
      berthCode: true,
      description: true,
      when: true,
    });
    expect(
      validateTask({ berthCode: "", description: "Sweep", date: "2026-10-27", time: "9" }, berths)
    ).toEqual({ when: true });
  });

  it("is overdue only while still to do and past its time", () => {
    const now = new Date("2026-10-27T12:00:00Z");
    expect(isOverdue({ status: "to_do", dueAt: "2026-10-27T11:59:00Z" }, now)).toBe(true);
    expect(isOverdue({ status: "to_do", dueAt: "2026-10-27T12:01:00Z" }, now)).toBe(false);
    expect(isOverdue({ status: "done", dueAt: "2026-10-27T08:00:00Z" }, now)).toBe(false);
  });

  it("lists to do soonest first, then done most recent first", () => {
    const sorted = sortTasks([
      {
        id: "d1",
        status: "done" as const,
        dueAt: "2026-10-26T09:00:00Z",
        doneAt: "2026-10-26T10:00:00Z",
      },
      { id: "t2", status: "to_do" as const, dueAt: "2026-10-27T14:00:00Z", doneAt: null },
      {
        id: "d2",
        status: "done" as const,
        dueAt: "2026-10-27T08:00:00Z",
        doneAt: "2026-10-27T08:30:00Z",
      },
      { id: "t1", status: "to_do" as const, dueAt: "2026-10-27T08:00:00Z", doneAt: null },
    ]);
    expect(sorted.map((t) => t.id)).toEqual(["t1", "t2", "d2", "d1"]);
  });
});

describe("Lisbon times", () => {
  it("turns a Lisbon wall-clock time into the right moment, summer and winter", () => {
    // Summer: Lisbon is UTC+1, so 10:00 there is 09:00 UTC.
    expect(lisbonToIso("2026-07-06", "10:00")).toBe("2026-07-06T09:00:00.000Z");
    // Winter: Lisbon is on UTC.
    expect(lisbonToIso("2026-11-02", "10:00")).toBe("2026-11-02T10:00:00.000Z");
    // Just after midnight in summer is still the previous UTC day.
    expect(lisbonToIso("2026-07-06", "00:30")).toBe("2026-07-05T23:30:00.000Z");
  });

  it("reads a moment back on the Lisbon clock", () => {
    expect(formatClock("2026-07-06T09:00:00.000Z", "en-GB")).toBe("10:00");
    expect(lisbonClockNow(new Date("2026-11-02T10:05:00.000Z"))).toBe("10:05");
  });
});

describe("radio log", () => {
  it("accepts VHF channels 1 to 88 only", () => {
    expect(validRadioChannel("9")).toBe(9);
    expect(validRadioChannel("88")).toBe(88);
    expect(validRadioChannel("0")).toBeNull();
    expect(validRadioChannel("89")).toBeNull();
    expect(validRadioChannel("9a")).toBeNull();
  });

  it("needs a time, a boat and a request, and a channel only for VHF", () => {
    const base = {
      time: "09:15",
      boatName: "Blue Heron",
      source: "walk_in" as const,
      channel: "",
      request: "Fuel hours",
    };
    expect(validateRadioEntry(base)).toEqual({});
    expect(validateRadioEntry({ ...base, source: "vhf" })).toEqual({ channel: true });
    expect(validateRadioEntry({ ...base, time: "", boatName: "", request: " " })).toEqual({
      time: true,
      boatName: true,
      request: true,
    });
  });
});
