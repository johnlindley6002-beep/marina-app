import type { Locale } from "./types";

// The BCP 47 tag each language is formatted with. European Portuguese, not
// Brazilian: pt-PT decides the decimal comma, the euro position and month names.
export const INTL_LOCALES: Record<Locale, string> = {
  en: "en-GB",
  pt: "pt-PT",
  es: "es-ES",
  fr: "fr-FR",
};

// "1 night", "2 nights": the plural form comes from the language's own rules
// (French counts 0 as singular, Portuguese and English do not).
export function plural(locale: Locale, n: number, forms: { one: string; other: string }): string {
  return new Intl.PluralRules(INTL_LOCALES[locale]).select(n) === "one" ? forms.one : forms.other;
}

// 24-hour clock, per language.
export function formatTime(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(INTL_LOCALES[locale], {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

// An amount held in euros, with the currency symbol and separators of the
// language: €12.50, 12,50 €.
export function formatEuros(amount: number, locale: Locale): string {
  return new Intl.NumberFormat(INTL_LOCALES[locale], { style: "currency", currency: "EUR" }).format(
    amount
  );
}
