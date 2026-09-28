"use client";

import { useLanguage } from "./LanguageProvider";

const INTL_LOCALES = { en: "en-GB", pt: "pt-PT", es: "es-ES", fr: "fr-FR" } as const;

type Props = {
  // ISO date (YYYY-MM-DD) the value was last confirmed. Renders nothing
  // without one, so a value with no date never claims to be current.
  date: string | null | undefined;
  className?: string;
};

// A small, unobtrusive "Updated <date>" line for any marina-maintained value
// (fuel prices first; hours and service prices can use it later).
export default function LastUpdated({ date, className = "" }: Props) {
  const { locale } = useLanguage();
  if (!date) return null;
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  const text = new Intl.DateTimeFormat(INTL_LOCALES[locale] ?? "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);

  return (
    <span className={`text-xs text-ink/70 ${className}`}>
      Updated <time dateTime={date}>{text}</time>
    </span>
  );
}
