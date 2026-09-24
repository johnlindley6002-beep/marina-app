"use client";

import type { UnitSystem } from "../../lib/units";
import { useLanguage } from "./LanguageProvider";
import { useUnits } from "./UnitsProvider";

export default function UnitSegmented({ className = "" }: { className?: string }) {
  const { units, setUnits } = useUnits();
  const { t } = useLanguage();

  const options: { value: UnitSystem; label: string }[] = [
    { value: "metric", label: t.units.metric },
    { value: "imperial", label: t.units.imperial },
  ];

  return (
    <div
      role="group"
      aria-label={t.units.label}
      className={`inline-flex rounded-full border border-stone/40 p-0.5 text-sm ${className}`}
    >
      {options.map((option) => {
        const active = units === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => setUnits(option.value)}
            className={`min-h-11 rounded-full px-4 transition-colors md:min-h-9 ${
              active
                ? "bg-brass font-medium text-ink"
                : "text-stone hover:text-paper"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
