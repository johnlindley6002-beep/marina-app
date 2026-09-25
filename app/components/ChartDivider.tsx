// The nautical chart's scale bar, used as a quiet divider between discovery
// sections: a hairline with small ticks, a longer one every fifth. It is the
// brand's fingerprint, so it stays low contrast and never carries meaning.
export default function ChartDivider({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="100%"
      height="9"
      className={`block text-ink/30 ${className}`}
    >
      <defs>
        <pattern id="chart-minor" width="24" height="9" patternUnits="userSpaceOnUse">
          <path d="M0.5 3v3" stroke="currentColor" strokeWidth="1" fill="none" />
        </pattern>
        <pattern id="chart-major" width="120" height="9" patternUnits="userSpaceOnUse">
          <path d="M0.5 0v9" stroke="currentColor" strokeWidth="1" fill="none" />
        </pattern>
      </defs>
      <path d="M0 4.5H100000" stroke="currentColor" strokeWidth="1" fill="none" />
      <rect width="100%" height="9" fill="url(#chart-minor)" />
      <rect width="100%" height="9" fill="url(#chart-major)" />
    </svg>
  );
}
