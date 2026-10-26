"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { INTL_LOCALES } from "@/lib/i18n/format";

type Props = {
  // ISO date (YYYY-MM-DD) the value was last confirmed. Renders nothing
  // without one, so a value with no date never claims to be current.
  date: string | null | undefined;
  className?: string;
};

// A small, unobtrusive "Updated <date>" line for any marina-maintained value
// (fuel prices first; hours and service prices can use it later).
export default function LastUpdated({ date, className = "" }: Props) {
  const { locale, t } = useLanguage();
  if (!date) return null;
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  const text = new Intl.DateTimeFormat(INTL_LOCALES[locale], {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);

  return (
    <span className={`text-xs text-ink-muted ${className}`}>
      {t.marinaPage.fuel.updated} <time dateTime={date}>{text}</time>
    </span>
  );
}
