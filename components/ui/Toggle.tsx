"use client";

// An on/off switch. The visible label lives elsewhere on the page, so it is
// tied in with labelledBy. The hit area is 44 px tall.
export default function Toggle({
  checked,
  onChange,
  labelledBy,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  labelledBy: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      onClick={() => onChange(!checked)}
      className="flex h-11 w-14 shrink-0 items-center"
    >
      <span
        aria-hidden="true"
        className={`relative block h-8 w-14 rounded-full border transition-colors duration-(--duration-base) motion-reduce:transition-none ${
          checked ? "border-ink bg-ink" : "border-ink/40 bg-paper-deep"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full transition-transform duration-(--duration-base) motion-reduce:transition-none ${
            checked ? "translate-x-6 bg-paper" : "bg-surface"
          }`}
        />
      </span>
    </button>
  );
}
