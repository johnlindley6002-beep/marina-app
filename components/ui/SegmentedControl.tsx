"use client";

// One choice out of a few, shown as a pill group (units, guest or berth holder
// mode). "dark" sits on the ink navbar, "light" on paper, and "pill" is the
// floating pill: ink with a paper outline, 44 px tall like the dev pill. Each
// option is a toggle button with aria-pressed.
export default function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  className = "",
  tone = "dark",
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  tone?: "dark" | "light" | "pill";
}) {
  const pill = tone === "pill";
  return (
    <div
      role="group"
      aria-label={label}
      className={`inline-flex rounded-full text-sm ${
        pill
          ? "h-11 items-stretch bg-ink shadow-overlay ring-1 ring-paper/30"
          : `border p-0.5 ${tone === "light" ? "border-ink/30" : "border-stone/40"}`
      } ${className}`}
    >
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`rounded-full px-4 transition-colors ${
              pill ? "h-full" : "min-h-11 md:min-h-9"
            } ${
              active
                ? tone === "light"
                  ? "bg-ink font-medium text-paper"
                  : "bg-paper font-medium text-ink"
                : tone === "light"
                  ? "text-ink-soft hover:text-ink"
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
