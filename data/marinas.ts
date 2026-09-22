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

// Class order as published in the official tariff.
export const MARINA_CLASS_ORDER: MarinaClass[] = [
  "I",
  "IA",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VIA",
  "VII",
  "VIII",
  "IX",
];

// Length range (metres, LOA) for each class, per the official tariff.
export const CLASS_LENGTH_RANGES: Record<
  MarinaClass,
  { minM: number; maxM: number }
> = {
  I: { minM: 0, maxM: 6.15 },
  IA: { minM: 6.16, maxM: 6.5 },
  II: { minM: 6.51, maxM: 8.0 },
  III: { minM: 8.01, maxM: 10.0 },
  IV: { minM: 10.01, maxM: 12.0 },
  V: { minM: 12.01, maxM: 15.0 },
  VI: { minM: 15.01, maxM: 18.0 },
  VIA: { minM: 18.01, maxM: 20.0 },
  VII: { minM: 20.01, maxM: 25.0 },
  VIII: { minM: 25.01, maxM: 36.0 },
  IX: { minM: 36.01, maxM: 45.0 },
};

export function classifyBoatLength(lengthM: number): MarinaClass | null {
  for (const marinaClass of MARINA_CLASS_ORDER) {
    if (lengthM <= CLASS_LENGTH_RANGES[marinaClass].maxM) return marinaClass;
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
  | "crane"
  | "pumpOut"
  | "laundry"
  | "security24h"
  | "wifi"
  | "dryStorage"
  | "repairs";

export const FACILITY_LABELS: Record<FacilityKey, string> = {
  fuel: "Fuel dock",
  water: "Water",
  power: "Shore power",
  travelLift: "70-tonne travel lift",
  crane: "Crane",
  pumpOut: "Pump-out",
  laundry: "Laundry",
  security24h: "24-hour security",
  wifi: "Wifi",
  dryStorage: "Dry storage",
  repairs: "Repairs",
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
  gettingThere: { byCar: string; byTrain: string; byAir: string };
  arrivalInstructions: string;
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
      "crane",
      "pumpOut",
      "laundry",
      "security24h",
      "wifi",
      "dryStorage",
      "repairs",
    ],
    heroImage: "/images/cascais-hero-placeholder.svg",
    transientRates: TRANSIENT_RATES,
    vatRate: 0.23,
    gettingThere: {
      byCar: "Via the A5 motorway, Cascais exit",
      byTrain: "Cascais train station, then a short walk to the marina",
      byAir: "~35 km from Lisbon Humberto Delgado Airport",
    },
    arrivalInstructions:
      "On arrival, berth on the Reception pier and report to the marina office.",
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
