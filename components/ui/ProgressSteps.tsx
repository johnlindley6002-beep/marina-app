// The thin step bar and its spoken line above a multi-step flow. The bar is
// decoration; the line ("Step 2 of 6: Voyage") is announced when it changes.
export default function ProgressSteps({
  total,
  current,
  label,
  className = "",
}: {
  total: number;
  current: number;
  label: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="flex items-center gap-2" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={`h-px flex-1 ${i < current ? "bg-ink" : "bg-ink/20"}`} />
        ))}
      </div>
      <p className="mt-3 text-sm text-ink-muted" aria-live="polite">
        {label}
      </p>
    </div>
  );
}
