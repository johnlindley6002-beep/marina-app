export type MarinaClass =
  | "I"
  | "IA"
  | "II"
  | "III"
  | "IV"
  | "V"
  | "VI"
  | "VIA"
  | "VII"
  | "VIII"
  | "IX";

export type Season = "low" | "high";

// Official Marina de Cascais transient day-rate tariff, in force since
// 1 Jan 2026 (excl. VAT; utilities extra). LOW = Jan-Mar & Oct-Dec,
// HIGH = Apr-Sep. Source: "TARIFAS E SERVIÇOS A4_2026_PT_final.pdf".
export const TRANSIENT_RATES: Record<MarinaClass, { low: number; high: number }> = {
  I: { low: 12.6, high: 19.5 },
  IA: { low: 13.0, high: 22.0 },
  II: { low: 18.35, high: 30.3 },
  III: { low: 21.5, high: 36.95 },
  IV: { low: 31.5, high: 49.65 },
  V: { low: 46.9, high: 71.7 },
  VI: { low: 54.0, high: 96.6 },
  VIA: { low: 60.6, high: 115.8 },
  VII: { low: 66.15, high: 146.15 },
  VIII: { low: 90.95, high: 198.45 },
  IX: { low: 115.75, high: 253.55 },
};

// Upper length bound (metres, LOA) for each class.
const CLASS_MAX_LENGTH_M: [MarinaClass, number][] = [
  ["I", 6.15],
  ["IA", 6.5],
  ["II", 8.0],
  ["III", 10.0],
  ["IV", 12.0],
  ["V", 15.0],
  ["VI", 18.0],
  ["VIA", 20.0],
  ["VII", 25.0],
  ["VIII", 36.0],
  ["IX", 45.0],
];

export function classifyBoatLength(lengthM: number): MarinaClass | null {
  for (const [marinaClass, maxLength] of CLASS_MAX_LENGTH_M) {
    if (lengthM <= maxLength) return marinaClass;
  }
  return null;
}

// High season is April-September; low season is the rest of the year,
// per the official tariff's own definition.
export function getSeason(date: Date): Season {
  const month = date.getMonth() + 1;
  return month >= 4 && month <= 9 ? "high" : "low";
}

export type FacilityKey =
  | "fuel"
  | "water"
  | "power"
  | "travelLift"
  | "security24h"
  | "showersLaundry"
  | "repairs"
  | "dryStorage";

export const FACILITY_LABELS: Record<FacilityKey, string> = {
  fuel: "Fuel dock",
  water: "Water",
  power: "Power",
  travelLift: "70T travel lift",
  security24h: "24h security",
  showersLaundry: "Showers & laundry",
  repairs: "Repairs",
  dryStorage: "Dry storage",
};

export type Marina = {
  id: string;
  name: string;
  country: string;
  countrySlug: string;
  location: string;
  address: string;
  coordinates: { lat: number; lng: number };
  berths: { count: number; maxLengthM: number; maxDraftM: number };
  opened: number;
  phone: string;
  email: string;
  vhfChannel: number;
  officeHours: { summer: string; winter: string };
  description: string;
  facilities: FacilityKey[];
  heroImage: string;
  transientRates: Record<MarinaClass, { low: number; high: number }>;
  vatRate: number;
};

export const marinas: Marina[] = [
  {
    id: "cascais",
    name: "Marina de Cascais",
    country: "Portugal",
    countrySlug: "portugal",
    location: "Cascais, Portuguese Riviera, ~35 km west of Lisbon",
    address: "Casa de São Bernardo, 2750-800 Cascais, Portugal",
    coordinates: { lat: 38.693, lng: -9.418 },
    berths: { count: 650, maxLengthM: 36, maxDraftM: 6 },
    opened: 1999,
    phone: "+351 214 824 800",
    email: "info@marinacascais.pt",
    vhfChannel: 9,
    officeHours: { summer: "08:30–20:00", winter: "09:00–18:00" },
    description:
      "Marina de Cascais is a full-service marina on the Bay of Cascais, just five minutes from the town centre and the largest on the Portuguese Riviera. With around 650 berths for vessels up to 36 metres, it pairs sheltered, modern moorings with a complete range of nautical services alongside the restaurants and shops of the waterfront.",
    facilities: [
      "fuel",
      "water",
      "power",
      "travelLift",
      "security24h",
      "showersLaundry",
      "repairs",
      "dryStorage",
    ],
    heroImage: "/images/cascais-hero-placeholder.svg",
    transientRates: TRANSIENT_RATES,
    vatRate: 0.23,
  },
];

export function getCountries(): { slug: string; name: string }[] {
  const countries = new Map<string, string>();
  for (const marina of marinas) {
    if (!countries.has(marina.countrySlug)) {
      countries.set(marina.countrySlug, marina.country);
    }
  }
  return Array.from(countries, ([slug, name]) => ({ slug, name }));
}

export function getMarinasByCountry(countrySlug: string): Marina[] {
  return marinas.filter((marina) => marina.countrySlug === countrySlug);
}

export function getMarina(
  countrySlug: string,
  marinaId: string
): Marina | undefined {
  return marinas.find(
    (marina) => marina.countrySlug === countrySlug && marina.id === marinaId
  );
}
