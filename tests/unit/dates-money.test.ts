import { describe, expect, it } from "vitest";
import {
  addDaysIso,
  ageOn,
  countNights,
  daysBetween,
  isValidIsoDate,
  nightDates,
  todayIso,
} from "@/lib/dates";
import { plural } from "@/lib/i18n/format";
import { percentOfCents, toCents, vatOnCents } from "@/lib/money";

describe("dates", () => {
  it("rejects a day that does not exist instead of rolling it over", () => {
    expect(isValidIsoDate("2026-02-31")).toBe(false);
    expect(isValidIsoDate("2026-02-28")).toBe(true);
    expect(isValidIsoDate("2028-02-29")).toBe(true);
    expect(isValidIsoDate("2027-02-29")).toBe(false);
  });
  it("counts nights across a clock change without drifting", () => {
    // 28 March 2026 to 1 April 2026 spans the European clock change
    expect(countNights("2026-03-28", "2026-04-01")).toBe(4);
    expect(daysBetween("2026-10-24", "2026-10-26")).toBe(2);
  });
  it("lists the nights of a stay, not the day of departure", () => {
    expect(nightDates("2026-12-30", "2027-01-02")).toEqual([
      "2026-12-30",
      "2026-12-31",
      "2027-01-01",
    ]);
  });
  it("adds days across a month and a year", () => {
    expect(addDaysIso("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDaysIso("2028-02-28", 1)).toBe("2028-02-29");
  });
  it("works out age on a given day", () => {
    expect(ageOn("2008-07-21", "2026-07-20")).toBe(17);
    expect(ageOn("2008-07-20", "2026-07-20")).toBe(18);
  });
  it("takes today from the Lisbon calendar, not the device", () => {
    // 23:30 UTC on 30 June is already 00:30 on 1 July in Lisbon (UTC+1 in summer)
    expect(todayIso(new Date("2026-06-30T23:30:00Z"))).toBe("2026-07-01");
    expect(todayIso(new Date("2026-01-15T23:30:00Z"))).toBe("2026-01-15");
  });
});

describe("money", () => {
  it("converts to whole cents", () => {
    expect(toCents(21.5)).toBe(2150);
    expect(toCents(0.1 + 0.2)).toBe(30);
  });
  it("rounds VAT half up, once", () => {
    expect(vatOnCents(6450, 0.23)).toBe(1484); // 14.835 -> 14.84
    expect(vatOnCents(9450, 0.23)).toBe(2174); // 21.735 -> 21.74
  });
  it("takes a percentage in basis points", () => {
    expect(percentOfCents(7340, 5000)).toBe(3670);
  });
});

describe("plurals follow the language", () => {
  const nights = { one: "night", other: "nights" };
  it("English and Portuguese: only 1 is singular", () => {
    expect(plural("en", 1, nights)).toBe("night");
    expect(plural("en", 0, nights)).toBe("nights");
    expect(plural("pt", 0, { one: "noite", other: "noites" })).toBe("noites");
  });
  it("French counts 0 as singular, as French does", () => {
    expect(plural("fr", 0, { one: "nuit", other: "nuits" })).toBe("nuit");
    expect(plural("fr", 2, { one: "nuit", other: "nuits" })).toBe("nuits");
  });
});
