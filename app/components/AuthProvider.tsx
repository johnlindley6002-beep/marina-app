"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getActivePersonaId,
  getAvailableModes,
  getCurrentUser,
  getMode,
  listDevPersonas,
  MOCK_CHANGED_EVENT,
  MOCK_STORAGE_KEYS,
  setMode as setStoredMode,
  signInAs as mockSignInAs,
  signOut as mockSignOut,
  updateProfile as mockUpdateProfile,
  type CurrentUser,
  type DevPersona,
  type Mode,
} from "../../lib/mockData";

type AuthContextValue = {
  ready: boolean;
  user: CurrentUser | null;
  mode: Mode;
  // True only for a user who holds the owner role. A plain voyager never does.
  canSwitchMode: boolean;
  setMode: (mode: Mode) => boolean;
  updateProfile: (patch: { name: string; email: string; phone: string }) => boolean;
  signOut: () => void;
  // MOCK / DEV ONLY, used by the dev switcher.
  personas: DevPersona[];
  activePersonaId: string;
  signInAs: (userId: string | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// MOCK. A thin context over lib/mockData so screens never touch the mock
// layer's storage directly. It re-reads whenever the mock data changes here or
// in another tab.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [mode, setModeState] = useState<Mode>("guest");
  const [activePersonaId, setActivePersonaId] = useState("signed-out");

  const refresh = useCallback(() => {
    const current = getCurrentUser();
    setUser(current);
    setModeState(getMode(current));
    setActivePersonaId(getActivePersonaId());
    setReady(true);
  }, []);

  useEffect(() => {
    refresh();
    function onStorage(event: StorageEvent) {
      if (event.key === null || MOCK_STORAGE_KEYS.includes(event.key)) refresh();
    }
    window.addEventListener(MOCK_CHANGED_EVENT, refresh);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(MOCK_CHANGED_EVENT, refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, [refresh]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      user,
      mode,
      canSwitchMode: getAvailableModes(user).length > 1,
      setMode: (next) => setStoredMode(user, next),
      updateProfile: (patch) => (user ? mockUpdateProfile(user.id, patch) : false),
      signOut: mockSignOut,
      personas: listDevPersonas(),
      activePersonaId,
      signInAs: mockSignInAs,
    }),
    [ready, user, mode, activePersonaId]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
