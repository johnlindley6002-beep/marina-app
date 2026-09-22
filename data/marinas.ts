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
