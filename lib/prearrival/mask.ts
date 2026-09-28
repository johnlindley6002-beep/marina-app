// Masks an ID or passport number for display in a list (staff arrivals board,
// any summary view): only the last 4 characters are shown. The wizard's own
// editing fields never use this, since the boater needs to see what they
// typed; this is for a screen someone else might glance at.
export function maskIdNumber(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length <= 4) return trimmed;
  return `••••${trimmed.slice(-4)}`;
}
