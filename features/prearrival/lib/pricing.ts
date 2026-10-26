// Indicative pricing for the pre-arrival wizard's Step 5 (Your stay), reusing
// the marina's real tariff (data/marinas.ts) rather than a second price list.
// The 2026 Cascais figures live in CLASS_LENGTH_RANGES, CLASS_BEAM_RANGES and
// TRANSIENT_RATES; this file only adds the two rules that data does not
// encode: the class is the LARGER of the length class and the beam class, and
// a multihull pays double. Totals are added up in whole cents (lib/money).
//
// Always shown as "indicative, confirmed by the marina" (see Step 5), and
// never used to block anything: a boat outside every class still gets an
// honest "ask the marina for a quote" instead of a wrong number.

import {
  classifyBoat,
  nightsBySeason,
  type Marina,
  type MarinaClass,
  type Season,
} from "@/data/marinas";
import { fromCents, toCents, vatOnCents } from "@/lib/money";

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

// Sums each night at its own season's rate (a stay spanning Sep/Oct is priced
// correctly), then applies the multihull surcharge and VAT.
export function calculateIndicativeQuote(
  marina: Marina,
  input: {
    lengthM: number;
    beamM: number;
    isMultihull: boolean;
    arrival: string;
    departure: string;
  }
): IndicativeQuote | null {
  const marinaClass = classifyBoat(input.lengthM, input.beamM);
  const stayNights = nightsBySeason(input.arrival, input.departure);
  const nights = stayNights.low + stayNights.high;
  if (!marinaClass || nights < 1) return null;

  // Everything is added up in whole cents; VAT is rounded once, at the end.
  const multiplier = input.isMultihull ? 2 : 1;
  const lines: NightlyBreakdownLine[] = (["low", "high"] as Season[])
    .filter((season) => stayNights[season] > 0)
    .map((season) => {
      const rateCents = toCents(marina.transientRates[marinaClass][season]) * multiplier;
      const lineNights = stayNights[season];
      return {
        season,
        nights: lineNights,
        rateEur: fromCents(rateCents),
        subtotalEur: fromCents(rateCents * lineNights),
      };
    });

  const subtotalCents = lines.reduce((s, l) => s + toCents(l.subtotalEur), 0);
  const vatCents = vatOnCents(subtotalCents, marina.vatRate);

  return {
    marinaClass,
    nights,
    multihull: input.isMultihull,
    lines,
    subtotalExVatEur: fromCents(subtotalCents),
    vatEur: fromCents(vatCents),
    totalIncVatEur: fromCents(subtotalCents + vatCents),
  };
}
