import type { Marina } from "../../data/marinas";
import { PROTECTION_LEVELS, PROTECTION_SEGMENTS } from "../../lib/protection";

type Props = {
  protection: Marina["protection"];
  // "compact" is the label and scale only, for cards and the quick facts.
  // "full" adds the one-line reason and the general-guide note.
  size?: "compact" | "full";
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

export default function ProtectionIndicator({
  protection,
  size = "compact",
}: Props) {
  const { label, filled } = PROTECTION_LEVELS[protection.level];
  const spoken = `${label}, ${filled} out of ${PROTECTION_SEGMENTS}`;

  if (size === "compact") {
    return (
      <span className="inline-flex items-center gap-2">
        <Scale filled={filled} />
        <span>{label}</span>
        <span className="sr-only">({spoken})</span>
      </span>
    );
  }

  return (
    <div>
      <p className="flex items-center gap-3 text-lg font-medium text-ink">
        <Scale filled={filled} />
        <span>{label}</span>
        <span className="sr-only">({spoken})</span>
      </p>
      <p className="measure mt-2 text-ink/75">{protection.description}</p>
      <p className="mt-1 text-sm text-ink/70">
        General guide only, not a live forecast.
      </p>
    </div>
  );
}
