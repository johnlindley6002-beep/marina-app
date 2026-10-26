"use client";

import { useMemo } from "react";
import { formatDayMonth, formatLongDate } from "@/lib/dates";
import { formatEuros, formatTime, INTL_LOCALES } from "@/lib/i18n/format";
import { useLanguage } from "./LanguageProvider";

// Dates, times and money in the visitor's language: 6 July 2026 or 6 de julho
// de 2026, 14:30, €12.50 or 12,50 €. Components call this instead of
// formatting by hand, so the language switch reaches every number.
export function useFormat() {
  const { locale } = useLanguage();
  return useMemo(() => {
    const tag = INTL_LOCALES[locale];
    return {
      locale,
      date: (iso: string) => formatLongDate(iso, tag),
      dayMonth: (iso: string) => formatDayMonth(iso, tag),
      time: (date: Date) => formatTime(date, locale),
      money: (euros: number) => formatEuros(euros, locale),
      moneyCompact: (euros: number) =>
        new Intl.NumberFormat(tag, {
          style: "currency",
          currency: "EUR",
          notation: "compact",
          maximumFractionDigits: 1,
        }).format(euros),
      moneyPrecise: (euros: number, digits: number) =>
        new Intl.NumberFormat(tag, {
          style: "currency",
          currency: "EUR",
          minimumFractionDigits: digits,
          maximumFractionDigits: digits,
        }).format(euros),
    };
  }, [locale]);
}
