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
  ACCOUNT_DATA_SOURCE,
  SEEDED_PERSONAS,
  DEV_PASSWORD,
  getActivePersonaId,
  getAvailableModes,
  getCurrentUser,
  getMode,
  initialsFor,
  listDevPersonas,
  loadAccount,
  MOCK_CHANGED_EVENT,
  MOCK_STORAGE_KEYS,
  saveProfile as saveAccountProfile,
  setMode as setStoredMode,
  signInAs as mockSignInAs,
  signInWithPassword,
  signOut as mockSignOut,
  signOutAccount,
  updateProfile as mockUpdateProfile,
  type Account,
  type CurrentUser,
  type DevPersona,
  type Mode,
  type ProfileFields,
} from "@/lib/data";
import { createClient } from "@/lib/supabase/client";

type AuthContextValue = {
  ready: boolean;
  user: CurrentUser | null;
  // The signed-in account when it lives in Supabase: the profile and the
  // berths held today. Null on the mock.
  account: Account | null;
  mode: Mode;
  // True only for a user who holds a berth today. A plain guest never does.
  canSwitchMode: boolean;
  setMode: (mode: Mode) => boolean;
  updateProfile: (patch: { name: string; email: string; phone: string }) => Promise<boolean>;
  saveProfileFields: (patch: Partial<ProfileFields>) => Promise<boolean>;
  signOut: () => void;
  // DEV ONLY, used by the dev switcher.
  personas: DevPersona[];
  activePersonaId: string;
  signInAs: (userId: string | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const SIGNED_OUT_PERSONA = "signed-out";

// The signed-in person as the screens know them. Roles come from rows the
// marina controls (a berth holding, a staff membership), never from the person.
function userFromAccount(account: Account): CurrentUser {
  const name = account.profile.fullName.trim() || account.email.split("@")[0] || account.email;
  const roles: CurrentUser["roles"] = ["voyager"];
  if (account.holdings.length > 0) roles.push("owner");
  if (account.staffMarinaIds.length > 0) roles.push("staff");
  return {
    id: account.userId,
    name,
    email: account.email,
    phone: account.profile.phone,
    initials: initialsFor(name),
    roles,
  };
}

const MOCK_PERSONAS = listDevPersonas();

function supabasePersonas(): DevPersona[] {
  return [
    {
      id: SIGNED_OUT_PERSONA,
      userId: null,
      label: "Signed out",
      description: "A visitor with no account",
    },
    ...SEEDED_PERSONAS.map((p) => ({
      id: p.id,
      userId: p.email,
      label: p.label,
      description: p.description,
    })),
  ];
}

// The signed-in person for the whole site. On the mock it is a thin context
// over lib/data and the dev switcher stands in for signing in. On Supabase it
// follows the session cookie, and the profile and berth holdings come from the
// database, so the Guest and Berth holder switch appears only while the marina
// has linked the person to a berth.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [mode, setModeState] = useState<Mode>("guest");
  const [activePersonaId, setActivePersonaId] = useState(SIGNED_OUT_PERSONA);

  const refresh = useCallback(async () => {
    if (ACCOUNT_DATA_SOURCE === "mock") {
      const current = getCurrentUser();
      setUser(current);
      setModeState(getMode(current));
      setActivePersonaId(getActivePersonaId());
      setReady(true);
      return;
    }
    let next: Account | null = null;
    try {
      next = await loadAccount();
    } catch {
      next = null;
    }
    const current = next ? userFromAccount(next) : null;
    setAccount(next);
    setUser(current);
    setModeState(getMode(current));
    setActivePersonaId(
      SEEDED_PERSONAS.find((p) => p.email === next?.email)?.id ?? SIGNED_OUT_PERSONA
    );
    setReady(true);
  }, []);

  useEffect(() => {
    // Reading the session is a subscription to an outside system, which is
    // what an effect is for.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
    function onStorage(event: StorageEvent) {
      if (event.key === null || MOCK_STORAGE_KEYS.includes(event.key)) void refresh();
    }
    const onChange = () => void refresh();
    window.addEventListener(MOCK_CHANGED_EVENT, onChange);
    window.addEventListener("storage", onStorage);
    let unsubscribe = () => {};
    if (ACCOUNT_DATA_SOURCE === "supabase") {
      const { data } = createClient().auth.onAuthStateChange((event) => {
        // The first event only repeats what refresh has just read.
        if (event !== "INITIAL_SESSION") void refresh();
      });
      unsubscribe = () => data.subscription.unsubscribe();
    }
    return () => {
      window.removeEventListener(MOCK_CHANGED_EVENT, onChange);
      window.removeEventListener("storage", onStorage);
      unsubscribe();
    };
  }, [refresh]);

  const saveProfileFields = useCallback(async (patch: Partial<ProfileFields>) => {
    return saveAccountProfile(patch);
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const supabase = ACCOUNT_DATA_SOURCE === "supabase";
    return {
      ready,
      user,
      account,
      mode,
      canSwitchMode: getAvailableModes(user).length > 1,
      setMode: (next) => setStoredMode(user, next),
      updateProfile: async (patch) => {
        if (!user) return false;
        if (!supabase) return mockUpdateProfile(user.id, patch);
        // The sign-in email is not editable: it is how the marina finds the person.
        return saveAccountProfile({ fullName: patch.name, phone: patch.phone });
      },
      saveProfileFields,
      signOut: () => {
        if (supabase) void signOutAccount();
        else mockSignOut();
      },
      personas: supabase ? supabasePersonas() : MOCK_PERSONAS,
      activePersonaId,
      signInAs: (userId) => {
        if (!supabase) {
          mockSignInAs(userId);
          return;
        }
        if (userId === null) {
          void signOutAccount();
          return;
        }
        // In Supabase mode a persona's userId is its sign-in email.
        void signInWithPassword(userId, DEV_PASSWORD);
      },
    };
  }, [ready, user, account, mode, activePersonaId, saveProfileFields]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
