import type { Marina } from "../../data/marinas";
import { PROTECTION_LEVELS, PROTECTION_SEGMENTS } from "../../lib/protection";

type Props = {
  protection: Marina["protection"];
};

function Scale({ filled }: { filled: number }) {
  return (
    <span className="flex shrink-0 items-center gap-1" aria-hidden="true">
      {Array.from({ length: PROTECTION_SEGMENTS }, (_, i) => (
        <span
          key={i}
          className={`h-2 w-5 rounded-[1px] ${
            i < filled ? "bg-ink" : "border border-ink/40"
          }`}
        />
      ))}
    </span>
  );
}

// The label and scale: for cards, the quick facts and the practical info.
export default function ProtectionIndicator({ protection }: Props) {
  const { label, filled } = PROTECTION_LEVELS[protection.level];
  const spoken = `${label}, ${filled} out of ${PROTECTION_SEGMENTS}`;

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
  return (
    <p className="measure text-ink/75">
      {protection.description}{" "}
      <span className="text-sm text-ink/70">General guide, not a forecast.</span>
    </p>
  );
}
