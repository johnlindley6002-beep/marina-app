import { describe, expect, it } from "vitest";
import { calculateQuote, classifyBoat, marinas } from "@/data/marinas";
import { calculateIndicativeQuote } from "@/features/prearrival/lib/pricing";

const cascais = marinas.find((m) => m.id === "cascais")!;

// The Cascais 2026 tariff, typed out by hand from the published table (prices
// exclude VAT). Class, longest length (m), widest beam (m), low and high season
// price per night.
const TARIFF: [string, number, number, number, number][] = [
  ["I", 6.15, 2.4, 12.6, 19.5],
  ["IA", 6.5, 2.5, 13.0, 22.0],
  ["II", 8.0, 3.2, 18.35, 30.3],
  ["III", 10.0, 3.8, 21.5, 36.95],
  ["IV", 12.0, 4.4, 31.5, 49.65],
  ["V", 15.0, 5.0, 46.9, 71.7],
  ["VI", 18.0, 5.5, 54.0, 96.6],
  ["VIA", 20.0, 6.0, 60.6, 115.8],
  ["VII", 25.0, 6.5, 66.15, 146.15],
  ["VIII", 36.0, 7.2, 90.95, 198.45],
  ["IX", 45.0, 10.0, 115.75, 253.55],
];

describe("Cascais 2026 tariff", () => {
  it.each(TARIFF)("class %s: limits and rates", (cls, maxLength, maxBeam, low, high) => {
    // exactly at the limit is in the class
    expect(classifyBoat(maxLength, maxBeam)).toBe(cls);
    expect(cascais.transientRates[cls as keyof typeof cascais.transientRates]).toEqual({
      low,
      high,
    });
  });

  it("puts 6.15 m in class I and 6.16 m in class IA", () => {
    expect(classifyBoat(6.15, 2.0)).toBe("I");
    expect(classifyBoat(6.16, 2.0)).toBe("IA");
  });

  it("puts a beam of 2.40 m in class I and 2.41 m in class IA", () => {
    expect(classifyBoat(5.0, 2.4)).toBe("I");
    expect(classifyBoat(5.0, 2.41)).toBe("IA");
  });

  it("uses the larger of the length class and the beam class", () => {
    // 9.5 m is class III by length. A 4.2 m beam is class IV (3.80 < 4.2 <= 4.40).
    expect(classifyBoat(9.5, 3.5)).toBe("III");
    expect(classifyBoat(9.5, 4.2)).toBe("IV");
    // A narrow boat does not drop below its length class.
    expect(classifyBoat(13.0, 2.0)).toBe("V");
  });

  it("has no class for a boat longer than 45 m or wider than 10 m", () => {
    expect(classifyBoat(45.01, 5)).toBeNull();
    expect(classifyBoat(20, 10.01)).toBeNull();
  });
});

const stay = (arrival: string, departure: string) => ({ arrival, departure });

