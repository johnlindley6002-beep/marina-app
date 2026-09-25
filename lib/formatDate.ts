const LONG = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

// "2026-07-06" as "6 July 2026". A full timestamp is shown as the reader's
// local date. Falls back to the input when it is not a date.
export function formatLongDate(iso: string): string {
  let date: Date;
  if (iso.includes("T")) {
    date = new Date(iso);
  } else {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
    if (!m) return iso;
    date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  return Number.isNaN(date.getTime()) ? iso : LONG.format(date);
}

export const eur = (amount: number) => `€${amount.toFixed(2)}`;
