export type BoatProfile = { loa: string; beam: string; draft: string };

export type BoatDocuments = {
  registrationNumber: string;
  insuranceProvider: string;
  insurancePolicy: string;
  insuranceExpiry: string;
  competenceCertificate: string;
  vhfLicence: string;
};

export const EMPTY_DOCUMENTS: BoatDocuments = {
  registrationNumber: "",
  insuranceProvider: "",
  insurancePolicy: "",
  insuranceExpiry: "",
  competenceCertificate: "",
  vhfLicence: "",
};

export type SavedBoat = {
  id: string;
  name: string;
  type: string;
  loa: string;
  beam: string;
  draft: string;
  flag: string;
  homePort: string;
  documents?: BoatDocuments;
};

export type BoatStore = { boats: SavedBoat[]; activeId: string | null };

const PROFILE_KEY = "aldock-boat-profile";
const BOATS_KEY = "aldock-boats";
const EMPTY_PROFILE: BoatProfile = { loa: "", beam: "", draft: "" };

// The "working" dimensions shared by the browse filters and the fit check.
// Falls back to the active saved boat when nothing has been typed yet.
export function loadBoatProfile(): BoatProfile {
  let profile: BoatProfile = { ...EMPTY_PROFILE };
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      profile = {
        loa: typeof parsed.loa === "string" ? parsed.loa : "",
        beam: typeof parsed.beam === "string" ? parsed.beam : "",
        draft: typeof parsed.draft === "string" ? parsed.draft : "",
      };
    }
  } catch {
    // Fall through to the empty profile.
  }
  if (profile.loa || profile.beam || profile.draft) return profile;
  const { boats, activeId } = loadBoats();
  const active = boats.find((b) => b.id === activeId);
  return active
    ? { loa: active.loa, beam: active.beam, draft: active.draft }
    : profile;
}

export function saveBoatProfile(profile: BoatProfile): void {
  try {
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // Storage unavailable: the UI works without persistence.
  }
}

const str = (value: unknown): string => (typeof value === "string" ? value : "");

export function loadBoats(): BoatStore {
  try {
    const raw = window.localStorage.getItem(BOATS_KEY);
    if (!raw) return { boats: [], activeId: null };
    const parsed = JSON.parse(raw);
    const boats: SavedBoat[] = Array.isArray(parsed.boats)
      ? parsed.boats
          .filter((b: unknown) => b && typeof (b as SavedBoat).id === "string")
          .map((b: SavedBoat) => ({
            id: b.id,
            name: str(b.name),
            type: str(b.type),
            loa: str(b.loa),
            beam: str(b.beam),
            draft: str(b.draft),
            flag: str(b.flag),
            homePort: str(b.homePort),
            documents: {
              registrationNumber: str(b.documents?.registrationNumber),
              insuranceProvider: str(b.documents?.insuranceProvider),
              insurancePolicy: str(b.documents?.insurancePolicy),
              insuranceExpiry: str(b.documents?.insuranceExpiry),
              competenceCertificate: str(b.documents?.competenceCertificate),
              vhfLicence: str(b.documents?.vhfLicence),
            },
          }))
      : [];
    const activeId =
      typeof parsed.activeId === "string" &&
      boats.some((b) => b.id === parsed.activeId)
        ? parsed.activeId
        : null;
    return { boats, activeId };
  } catch {
    return { boats: [], activeId: null };
  }
}

// Returns false when the browser refuses to store (private mode, blocked
// storage), so callers can tell the visitor changes will not be kept.
export function saveBoats(store: BoatStore): boolean {
  try {
    window.localStorage.setItem(BOATS_KEY, JSON.stringify(store));
    return true;
  } catch {
    return false;
  }
}

export const BOATS_STORAGE_KEY = BOATS_KEY;
export const PROFILE_STORAGE_KEY = PROFILE_KEY;

// The skipper's own contact details, stored once for every enquiry. Optional,
// and only written when the visitor asks for it.
export type Skipper = { name: string; phone: string; email: string };
export const EMPTY_SKIPPER: Skipper = { name: "", phone: "", email: "" };
const SKIPPER_KEY = "aldock-skipper";
export const SKIPPER_STORAGE_KEY = SKIPPER_KEY;

export function loadSkipper(): Skipper {
  try {
    const raw = window.localStorage.getItem(SKIPPER_KEY);
    if (!raw) return { ...EMPTY_SKIPPER };
    const parsed = JSON.parse(raw);
    return {
      name: str(parsed.name),
      phone: str(parsed.phone),
      email: str(parsed.email),
    };
  } catch {
    return { ...EMPTY_SKIPPER };
  }
}

export function saveSkipper(skipper: Skipper): boolean {
  try {
    window.localStorage.setItem(SKIPPER_KEY, JSON.stringify(skipper));
    return true;
  } catch {
    return false;
  }
}

export function isStorageAvailable(): boolean {
  try {
    const probe = "aldock-storage-probe";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

// Removes everything the site has saved about the visitor on this device:
// boats and documents, skipper details, saved marinas and the last enquiry.
// Display preferences (units, language) are kept.
export function clearAllSavedData(): void {
  const keys = [
    BOATS_KEY,
    PROFILE_KEY,
    SKIPPER_KEY,
    "aldock-favourites",
    "aldock-last-enquiry",
  ];
  for (const key of keys) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Nothing to remove if storage is unavailable.
    }
  }
}

export function newBoatId(): string {
  return `boat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