describe("the pre-arrival quote", () => {
  it("prices a 9.5 x 3.5 m monohull for 3 nights in February (class III)", () => {
    const q = calculateIndicativeQuote(cascais, {
      lengthM: 9.5,
      beamM: 3.5,
      isMultihull: false,
      ...stay("2026-02-10", "2026-02-13"),
    })!;
    expect(q.marinaClass).toBe("III");
    expect(q.nights).toBe(3);
    // 3 x 21.50 = 64.50; VAT 23% = 14.835, rounded half up to 14.84; total 79.34
    expect(q.subtotalExVatEur).toBe(64.5);
    expect(q.vatEur).toBe(14.84);
    expect(q.totalIncVatEur).toBe(79.34);
  });

  it("moves a 9.5 m boat with a 4.2 m beam up to class IV", () => {
    const q = calculateIndicativeQuote(cascais, {
      lengthM: 9.5,
      beamM: 4.2,
      isMultihull: false,
      ...stay("2026-02-10", "2026-02-13"),
    })!;
    expect(q.marinaClass).toBe("IV");
    // 3 x 31.50 = 94.50; VAT 21.735 -> 21.74; total 116.24
    expect(q.subtotalExVatEur).toBe(94.5);
    expect(q.vatEur).toBe(21.74);
    expect(q.totalIncVatEur).toBe(116.24);
  });

  it("splits nights across seasons: 3 low-season nights then 2 high-season nights", () => {
    // Nights of 29, 30, 31 March (low) and 1, 2 April (high). High season starts 1 April.
    const q = calculateIndicativeQuote(cascais, {
      lengthM: 9.5,
      beamM: 3.5,
      isMultihull: false,
      ...stay("2026-03-29", "2026-04-03"),
    })!;
    expect(q.nights).toBe(5);
    expect(q.lines).toEqual([
      { season: "low", nights: 3, rateEur: 21.5, subtotalEur: 64.5 },
      { season: "high", nights: 2, rateEur: 36.95, subtotalEur: 73.9 },
    ]);
    // 64.50 + 73.90 = 138.40; VAT 31.832 -> 31.83; total 170.23
    expect(q.subtotalExVatEur).toBe(138.4);
    expect(q.vatEur).toBe(31.83);
    expect(q.totalIncVatEur).toBe(170.23);
  });

  it("treats the last night of September as high season and 1 October as low", () => {
    const q = calculateIndicativeQuote(cascais, {
      lengthM: 9.5,
      beamM: 3.5,
      isMultihull: false,
      ...stay("2026-09-30", "2026-10-02"),
    })!;
    expect(q.lines.map((l) => [l.season, l.nights])).toEqual([
      ["low", 1],
      ["high", 1],
    ]);
  });

  it("charges a multihull double the nightly rate", () => {
    const q = calculateIndicativeQuote(cascais, {
      lengthM: 9.5,
      beamM: 3.5,
      isMultihull: true,
      ...stay("2026-02-10", "2026-02-13"),
    })!;
    // 3 x 43.00 = 129.00; VAT 29.67; total 158.67
    expect(q.subtotalExVatEur).toBe(129);
    expect(q.vatEur).toBe(29.67);
    expect(q.totalIncVatEur).toBe(158.67);
  });

  it("gives no quote for a boat outside every class or for zero nights", () => {
    expect(
      calculateIndicativeQuote(cascais, {
        lengthM: 50,
        beamM: 8,
        isMultihull: false,
        ...stay("2026-02-10", "2026-02-13"),
      })
    ).toBeNull();
    expect(
      calculateIndicativeQuote(cascais, {
        lengthM: 9.5,
        beamM: 3.5,
        isMultihull: false,
        ...stay("2026-02-10", "2026-02-10"),
      })
    ).toBeNull();
  });
});

describe("the marina page estimate agrees with the pre-arrival quote", () => {
  const none = { shorePower: false, water: false, pumpOut: false, fuel: false, laundry: false };

  it("uses the same class and berth subtotal for length and beam", () => {
    const q = calculateQuote(
      cascais,
      { loa: 9.5, beam: 4.2, ...stay("2026-02-10", "2026-02-13") },
      none
    )!;
    expect(q.marinaClass).toBe("IV");
    expect(q.berthSubtotalEur).toBe(94.5);
    expect(q.estimatedTotalEur).toBe(94.5);
  });

  it("doubles the rate for a multihull", () => {
    const q = calculateQuote(
      cascais,
      { loa: 9.5, beam: 3.5, multihull: true, ...stay("2026-02-10", "2026-02-13") },
      none
    )!;
    expect(q.berthSubtotalEur).toBe(129);
  });

  it("adds the pump-out fee to the total", () => {
    const q = calculateQuote(
      cascais,
      { loa: 9.5, ...stay("2026-02-10", "2026-02-13") },
      { ...none, pumpOut: true }
    )!;
    expect(q.addOnLines).toEqual([{ kind: "pumpOut", amountEur: 25 }]);
    expect(q.estimatedTotalEur).toBe(89.5);
  });
});
