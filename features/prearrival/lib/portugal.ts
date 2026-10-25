// Portuguese specifics for the pre-arrival wizard.

// Portuguese navigation zones (Categorias de navegação), used only to ask the
// right follow-up questions for a Portuguese-flagged boat.
export const NAVIGATION_ZONES: { value: 1 | 2 | 3 | 4 | 5; label: string }[] = [
  { value: 1, label: "Zone 1, ocean, unrestricted" },
  { value: 2, label: "Zone 2, up to 200 nautical miles from a safe haven" },
  { value: 3, label: "Zone 3, up to 30 nautical miles from a safe haven" },
  { value: 4, label: "Zone 4, up to 5 nautical miles from a safe haven" },
  { value: 5, label: "Zone 5, sheltered waters" },
];

// A plausible-looking Portuguese boat identification (Documento Único de
// Identificação style: NAME-NNNNNN-xPT). This is a mock format for display
// only, not issued by any registry.
export function buildPtIdentificationSet(boatName: string, seed: string): string {
  const clean =
    (boatName || "BOAT")
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "")
      .slice(0, 12) || "BOAT";
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const digits = String(hash % 1_000_000).padStart(6, "0");
  const check = "ABCDEFGHJKLMNPQRSTUVWXYZ"[hash % 24];
  return `${clean}-${digits}-${check}PT`;
}
