// Everything here is stored only in this browser (localStorage) and every
// access is wrapped so the UI works when storage is empty or unavailable.

const ENQUIRY_KEY = "aldock-last-enquiry";
const FAVOURITES_KEY = "aldock-favourites";
export const TRIP_CHANGED_EVENT = "aldock-trip-changed";

// Structured, and deliberately free of crew, passport and contact details.
export type LastEnquiry = {
  marinaId: string;
  countrySlug: string;
  marinaName: string;
  savedAt: string;
  arrival: string;
  eta: string;
  departure: string;
  etd: string;
  openEnded: boolean;
  boatName: string;
  vesselType: string;
  loa: string;
  beam: string;
  draft: string;
  flag: string;
  homePort: string;
  berthId: string;
  services: {
    shorePower: boolean;
    amperage: string;
    water: boolean;
    helpMooring: boolean;
    helpSlipping: boolean;
    pumpOut: boolean;
    fuel: boolean;
    laundry: boolean;
  };
};

function notify() {
  try {
    window.dispatchEvent(new Event(TRIP_CHANGED_EVENT));
  } catch {
    // Nothing listening.
  }
}

export function loadLastEnquiry(): LastEnquiry | null {
  try {
    const raw = window.localStorage.getItem(ENQUIRY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.marinaId !== "string") return null;
    return parsed as LastEnquiry;
  } catch {
    return null;
  }
}

export function saveLastEnquiry(enquiry: LastEnquiry): void {
  try {
    window.localStorage.setItem(ENQUIRY_KEY, JSON.stringify(enquiry));
  } catch {
    // Storage unavailable.
  }
  notify();
}

export function clearLastEnquiry(): void {
  try {
    window.localStorage.removeItem(ENQUIRY_KEY);
  } catch {
    // Storage unavailable.
  }
  notify();
}

export type Favourite = {
  marinaId: string;
  countrySlug: string;
  marinaName: string;
  savedAt: string;
};

export function loadFavourites(): Favourite[] {
  try {
    const raw = window.localStorage.getItem(FAVOURITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (f: unknown): f is Favourite =>
        !!f &&
        typeof (f as Favourite).marinaId === "string" &&
        typeof (f as Favourite).countrySlug === "string"
    );
  } catch {
    return [];
  }
}

function saveFavourites(favourites: Favourite[]): void {
  try {
    window.localStorage.setItem(FAVOURITES_KEY, JSON.stringify(favourites));
  } catch {
    // Storage unavailable.
  }
  notify();
}

export function toggleFavourite(
  marina: Omit<Favourite, "savedAt">
): boolean {
  const current = loadFavourites();
  const exists = current.some((f) => f.marinaId === marina.marinaId);
  saveFavourites(
    exists
      ? current.filter((f) => f.marinaId !== marina.marinaId)
      : [...current, { ...marina, savedAt: new Date().toISOString() }]
  );
  return !exists;
}
