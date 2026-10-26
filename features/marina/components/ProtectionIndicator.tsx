"use client";

import type { Marina } from "@/data/marinas";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { PROTECTION_FILLED, PROTECTION_SEGMENTS } from "@/features/marina/lib/protection";

type Props = {
  protection: Marina["protection"];
};

function Scale({ filled }: { filled: number }) {
  return (
    <span className="flex shrink-0 items-center gap-1" aria-hidden="true">
      {Array.from({ length: PROTECTION_SEGMENTS }, (_, i) => (
        <span
          key={i}
          className={`h-2 w-5 rounded-sm ${i < filled ? "bg-ink" : "border border-ink/40"}`}
        />
      ))}
    </span>
  );
}

// The label and scale: for cards, the quick facts and the practical info.
export default function ProtectionIndicator({ protection }: Props) {
  const { t } = useLanguage();
  const label = t.marinaPage.facts.levels[protection.level];
  const filled = PROTECTION_FILLED[protection.level];
  const spoken = t.marinaPage.approach.protectionSpoken(label, filled, PROTECTION_SEGMENTS);

  return (
    <span className="inline-flex items-center gap-2">
      <Scale filled={filled} />
      <span>{label}</span>
      <span className="sr-only">({spoken})</span>
    </span>
  );
}

// The one-line reason behind the rating. It stays visible wherever the rating
// is shown in full, because it is the safety point.
export function ProtectionWhy({ protection }: Props) {
  const { t } = useLanguage();
  return (
    <p className="measure text-ink-soft">
      {protection.description}{" "}
      <span className="text-sm text-ink-muted">{t.marinaPage.approach.protectionNote}</span>
    </p>
  );
}
