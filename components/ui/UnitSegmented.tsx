"use client";

import type { UnitSystem } from "@/lib/units";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useUnits } from "@/components/providers/UnitsProvider";
import SegmentedControl from "./SegmentedControl";

// Metric or imperial, for the whole app.
export default function UnitSegmented({
  className = "",
  tone = "dark",
}: {
  className?: string;
  tone?: "dark" | "light";
}) {
  const { units, setUnits } = useUnits();
  const { t } = useLanguage();

  const options: { value: UnitSystem; label: string }[] = [
    { value: "metric", label: t.units.metric },
    { value: "imperial", label: t.units.imperial },
  ];

  return (
    <SegmentedControl
      label={t.units.label}
      options={options}
      value={units}
      onChange={setUnits}
      className={className}
      tone={tone}
    />
  );
}
