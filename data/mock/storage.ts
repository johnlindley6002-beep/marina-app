// Shared plumbing for the mock layer: the localStorage keys, safe read and
// write helpers (never throw), the change event that keeps screens in step,
// and id generation. Nothing here knows about a business domain.

export const MOCK_CHANGED_EVENT = "aldock-mock-changed";
export const SESSION_KEY = "aldock-mock-session";
export const MODE_KEY = "aldock-mode";
export const PROFILE_KEY = "aldock-mock-profiles";
export const RELETTING_KEY = "aldock-mock-reletting";
export const DRAFT_KEY = "aldock-mock-relet-drafts";
export const ENQUIRY_KEY = "aldock-mock-enquiries";
export const OOS_KEY = "aldock-mock-berth-oos";
export const PREARRIVAL_DRAFT_KEY = "aldock-prearrival-drafts";
export const PREARRIVAL_KEY = "aldock-prearrival-checkins";

// ---------------------------------------------------------------------------
// Storage helpers (client only, never throw)
// ---------------------------------------------------------------------------

export function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeJson(key: string, value: unknown): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeKey(key: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Storage blocked: nothing to remove.
  }
}

export function emitChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(MOCK_CHANGED_EVENT));
}

// The storage keys, so a provider can react to changes made in another tab.
export const MOCK_STORAGE_KEYS = [
  SESSION_KEY,
  MODE_KEY,
  PROFILE_KEY,
  RELETTING_KEY,
  DRAFT_KEY,
  ENQUIRY_KEY,
  OOS_KEY,
  PREARRIVAL_DRAFT_KEY,
  PREARRIVAL_KEY,
];

export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
