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

// Beam (m) per class, per the official tariff's "Boca" column.
export const CLASS_BEAM_RANGES: Record<MarinaClass, number> = {
  I: 2.4,
  IA: 2.5,
  II: 3.2,
  III: 3.8,
  IV: 4.4,
  V: 5.0,
  VI: 5.5,
  VIA: 6.0,
  VII: 6.5,
  VIII: 7.2,
  IX: 10.0,
};

export function getMaxBeamM(): number {
  return Math.max(...Object.values(CLASS_BEAM_RANGES));
}

export type BoatDimensions = { loa: number; beam: number; draft: number };

export type BoatFitResult =
  | { fits: true; marinaClass: MarinaClass }
  | { fits: false; reason: "length" | "beam" | "draft" };

// Checks a boat against the marina's REAL class range (up to 45m via
// Class IX, the mega-yacht allocation) rather than the ~36m figure
// used in the marina's general description text, which refers to the
// standard-berth majority, not the marina's true upper limit.
export function checkBoatFit(
  marina: Marina,
  dims: BoatDimensions
): BoatFitResult {
  if (dims.draft > marina.berths.maxDraftM) {
    return { fits: false, reason: "draft" };
  }
  const marinaClass = classifyBoatLength(dims.loa);
  if (!marinaClass) {
    return { fits: false, reason: "length" };
  }
  if (dims.beam > CLASS_BEAM_RANGES[marinaClass]) {
    return { fits: false, reason: "beam" };
  }
  return { fits: true, marinaClass };
}

export function boatFitsMarina(marina: Marina, dims: BoatDimensions): boolean {
  return checkBoatFit(marina, dims).fits;
}

export type PriceBand = "€" | "€€" | "€€€";

// Generic, not hardcoded per marina: buckets by the cheapest class's
// low-season nightly rate.
export function getPriceBand(marina: Marina): PriceBand {
  const cheapest = Math.min(
    ...MARINA_CLASS_ORDER.map((c) => marina.transientRates[c].low)
  );
  if (cheapest < 20) return "€";
  if (cheapest < 40) return "€€";
  return "€€€";
}

// High season is April-September; low season is the rest of the year,
// per the official tariff's own definition.
export function getSeason(date: Date): Season {
  const month = date.getMonth() + 1;
  return month >= 4 && month <= 9 ? "high" : "low";
}

// The fuel wording for the estimate: the marina's own per-litre prices when it
// has supplied them, otherwise the general note.
export function getFuelNote(marina: Marina): string {
  const { diesel, ron95 } = marina.fuelPrices;
  const parts: string[] = [];
  if (diesel.value !== null) parts.push(`Diesel €${diesel.value.toFixed(3)}/L`);
  if (ron95.value !== null) parts.push(`RON 95 €${ron95.value.toFixed(3)}/L`);
  return parts.length > 0
    ? `${parts.join(", ")}, billed at the fuel dock`
    : marina.serviceFees.fuelNote;
}

// The oldest confirmation date among the fuel prices on file, so the "Updated"
// line never looks fresher than the least recent price. Null if none is dated.
export function getFuelUpdated(marina: Marina): string | null {
  const dates = [marina.fuelPrices.diesel, marina.fuelPrices.ron95]
    .filter((entry) => entry.value !== null && entry.lastUpdated)
    .map((entry) => entry.lastUpdated as string)
    .sort();
  return dates[0] ?? null;
}

