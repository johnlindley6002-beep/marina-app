// Country classification for the pre-arrival check-in: who is EU, who is
// Schengen (not the same set), and who moves freely without a visa. Names
// match lib/countries.ts exactly, so a country picked there classifies
// correctly here with no extra mapping step.
//
// This is current as of writing and kept deliberately small and readable, not
// a general-purpose geopolitical database. Review before relying on it for
// anything beyond this mockup.

export const EU_COUNTRIES = new Set<string>([
  "Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czechia",
  "Denmark", "Estonia", "Finland", "France", "Germany", "Greece",
  "Hungary", "Ireland", "Italy", "Latvia", "Lithuania", "Luxembourg",
  "Malta", "Netherlands", "Poland", "Portugal", "Romania", "Slovakia",
  "Slovenia", "Spain", "Sweden",
]);

// The Schengen area is not the same as the EU: Ireland and Cyprus are EU but
// outside Schengen; Iceland, Norway, Liechtenstein and Switzerland are
// Schengen but outside the EU.
export const SCHENGEN_COUNTRIES = new Set<string>([
  "Austria", "Belgium", "Bulgaria", "Croatia", "Czechia", "Denmark",
  "Estonia", "Finland", "France", "Germany", "Greece", "Hungary",
  "Iceland", "Italy", "Latvia", "Liechtenstein", "Lithuania", "Luxembourg",
  "Malta", "Netherlands", "Norway", "Poland", "Portugal", "Romania",
  "Slovakia", "Slovenia", "Spain", "Sweden", "Switzerland",
]);

// EU, EEA (EU plus Iceland, Norway, Liechtenstein) and Switzerland: nationals
// of these move and reside freely, so temporary-admission and residence
// warnings elsewhere are about non-EU-flagged boats and non-EU nationals
// specifically, not this wider group.
export const FREE_MOVEMENT_COUNTRIES = new Set<string>([
  ...EU_COUNTRIES,
  "Iceland", "Norway", "Liechtenstein", "Switzerland",
]);

export function isEU(country: string): boolean {
  return EU_COUNTRIES.has(country);
}

export function isSchengen(country: string): boolean {
  return SCHENGEN_COUNTRIES.has(country);
}

export function isFreeMovementNational(country: string): boolean {
  return FREE_MOVEMENT_COUNTRIES.has(country);
}

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
export function buildPtIdentificationSet(
  boatName: string,
  seed: string
): string {
  const clean = (boatName || "BOAT")
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
