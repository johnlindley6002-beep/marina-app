export type BoatProfile = { loa: string; beam: string; draft: string };

export type SavedBoat = {
  id: string;
  name: string;
  type: string;
  loa: string;
  beam: string;
  draft: string;
  flag: string;
  homePort: string;
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
    // Storage unavailable — the UI works without persistence.
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

export function saveBoats(store: BoatStore): void {
  try {
    window.localStorage.setItem(BOATS_KEY, JSON.stringify(store));
  } catch {
    // Storage unavailable — the UI works without persistence.
  }
}

export function newBoatId(): string {
  return `boat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
