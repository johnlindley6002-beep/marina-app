import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { marinas, type CreditModel, type RelettingTerms } from "@/data/marinas";
import { nightsOfferedToVisitors, visitorStayFits } from "@/features/owner/lib/relet";
import { getOwnedBerths, submitRelettingRequest } from "@/lib/data";
import { computeSplitForNights, creditBeforeFee } from "@/data/mock/reletting";

const terms = (creditModel: CreditModel): RelettingTerms => ({
  ...marinas[0]!.reletting!,
  creditModel,
});

describe("credit models", () => {
  it("a percentage model is that share of the berth income", () => {
    // 50% of 73.40 EUR (7340 cents) is 36.70 EUR
    expect(creditBeforeFee(terms({ kind: "percentage", sharePercent: 50 }), 7340, 4)).toBe(3670);
  });
  it("a fixed per-night model ignores the berth income", () => {
    // 20.00 EUR x 3 nights = 60.00 EUR, however much the nights are worth
    expect(creditBeforeFee(terms({ kind: "fixed_per_night", amountEur: 20 }), 99_999, 3)).toBe(
      6000
    );
  });
});

describe("the split for relet nights at Marina de Cascais", () => {
  const berth = getOwnedBerths("u-owner")[0]!;

  it("belongs to a class II berth", () => {
    expect(berth.sizeClass).toBe("II");
  });

  it("four February nights: 4 x 18.35, half as credit, 10% fee", () => {
    const split = computeSplitForNights("cascais", berth.berthId, [
      "2027-02-01",
      "2027-02-02",
      "2027-02-03",
      "2027-02-04",
    ])!;
    // gross 73.40; 50% = 36.70; fee 10% of 36.70 = 3.67; net 33.03
    expect(split).toEqual({
      nights: 4,
      grossEur: 73.4,
      ownerShareEur: 36.7,
      feeEur: 3.67,
      netEur: 33.03,
    });
  });

  it("a July night uses the high-season rate and rounds the fee half up", () => {
    const split = computeSplitForNights("cascais", berth.berthId, ["2027-07-10"])!;
    // gross 30.30; 50% = 15.15; fee 1.515 rounds to 1.52; net 13.63
    expect(split).toMatchObject({
      grossEur: 30.3,
      ownerShareEur: 15.15,
      feeEur: 1.52,
      netEur: 13.63,
    });
  });

  it("gives nothing for no nights", () => {
    expect(computeSplitForNights("cascais", berth.berthId, [])).toBeNull();
  });
});

describe("the return buffer", () => {
  it("keeps the last nights before the holder returns clear", () => {
    // away 10 to 20 July = 10 nights (10..19); with a 2 day buffer, 18 and 19 stay clear
    const offered = nightsOfferedToVisitors("2027-07-10", "2027-07-20", 2);
    expect(offered).toHaveLength(8);
    expect(offered[0]).toBe("2027-07-10");
    expect(offered.at(-1)).toBe("2027-07-17");
  });

  it("offers every night when there is no buffer, and none when the buffer covers the absence", () => {
    expect(nightsOfferedToVisitors("2027-07-10", "2027-07-13", 0)).toHaveLength(3);
    expect(nightsOfferedToVisitors("2027-07-10", "2027-07-12", 5)).toEqual([]);
  });

  const absence = { startDate: "2027-07-10", endDate: "2027-07-20" };
  it("a visitor must leave before the buffer starts", () => {
    // leaves on the 18th: last night is the 17th, which is offered
    expect(visitorStayFits(absence, { arrival: "2027-07-12", departure: "2027-07-18" }, 2)).toBe(
      true
    );
    // leaves on the 19th: sleeps on the 18th, inside the buffer
    expect(visitorStayFits(absence, { arrival: "2027-07-12", departure: "2027-07-19" }, 2)).toBe(
      false
    );
    // arrives before the holder leaves
    expect(visitorStayFits(absence, { arrival: "2027-07-09", departure: "2027-07-12" }, 2)).toBe(
      false
    );
  });

  it("Cascais keeps two days", () => {
    expect(marinas.find((m) => m.id === "cascais")?.reletting?.returnBufferDays).toBe(2);
  });
});

describe("reletting switched off", () => {
  const original = marinas[0]!.reletting!.reletAllowed;
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-01T12:00:00Z"));
    window.localStorage.clear();
  });
  afterEach(() => {
    marinas[0]!.reletting!.reletAllowed = original;
    vi.useRealTimers();
  });

  const input = (berthId: string) => ({
    berthId,
    startDate: "2026-12-01",
    endDate: "2026-12-08",
    boatRemovalConfirmed: true,
    reletConsent: true,
    outsideArrangementConfirmed: true,
    termsAccepted: true,
    readinessConfirmed: true,
  });

  it("accepts a request when the marina mediates reletting", () => {
    const berth = getOwnedBerths("u-owner")[0]!;
    const result = submitRelettingRequest("u-owner", input(berth.berthId));
    expect(result.ok).toBe(true);
  });

  it("refuses every request when reletAllowed is none", () => {
    marinas[0]!.reletting!.reletAllowed = "none";
    const berth = getOwnedBerths("u-owner")[0]!;
    const result = submitRelettingRequest("u-owner", input(berth.berthId));
    expect(result).toEqual({
      ok: false,
      error: "This marina does not offer a marina-mediated relet.",
    });
  });

  it("refuses someone who does not hold the berth", () => {
    const berth = getOwnedBerths("u-owner")[0]!;
    const result = submitRelettingRequest("u-voyager", input(berth.berthId));
    expect(result.ok).toBe(false);
  });

  it("refuses a return date that is not after the departure", () => {
    const berth = getOwnedBerths("u-owner")[0]!;
    const result = submitRelettingRequest("u-owner", {
      ...input(berth.berthId),
      endDate: "2026-12-01",
    });
    expect(result.ok).toBe(false);
  });
});
