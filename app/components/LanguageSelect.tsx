"use client";

import { LOCALE_NAMES, LOCALES, type Locale } from "../../lib/i18n";
import { useLanguage } from "./LanguageProvider";

// A native select keeps this accessible and comfortable on phones.
export default function LanguageSelect({ className = "" }: { className?: string }) {
  const { locale, setLocale, t } = useLanguage();
  return (
    <label className={`relative inline-flex items-center ${className}`}>
      <span className="sr-only">{t.language.label}</span>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className="appearance-none rounded-full border border-stone/40 bg-transparent py-1.5 pr-9 pl-4 text-sm text-paper hover:border-stone/80 [&>option]:text-ink"
      >
        {LOCALES.map((code) => (
          <option key={code} value={code} lang={code}>
            {LOCALE_NAMES[code]}
          </option>
        ))}
      </select>
      <svg
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="pointer-events-none absolute right-3 h-4 w-4 text-stone"
        aria-hidden="true"
      >
        <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </label>
  );
}