// Returns the marina's busy-period note when any night of the stay falls in a
// busy month, otherwise null. A static indicator from data, not surge pricing.
export function getDemandFlag(
  marina: Marina,
  arrival: string,
  departure: string
): string | null {
  if (!marina.demand) return null;
  const from = parseIsoDate(arrival);
  const to = parseIsoDate(departure);
  if (!from || !to || to <= from) return null;
  const cursor = new Date(from);
  while (cursor < to) {
    if (marina.demand.busyMonths.includes(cursor.getMonth() + 1)) {
      return marina.demand.note;
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return null;
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

// Maps a countryCode to its flag asset. Add an entry here whenever a
// marina in a new country is added.
export const COUNTRY_FLAGS: Record<string, string> = {
  PT: "/images/flags/pt.svg",
};

export type Localized = { en: string; pt: string };
export type Point = { x: number; y: number };

export type FacilityIconKey =
  | FacilityKey
  | "reception"
  | "showers"
  | "heliport"
  | "waste"
  | "extras";

export type FacilityDetail = {
  id: string;
  name: Localized;
  icon: FacilityIconKey;
  description: Localized;
  details: Localized[];
  // Approximate position in the marina's mapCanvas space, for the map to pin later.
  mapPoint?: Point;
};

export type ServiceFees = {
  pumpOutEur: number;
  laundryWashEur: number;
  laundryDryEur: number;
  wasteDisposalEur: { min: number; max: number };
  maxAmperage: number;
  amperageOptions: number[];
  fuelNote: string;
};

export const SEASON_LABELS: Record<Season, string> = {
  low: "Low season (Jan–Mar, Oct–Dec)",
  high: "High season (Apr–Sep)",
};

export type QuoteAddOns = {
  shorePower: boolean;
  water: boolean;
  pumpOut: boolean;
  fuel: boolean;
  laundry: boolean;
};

export type QuoteLine = {
  label: string;
  amountEur: number | null;
  note?: string;
};

export type Quote = {
  marinaClass: MarinaClass;
  nights: number;
  berthLines: {
    season: Season;
    nights: number;
    rateEur: number;
    subtotalEur: number;
  }[];
  berthSubtotalEur: number;
  addOnLines: QuoteLine[];
  estimatedTotalEur: number;
};

function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

// Prices each night by its own season, so stays that cross a season
// boundary are split correctly. Rates are ex-VAT, per the official tariff.
export function calculateQuote(
  marina: Marina,
  input: { loa: number; arrival: string; departure: string },
  addOns: QuoteAddOns
): Quote | null {
  const marinaClass = classifyBoatLength(input.loa);
  const arrival = parseIsoDate(input.arrival);
  const departure = parseIsoDate(input.departure);
  if (!marinaClass || !arrival || !departure || departure <= arrival) {
    return null;
  }

  const nightsBySeason: Record<Season, number> = { low: 0, high: 0 };
  const cursor = new Date(arrival);
  while (cursor < departure) {
    nightsBySeason[getSeason(cursor)] += 1;
    cursor.setDate(cursor.getDate() + 1);
  }

  const berthLines = (["low", "high"] as Season[])
    .filter((season) => nightsBySeason[season] > 0)
    .map((season) => {
      const rateEur = marina.transientRates[marinaClass][season];
      const nights = nightsBySeason[season];
      return { season, nights, rateEur, subtotalEur: rateEur * nights };
    });
  const berthSubtotalEur = berthLines.reduce((s, l) => s + l.subtotalEur, 0);
  const nights = nightsBySeason.low + nightsBySeason.high;

  const fees = marina.serviceFees;
  const addOnLines: QuoteLine[] = [];
  if (addOns.shorePower) {
    addOnLines.push({
      label: "Shore power",
      amountEur: null,
      note: `Metered, billed on consumption (up to ${fees.maxAmperage} A)`,
    });
  }
  if (addOns.water) {
    addOnLines.push({
      label: "Water",
      amountEur: null,
      note: "Metered, billed on consumption",
    });
  }
  if (addOns.pumpOut) {
    addOnLines.push({
      label: "Pump-out",
      amountEur: fees.pumpOutEur,
      note: "Per operation",
    });
  }
  if (addOns.fuel) {
    addOnLines.push({ label: "Fuel", amountEur: null, note: getFuelNote(marina) });
  }
  if (addOns.laundry) {
    addOnLines.push({
      label: "Laundry",
      amountEur: null,
      note: `Wash €${fees.laundryWashEur.toFixed(2)} / dry €${fees.laundryDryEur.toFixed(2)} per load, tokens from reception`,
    });
  }

  const estimatedTotalEur =
    berthSubtotalEur +
    addOnLines.reduce((s, l) => s + (l.amountEur ?? 0), 0);

  return {
    marinaClass,
    nights,
    berthLines,
    berthSubtotalEur,
    addOnLines,
    estimatedTotalEur,
  };
}

// Real Google rating data. All three values are entered by the owner from
// the marina's Google listing; nothing here is invented. The block renders
// only when reviewCount reaches siteConfig.googleReviewsMinCount.
export type GoogleReviews = {
  rating: number | null;
  reviewCount: number | null;
  googleUrl: string | null;
};

// A marina-maintained value that changes over time, with the date it was last
// confirmed (ISO, YYYY-MM-DD, or null until known). Reuse this shape for any
// value that should show an "Updated" date, such as hours or service prices.
//
// How these values are refreshed: either by a future integration with the
// marina's own system, or by the marina emailing us updates that we apply to
// this data entry by hand. Nothing here is fetched live.
export type Timestamped<T> = { value: T; lastUpdated: string | null };

// Fuel prices in euros per litre. Leave value null until the marina confirms
// a current price, and set lastUpdated to the date it was confirmed.
export type FuelPrices = {
  diesel: Timestamped<number | null>;
  ron95: Timestamped<number | null>;
};

// Static busy-period flag for display only. It never changes a price.
// busyMonths uses 1 (January) to 12 (December).
export type DemandInfo = { busyMonths: number[]; note: string };

export type NearbyPlace = { name: string; description: string };
export type EmergencyPhone = { label: string; number: string };
export type VhfChannelInfo = { channel: number; label: string };

export type Marina = {
  id: string;
  name: string;
  country: string;
  countrySlug: string;
  countryCode: string;
  location: string;
  address: string;
  coordinates: { lat: number; lng: number };
  berths: {
    count: number;
    maxLengthM: number;
    maxDraftM: number;
    minDepthM: number;
  };
  opened: number;
  phone: string;
  email: string;
  vhfChannel: number;
  officeHours: { summer: string; winter: string };
  description: string;
  facilities: FacilityKey[];
  // The marina's wordmark, shown over the hero and used for the social preview
  // until a hero photo exists.
  wordmark: string;
  // Full-bleed hero photo. Leave null until a real photo is supplied; the hero
  // reserves the same space with a styled placeholder, so nothing shifts.
  heroImage: { src: string; alt: string } | null;
  // Two full-bleed resting bands, each a pause with no text over it. Leave null
  // until a real photo is supplied; the band keeps the same height either way.
  bandImages: {
    // Between the booking area and the practical information.
    afterPlan: { src: string; alt: string } | null;
    // Before the About section.
    beforeAbout: { src: string; alt: string } | null;
  };
  clubBurgee?: { src: string; name: string };
  transientRates: Record<MarinaClass, { low: number; high: number }>;
  vatRate: number;
  gettingThere: { byCar: string; byTrain: string; byAir: string };
  arrivalInstructions: string;
  insuranceMinimumEur: number;
  region: string;
  outsideHoursInstructions: string;
  entryNote: string;
  protection: {
    level: "sheltered" | "partial" | "exposed";
    description: string;
  };
  // Photos flagged placeholder are never shown; add real ones without the flag.
  photos: {
    src: string;
    alt: string;
    caption: string;
    credit?: string;
    placeholder?: boolean;
  }[];
  serviceFees: ServiceFees;
  cancellationPolicy: string | null;
  facilityDetails: FacilityDetail[];
  // Space the facility pins and wayfinding points are expressed in.
  mapCanvas: { width: number; height: number };
  wayfinding: { entrance: Point | null; reception: Point };
  vesselStatusNotes: {
    euReminders: string[];
    // Shown in this order with the Temporary Admission note after the first.
    internationalNotes: string[];
    temporaryAdmission: { private: string; commercial: string };
    // Shown when the vessel use is charter or commercial. General guidance only.
    commercialUseNotes: string[];
    commercialUseDisclaimer: string;
  };
  preArrivalChecklist: string[];
  planImage: { src: string; alt: string };
  // Optional photo for cards and the homepage feature; none supplied yet.
  coverImage?: { src: string; alt: string };
  // Shown as the flagship on the homepage.
  featured?: boolean;
  googleReviews: GoogleReviews;
  fuelPrices: FuelPrices;
  demand: DemandInfo | null;
  nearby: NearbyPlace[];
  emergency: { phones: EmergencyPhone[]; vhf: VhfChannelInfo[] };
};

const CASCAIS_OFFICE_HOURS = { summer: "08:30–20:00", winter: "09:00–18:00" };
const CASCAIS_VHF_CHANNEL = 9;
const CASCAIS_MAX_AMPERAGE = 32;
const CASCAIS_VAT_RATE = 0.23;
const CASCAIS_OUTSIDE_HOURS =
  "Outside office hours, berth on the reception quay and report to the office.";
const CASCAIS_SERVICE_FEES: ServiceFees = {
  pumpOutEur: 25,
  laundryWashEur: 5,
  laundryDryEur: 6.5,
  wasteDisposalEur: { min: 8.9, max: 16.5 },
  maxAmperage: CASCAIS_MAX_AMPERAGE,
  amperageOptions: [16, 32],
  // Shown when no per-litre price has been supplied (see fuelPrices).
  fuelNote: "Diesel / petrol, price at the fuel dock",
};

// TODO (owner to supply): mapPoint for wifi, security, waste and extras;
// wayfinding.entrance; cancellationPolicy.
const CASCAIS_FACILITY_DETAILS: FacilityDetail[] = [
  {
    id: "reception",
    name: { en: "Reception / Marina office", pt: "Receção / Escritório da marina" },
    icon: "reception",
    description: {
      en: "The marina office in Casa de São Bernardo, your first stop on arrival.",
      pt: "O escritório da marina na Casa de São Bernardo, a primeira paragem à chegada.",
    },
    details: [
      {
        en: `Summer ${CASCAIS_OFFICE_HOURS.summer} · Winter ${CASCAIS_OFFICE_HOURS.winter}`,
        pt: `Verão ${CASCAIS_OFFICE_HOURS.summer} · Inverno ${CASCAIS_OFFICE_HOURS.winter}`,
      },
      {
        en: `Hail on VHF channel ${CASCAIS_VHF_CHANNEL}`,
        pt: `Contacto via VHF canal ${CASCAIS_VHF_CHANNEL}`,
      },
      {
        en: "Cards, power/water adaptors and mail are handled here at check-in",
        pt: "Cartões, adaptadores de eletricidade/água e correio são tratados aqui no check-in",
      },
    ],
    mapPoint: { x: 1147, y: 545 },
  },
  {
    id: "fuel",
    name: { en: "Fuel dock", pt: "Posto de combustível" },
    icon: "fuel",
    description: {
      en: "Diesel and petrol on the east fuel pier.",
      pt: "Gasóleo e gasolina no cais de combustível, lado este.",
    },
    details: [
      { en: "Daily 09:00–19:00", pt: "Diariamente 09:00–19:00" },
      { en: "Diesel and petrol (RON95)", pt: "Gasóleo e gasolina (RON95)" },
      { en: "Tel. +351 913 924 155", pt: "Tel. +351 913 924 155" },
      { en: "East fuel pier", pt: "Cais de combustível, lado este" },
    ],
    mapPoint: { x: 1210, y: 655 },
  },
  {
    id: "utilities",
    name: { en: "Water & electricity", pt: "Água e eletricidade" },
    icon: "power",
    description: {
      en: "Water and shore power are available at every berth.",
      pt: "Água e eletricidade disponíveis em todos os postos de amarração.",
    },
    details: [
      {
        en: `Up to ${CASCAIS_MAX_AMPERAGE} A at every berth`,
        pt: `Até ${CASCAIS_MAX_AMPERAGE} A em todos os postos`,
      },
      { en: "Adaptors available from reception", pt: "Adaptadores disponíveis na receção" },
      { en: "Card access", pt: "Acesso por cartão" },
      { en: "Metered and billed separately", pt: "Medido e faturado à parte" },
    ],
    mapPoint: { x: 760, y: 300 },
  },
  {
    id: "showers",
    name: { en: "Showers & WC", pt: "Duches e WC" },
    icon: "showers",
    description: {
      en: "Shower and toilet facilities for visiting crews.",
      pt: "Duches e instalações sanitárias para as tripulações visitantes.",
    },
    details: [
      { en: "Card access", pt: "Acesso por cartão" },
      { en: "In the facilities building", pt: "No edifício de serviços" },
    ],
    mapPoint: { x: 250, y: 200 },
  },
  {
    id: "laundry",
    name: { en: "Laundry", pt: "Lavandaria" },
    icon: "laundry",
    description: {
      en: "Token-operated washers and driers.",
      pt: "Máquinas de lavar e secar operadas por fichas.",
    },
    details: [
      {
        en: "Tokens 08:00–20:00 at the reception building",
        pt: "Fichas das 08:00 às 20:00 no edifício da receção",
      },
      {
        en: `Wash €${CASCAIS_SERVICE_FEES.laundryWashEur} · Dry €${CASCAIS_SERVICE_FEES.laundryDryEur.toFixed(2)}`,
        pt: `Lavagem €${CASCAIS_SERVICE_FEES.laundryWashEur} · Secagem €${CASCAIS_SERVICE_FEES.laundryDryEur.toFixed(2)}`,
      },
    ],
    mapPoint: { x: 250, y: 230 },
  },
  {
    id: "pumpOut",
    name: { en: "Pump-out", pt: "Recolha de águas residuais" },
    icon: "pumpOut",
    description: {
      en: "Holding-tank pump-out service.",
      pt: "Serviço de recolha de águas residuais.",
    },
    details: [
      {
        en: `€${CASCAIS_SERVICE_FEES.pumpOutEur} per operation`,
        pt: `€${CASCAIS_SERVICE_FEES.pumpOutEur} por operação`,
      },
    ],
    mapPoint: { x: 275, y: 600 },
  },
  {
    id: "travelLift",
    name: { en: "Travel lift & crane", pt: "Grua de pórtico e guindaste" },
    icon: "travelLift",
    description: {
      en: "Lift-out, launching and hard-standing services in the technical area.",
      pt: "Serviços de içar, lançar e estaleiro na zona técnica.",
    },
    details: [
      { en: "70-tonne gantry travel lift", pt: "Grua de pórtico de 70 toneladas" },
      { en: "2-tonne crane", pt: "Guindaste de 2 toneladas" },
      { en: "Boat ramp", pt: "Rampa de varagem" },
      { en: "Hull cleaning", pt: "Limpeza de casco" },
      { en: "Technical area", pt: "Zona técnica" },
    ],
    mapPoint: { x: 275, y: 570 },
  },
  {
    id: "dryStorage",
    name: { en: "Dry / winter storage & repairs", pt: "Armazenamento a seco / invernal e reparações" },
    icon: "dryStorage",
    description: {
      en: "Certified maintenance and out-of-water storage.",
      pt: "Manutenção certificada e armazenamento fora de água.",
    },
    details: [
      { en: "Certified maintenance", pt: "Manutenção certificada" },
      // {{m:N}} is rendered in the visitor's chosen length unit.
      { en: "Vessels up to {{m:25}}", pt: "Embarcações até {{m:25}}" },
    ],
    mapPoint: { x: 275, y: 600 },
  },
  {
    id: "wifi",
    name: { en: "Wifi", pt: "Wi-Fi" },
    icon: "wifi",
    description: {
      en: "Wireless internet across the marina.",
      pt: "Internet sem fios em toda a marina.",
    },
    details: [{ en: "Marina-wide coverage", pt: "Cobertura em toda a marina" }],
  },
  {
    id: "security",
    name: { en: "24-hour security", pt: "Segurança 24 horas" },
    icon: "security24h",
    description: {
      en: "The marina is monitored around the clock.",
      pt: "A marina é vigiada a toda a hora.",
    },
    details: [
      { en: "Video surveillance", pt: "Videovigilância" },
      { en: "Night watchman", pt: "Vigilante noturno" },
    ],
  },
  {
    id: "heliport",
    name: { en: "Heliport", pt: "Heliporto" },
    icon: "heliport",
    description: {
      en: "Helicopter landing area for safety and rescue.",
      pt: "Zona de aterragem de helicópteros para segurança e salvamento.",
    },
    details: [
      { en: "East side of the marina", pt: "Lado este da marina" },
      { en: "Safety and rescue use", pt: "Uso de segurança e salvamento" },
    ],
    mapPoint: { x: 1290, y: 520 },
  },
  {
    id: "waste",
    name: { en: "Waste & recycling", pt: "Resíduos e reciclagem" },
    icon: "waste",
    description: {
      en: "Recycling points and waste disposal for visiting boats.",
      pt: "Pontos de reciclagem e recolha de resíduos para embarcações visitantes.",
    },
    details: [
      { en: "Recycling points", pt: "Ecopontos" },
      {
        en: `Disposal €${CASCAIS_SERVICE_FEES.wasteDisposalEur.min.toFixed(2)}–€${CASCAIS_SERVICE_FEES.wasteDisposalEur.max.toFixed(2)} depending on volume`,
        pt: `Recolha €${CASCAIS_SERVICE_FEES.wasteDisposalEur.min.toFixed(2)}–€${CASCAIS_SERVICE_FEES.wasteDisposalEur.max.toFixed(2)} consoante o volume`,
      },
    ],
  },
  {
    id: "extras",
    name: { en: "Extras & nearby", pt: "Extras e arredores" },
    icon: "extras",
    description: {
      en: "Everyday extras on site and around the waterfront.",
      pt: "Extras do dia a dia no local e junto à frente de mar.",
    },
    details: [
      { en: "Bicycles", pt: "Bicicletas" },
      { en: "Car rental", pt: "Aluguer de automóveis" },
      { en: "Ice", pt: "Gelo" },
      { en: "Shops, restaurants and café-bar", pt: "Lojas, restaurantes e café-bar" },
      { en: "Parking (covered available)", pt: "Estacionamento (coberto disponível)" },
      { en: "Dinghy dock", pt: "Cais para tenders" },
    ],
  },
];

export const marinas: Marina[] = [
  {
    id: "cascais",
    name: "Marina de Cascais",
    country: "Portugal",
    countrySlug: "portugal",
    countryCode: "PT",
    location: "Cascais, Portuguese Riviera, ~35 km west of Lisbon",
    address: "Casa de São Bernardo, 2750-800 Cascais, Portugal",
    coordinates: { lat: 38.693, lng: -9.418 },
    berths: { count: 650, maxLengthM: 36, maxDraftM: 6, minDepthM: 6 },
    opened: 1999,
    phone: "+351 214 824 800",
    email: "info@marinacascais.pt",
    vhfChannel: CASCAIS_VHF_CHANNEL,
    officeHours: CASCAIS_OFFICE_HOURS,
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
    wordmark: "/images/marina-cascais-logo.png",
    // TODO (owner): add the hero photo as { src: "/images/...", alt: "..." }.
    heroImage: null,
    // TODO (owner): add two calm, wide photos as { src: "/images/...", alt: "..." }.
    bandImages: { afterPlan: null, beforeAbout: null },
    clubBurgee: {
      src: "/images/burgee-cn-cascais.svg",
      name: "Clube Naval de Cascais",
    },
    transientRates: TRANSIENT_RATES,
    vatRate: CASCAIS_VAT_RATE,
    gettingThere: {
      byCar: "Via the A5 motorway, Cascais exit",
      byTrain: "Cascais train station, then a short walk to the marina",
      byAir: "~35 km from Lisbon Humberto Delgado Airport",
    },
    arrivalInstructions:
      "On arrival, berth on the Reception pier and report to the marina office.",
    insuranceMinimumEur: 1_500_000,
    region: "Lisbon Coast",
    outsideHoursInstructions: CASCAIS_OUTSIDE_HOURS,
    entryNote:
      "Approach from the mouth of the Tejo, on the north side; the main entrance opens directly to the Atlantic.",
    // TODO (owner): confirm this rating with the marina or local pilots. It is
    // a general judgement, not measured data. level is sheltered (Well
    // protected), partial (Moderate) or exposed (Exposed).
    protection: {
      level: "partial",
      description:
        "Well protected inside; exposed to strong SW/S conditions at the entrance.",
    },
    photos: [
      {
        src: "/images/photo-placeholder-marina.svg",
        placeholder: true,
        alt: "Placeholder photo of the marina basin",
        caption: "The marina basin",
      },
      {
        src: "/images/photo-placeholder-pontoons.svg",
        placeholder: true,
        alt: "Placeholder photo of the pontoons",
        caption: "Pontoons and berths",
      },
      {
        src: "/images/photo-placeholder-town.svg",
        placeholder: true,
        alt: "Placeholder photo of Cascais town",
        caption: "Cascais town beyond",
      },
    ],
    serviceFees: CASCAIS_SERVICE_FEES,
    // TODO (owner): replace with the marina's real cancellation terms.
    cancellationPolicy:
      "Cancellation terms are set by Marina de Cascais. Sending an enquiry does not create a booking or take payment. The marina confirms availability and its cancellation terms by email before anything is agreed.",
    facilityDetails: CASCAIS_FACILITY_DETAILS,
    mapCanvas: { width: 1400, height: 990 },
    wayfinding: { entrance: null, reception: { x: 1147, y: 545 } },
    vesselStatusNotes: {
      euReminders: [
        "Have your boat registration, insurance certificate (minimum €1.5 million cover) and the skipper's certificate of competence ready on arrival.",
        "The TFB light/buoyage tax is due at the first port of entry.",
      ],
      internationalNotes: [
        "Passports must be valid at least 3 months beyond your departure date.",
        "EU-flagged boats should carry evidence of their VAT status.",
        "Non-EU/Schengen crew are registered at the border under the EU Entry/Exit System (EES). ETIAS pre-authorisation is planned but may not yet be required, so check the official EU website for the current rules.",
      ],
      temporaryAdmission: {
        private: "Non-EU-flagged boats get 18 months Temporary Admission (customs).",
        commercial:
          "Temporary Admission (18 months) is for private use only and does not apply to chartered or commercial vessels.",
      },
      commercialUseNotes: [
        `Commercial charter is subject to VAT on the charter fee (Portugal ${Math.round(CASCAIS_VAT_RATE * 100)}%), not the 18-month Temporary Admission private scheme.`,
        "A chartered non-EU-flagged vessel cannot use Temporary Admission; Portuguese customs may request proof of Union goods status (VAT-paid evidence and possibly a T2L document).",
        "Bring the operating entity's commercial insurance and the vessel's registration and licence.",
      ],
      commercialUseDisclaimer:
        "General guidance only, not legal advice. Confirm the rules with Portuguese customs or the marina.",
    },
    preArrivalChecklist: [
      "Fenders and lines ready",
      "We moor stern-to",
      `Hail the marina on VHF channel ${CASCAIS_VHF_CHANNEL}`,
      CASCAIS_OUTSIDE_HOURS,
    ],
    featured: true,
    planImage: {
      src: "/images/cascais-marina-plan.webp",
      alt: "Official plan of Marina de Cascais showing the pontoons and quays",
    },
    // TODO (owner): fill these three from the marina's Google listing.
    // Leave null until real values exist; the block stays hidden.
    googleReviews: { rating: null, reviewCount: null, googleUrl: null },
    // TODO (owner): fill in the fuel dock's current prices per litre and the
    // date they were confirmed. Prices change often, so keep lastUpdated true.
    // Do not estimate them.
    fuelPrices: {
      diesel: { value: null, lastUpdated: null },
      ron95: { value: null, lastUpdated: null },
    },
    // TODO (owner): confirm the busy months and wording with the marina.
    demand: {
      busyMonths: [7, 8],
      note: "Busy period: peak summer, so availability may be tighter.",
    },
    nearby: [
      {
        name: "Boca do Inferno",
        description:
          "Dramatic sea-cliff chasm west of town where the Atlantic surges into the rock.",
      },
      {
        name: "Santa Marta Lighthouse & Museum",
        description:
          "A small lighthouse museum on the waterfront by the marina.",
      },
      {
        name: "The Cidadela",
        description:
          "The historic fortress by the marina, now an art centre with restaurants and galleries.",
      },
      {
        name: "Cascais old town & beaches",
        description:
          "Shops, cafés and sandy beaches a short walk from the pontoons.",
      },
      {
        name: "Train to Lisbon",
        description: "About 40 minutes from Cascais station to central Lisbon.",
      },
    ],
    // TODO (owner): confirm and add the GNR / Polícia Marítima / harbour
    // numbers as further phones entries; unset numbers are never shown.
    emergency: {
      phones: [
        { label: "Marina office", number: "+351 214 824 800" },
        { label: "National emergency", number: "112" },
      ],
      vhf: [
        { channel: CASCAIS_VHF_CHANNEL, label: "Marina de Cascais" },
        { channel: 16, label: "International distress and calling" },
      ],
    },
  },
];

export function getCountries(): {
  slug: string;
  name: string;
  countryCode: string;
}[] {
  const countries = new Map<string, { name: string; countryCode: string }>();
  for (const marina of marinas) {
    if (!countries.has(marina.countrySlug)) {
      countries.set(marina.countrySlug, {
        name: marina.country,
        countryCode: marina.countryCode,
      });
    }
  }
  return Array.from(countries, ([slug, value]) => ({ slug, ...value }));
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
