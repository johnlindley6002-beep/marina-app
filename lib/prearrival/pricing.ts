// Indicative pricing for the pre-arrival wizard's Step 5 (Your stay), reusing
// the marina's real tariff (data/marinas.ts) rather than a second price list.
// The task brief's 2026 Cascais figures are exactly what is already in
// CLASS_LENGTH_RANGES / CLASS_BEAM_RANGES / TRANSIENT_RATES, so there is
// nothing to duplicate; this file only adds the two rules that data does not
// already encode: the class is the LARGER of the length class and the beam
// class, and a multihull pays double.
//
// Always shown as "indicative, confirmed by the marina" (see Step 5), and
// never used to block anything: a boat outside every class still gets an
// honest "ask the marina for a quote" instead of a wrong number.

import {
  CLASS_BEAM_RANGES,
  CLASS_LENGTH_RANGES,
  MARINA_CLASS_ORDER,
  getSeason,
  type Marina,
  type MarinaClass,
  type Season,
} from "../../data/marinas";

function classifyByLength(lengthM: number): MarinaClass | null {
  for (const c of MARINA_CLASS_ORDER) {
    if (lengthM <= CLASS_LENGTH_RANGES[c].maxM) return c;
  }
  return null;
}

function classifyByBeam(beamM: number): MarinaClass | null {
  for (const c of MARINA_CLASS_ORDER) {
    if (beamM <= CLASS_BEAM_RANGES[c]) return c;
  }
  return null;
}

// The larger of the two classes applies, since a wide, short boat still needs
// a wide berth and vice versa.
export function classifyByLengthAndBeam(
  lengthM: number,
  beamM: number
): MarinaClass | null {
  const byLength = classifyByLength(lengthM);
  const byBeam = classifyByBeam(beamM);
  if (!byLength || !byBeam) return byLength ?? byBeam ?? null;
  const li = MARINA_CLASS_ORDER.indexOf(byLength);
  const bi = MARINA_CLASS_ORDER.indexOf(byBeam);
  return MARINA_CLASS_ORDER[Math.max(li, bi)];
}

export type NightlyBreakdownLine = {
  season: Season;
  nights: number;
  rateEur: number;
  subtotalEur: number;
};

export type IndicativeQuote = {
  marinaClass: MarinaClass;
  nights: number;
  multihull: boolean;
  lines: NightlyBreakdownLine[];
  subtotalExVatEur: number;
  vatEur: number;
  totalIncVatEur: number;
};

function parseIsoDate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

// Sums each night at its own season's rate (a stay spanning Sep/Oct is priced
// correctly), then applies the multihull surcharge and VAT.
export function calculateIndicativeQuote(
  marina: Marina,
  input: { lengthM: number; beamM: number; isMultihull: boolean; arrival: string; departure: string }
): IndicativeQuote | null {
  const marinaClass = classifyByLengthAndBeam(input.lengthM, input.beamM);
  const arrival = parseIsoDate(input.arrival);
  const departure = parseIsoDate(input.departure);
  if (!marinaClass || !arrival || !departure || departure <= arrival) return null;

  const nightsBySeason: Record<Season, number> = { low: 0, high: 0 };
  const cursor = new Date(arrival);
  while (cursor < departure) {
    nightsBySeason[getSeason(cursor)] += 1;
    cursor.setDate(cursor.getDate() + 1);
  }

  const multiplier = input.isMultihull ? 2 : 1;
  const lines: NightlyBreakdownLine[] = (["low", "high"] as Season[])
    .filter((season) => nightsBySeason[season] > 0)
    .map((season) => {
      const rateEur = marina.transientRates[marinaClass][season] * multiplier;
      const nights = nightsBySeason[season];
      return { season, nights, rateEur, subtotalEur: rateEur * nights };
    });

  const nights = nightsBySeason.low + nightsBySeason.high;
  const subtotalExVatEur = lines.reduce((s, l) => s + l.subtotalEur, 0);
  const vatEur = subtotalExVatEur * marina.vatRate;

  return {
    marinaClass,
    nights,
    multihull: input.isMultihull,
    lines,
    subtotalExVatEur,
    vatEur,
    totalIncVatEur: subtotalExVatEur + vatEur,
  };
}
