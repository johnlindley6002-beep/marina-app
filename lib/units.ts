export type UnitSystem = "metric" | "imperial";

const FEET_PER_METRE = 3.28084;

export function unitLabel(units: UnitSystem): "m" | "ft" {
  return units === "imperial" ? "ft" : "m";
}

function trim(value: number, digits: number): string {
  return String(Number(value.toFixed(digits)));
}

// Formats a length held in metres for display. `fixed` forces decimals
// (e.g. "6.0 m").
export function formatLength(
  metres: number,
  units: UnitSystem,
  fixed?: number
): string {
  if (units === "imperial") {
    const feet = metres * FEET_PER_METRE;
    return `${fixed !== undefined ? feet.toFixed(fixed) : trim(feet, 1)} ft`;
  }
  return `${fixed !== undefined ? metres.toFixed(fixed) : trim(metres, 2)} m`;
}

// Stored values are always metres (as strings); these convert to and
// from what the visitor sees in an input.
export function metresToInput(metres: string, units: UnitSystem): string {
  if (metres === "" || units === "metric") return metres;
  const value = Number(metres);
  if (!Number.isFinite(value)) return metres;
  return (value * FEET_PER_METRE).toFixed(1);
}

export function inputToMetres(text: string, units: UnitSystem): string {
  if (text === "" || units === "metric") return text;
  const value = Number(text);
  if (!Number.isFinite(value)) return text;
  return String(Number((value / FEET_PER_METRE).toFixed(2)));
}

// Replaces "(m)" in a translated label with the active unit.
export function withUnit(label: string, units: UnitSystem): string {
  return label.replace("(m)", `(${unitLabel(units)})`);
}

// Renders {{m:25}} tokens in data text as a length in the active unit.
export function renderLengthTokens(text: string, units: UnitSystem): string {
  return text.replace(/\{\{m:(\d+(?:\.\d+)?)\}\}/g, (_, m) =>
    formatLength(Number(m), units)
  );
}

// A length in metres as a bare number in the active unit (for ranges).
export function toDisplay(metres: number, units: UnitSystem): number {
  return units === "imperial"
    ? Number((metres * FEET_PER_METRE).toFixed(1))
    : Number(metres.toFixed(2));
}
