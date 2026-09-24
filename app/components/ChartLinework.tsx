// Decorative chart linework: a graticule with soft depth-contour arcs.
// Purely ornamental, so it is hidden from assistive tech.
export default function ChartLinework({ className = "" }: { className?: string }) {
  const verticals = Array.from({ length: 13 }, (_, i) => i * 100);
  const horizontals = Array.from({ length: 10 }, (_, i) => i * 100);
  return (
    <svg
      viewBox="0 0 1200 900"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {verticals.map((x) => (
        <line key={`v${x}`} x1={x} y1={0} x2={x} y2={900} />
      ))}
      {horizontals.map((y) => (
        <line key={`h${y}`} x1={0} y1={y} x2={1200} y2={y} />
      ))}
      {[220, 320, 430, 550].map((r, i) => (
        <path
          key={r}
          d={`M ${1200 + r * 0.2} ${900 + r * 0.1} C ${1000 - r * 0.2} ${
            860 - r * 0.9
          }, ${760 - r * 0.6} ${560 - r * 0.7}, ${420 - r * 0.3} ${
            420 - r * 0.2
          } S ${-40 - i * 40} ${300 - r * 0.2}, ${-80} ${120}`}
          strokeWidth={1.25}
        />
      ))}
    </svg>
  );
}
