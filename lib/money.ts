// Money is whole euro cents (integers) everywhere it is added up. A float
// such as 64.5 * 0.23 = 14.834999999999999 would round the wrong way at the
// last step; integer cents with VAT in basis points never does.

export type Cents = number;

// 18.35 euros to 1835 cents. Only for the two-decimal prices in the tariff.
export function toCents(euros: number): Cents {
  return Math.round(euros * 100);
}

export function fromCents(cents: Cents): number {
  return cents / 100;
}

// 0.23 to 2300 basis points.
export function toBasisPoints(rate: number): number {
  return Math.round(rate * 10_000);
}

// A percentage of an amount in cents, rounded half up to the cent, once.
export function percentOfCents(cents: Cents, basisPoints: number): Cents {
  return Math.round((cents * basisPoints) / 10_000);
}

// VAT on a net amount, rounded half up to the cent, once.
export function vatOnCents(netCents: Cents, vatRate: number): Cents {
  return percentOfCents(netCents, toBasisPoints(vatRate));
}

export function formatEur(cents: Cents, locale = "en-GB"): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(
    fromCents(cents)
  );
}

// Plain "€12.34" for places that show an amount held as euros.
export const eur = (amount: number) => `€${amount.toFixed(2)}`;
