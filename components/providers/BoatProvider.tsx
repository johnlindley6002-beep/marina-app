"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ACCOUNT_DATA_SOURCE, deleteBoat, listBoats, upsertBoat } from "@/lib/data";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  BOATS_STORAGE_KEY,
  clearAllSavedData,
  EMPTY_SKIPPER,
  isStorageAvailable,
  loadBoats,
  loadSkipper,
  newBoatId,
  saveBoatProfile,
  saveBoats,
  saveSkipper as persistSkipper,
  SKIPPER_STORAGE_KEY,
  type BoatStore,
  type SavedBoat,
  type Skipper,
} from "@/features/my-boat/lib/boatProfile";
import { TRIP_CHANGED_EVENT } from "@/features/marina/lib/tripStore";

export type BoatInput = Omit<SavedBoat, "id"> & { id?: string };

type BoatContextValue = {
  ready: boolean;
  storageOk: boolean;
  // True while the boats and skipper details live in the signed-in account
  // rather than in this browser.
  inAccount: boolean;
  // True when the last save to the account failed.
  syncFailed: boolean;
  boats: SavedBoat[];
  activeBoat: SavedBoat | null;
  setActiveId: (id: string | null) => void;
  // Creates a boat, or updates it when an id is given. The saved boat becomes active.
  saveBoat: (input: BoatInput) => SavedBoat;
  removeBoat: (id: string) => void;
  skipper: Skipper;
  saveSkipper: (skipper: Skipper) => void;
  clearAll: () => void;
};

const BoatContext = createContext<BoatContextValue | null>(null);

const ACTIVE_BOAT_KEY = "aldock-active-boat";
// Typing in a form saves on every key, so account writes wait for a pause.
const SAVE_DELAY_MS = 500;

function readActiveId(): string | null {
  try {
    return window.localStorage.getItem(ACTIVE_BOAT_KEY);
  } catch {
    return null;
  }
}

function writeActiveId(id: string | null) {
  try {
    if (id) window.localStorage.setItem(ACTIVE_BOAT_KEY, id);
    else window.localStorage.removeItem(ACTIVE_BOAT_KEY);
  } catch {
    // Storage unavailable: the first boat is active next time.
  }
}

// One place that owns the saved boats, the active boat and the skipper's
// details, so every form pre-fills from the same data and stays in step.
// Signed out (or on the mock) they live in this browser, including across
// tabs. Signed in, they live in the person's account, so they follow them to
// every device; boats saved in this browser before signing in move into the
// account the first time.
export function BoatProvider({ children }: { children: ReactNode }) {
  const { ready: authReady, user, account, saveProfileFields } = useAuth();
  const userId = user?.id ?? null;
  const inAccount = ACCOUNT_DATA_SOURCE === "supabase" && userId !== null;

  const [ready, setReady] = useState(false);
  const [storageOk, setStorageOk] = useState(true);
  const [syncFailed, setSyncFailed] = useState(false);
  const [store, setStore] = useState<BoatStore>({ boats: [], activeId: null });
  const [skipper, setSkipper] = useState<Skipper>({ ...EMPTY_SKIPPER });
  const storeRef = useRef(store);
  const inAccountRef = useRef(inAccount);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const accountRef = useRef(account);

  useEffect(() => {
    inAccountRef.current = inAccount;
    accountRef.current = account;
  });

  const reload = useCallback(() => {
    const next = loadBoats();
    storeRef.current = next;
    setStore(next);
    setSkipper(loadSkipper());
  }, []);

  // In this browser: signed out, or the mock.
  useEffect(() => {
    if (!authReady || inAccount) return;
    // Reading storage is a subscription to an outside system, which is what an
    // effect is for.
    /* eslint-disable react-hooks/set-state-in-effect */
    reload();
    setStorageOk(isStorageAvailable());
    setSyncFailed(false);
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */

    function onStorage(event: StorageEvent) {
      if (
        event.key === null ||
        event.key === BOATS_STORAGE_KEY ||
        event.key === SKIPPER_STORAGE_KEY
      ) {
        reload();
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [authReady, inAccount, reload]);

  // In the account: load it once for each person who signs in.
  useEffect(() => {
    if (!authReady || !inAccount || !userId) return;
    let cancelled = false;
    async function load() {
      let failed = false;
      let boats = await listBoats();
      if (boats === null) {
        failed = true;
        boats = [];
      } else if (boats.length === 0) {
        // The first sign in: move this browser's boats into the account.
        const local = loadBoats().boats;
        if (local.length > 0) {
          const moved = local.map((b) => ({ ...b, id: newBoatId() }));
          const saved = await Promise.all(moved.map(upsertBoat));
          if (saved.every(Boolean)) {
            saveBoats({ boats: [], activeId: null });
            boats = moved;
          } else {
            failed = true;
          }
        }
      }
      if (cancelled) return;
      const wanted = readActiveId();
      const activeId = boats.find((b) => b.id === wanted)?.id ?? boats[0]?.id ?? null;
      storeRef.current = { boats, activeId };
      setStore(storeRef.current);
      const profile = accountRef.current?.profile;
      setSkipper({
        name: profile?.fullName ?? "",
        phone: profile?.phone ?? "",
        email: accountRef.current?.email ?? "",
      });
      setStorageOk(true);
      setSyncFailed(failed);
      setReady(true);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [authReady, inAccount, userId]);

  // Runs a save for the account after a pause in typing.
  const later = useCallback((key: string, save: () => Promise<boolean>) => {
    const pending = timers.current.get(key);
    if (pending) clearTimeout(pending);
    timers.current.set(
      key,
      setTimeout(() => {
        timers.current.delete(key);
        void save().then((ok) => setSyncFailed(!ok));
      }, SAVE_DELAY_MS)
    );
  }, []);

  const commit = useCallback((next: BoatStore) => {
    storeRef.current = next;
    setStore(next);
    if (inAccountRef.current) writeActiveId(next.activeId);
    else if (!saveBoats(next)) setStorageOk(false);
  }, []);

  const syncWorkingDimensions = useCallback((boat: SavedBoat | undefined) => {
    if (boat) {
      saveBoatProfile({ loa: boat.loa, beam: boat.beam, draft: boat.draft });
    }
  }, []);

  const setActiveId = useCallback(
    (id: string | null) => {
      const current = storeRef.current;
      commit({ boats: current.boats, activeId: id });
      syncWorkingDimensions(current.boats.find((b) => b.id === id));
    },
    [commit, syncWorkingDimensions]
  );

  const saveBoat = useCallback(
    (input: BoatInput): SavedBoat => {
      const current = storeRef.current;
      const boat: SavedBoat = { ...input, id: input.id ?? newBoatId() };
      const exists = current.boats.some((b) => b.id === boat.id);
      commit({
        boats: exists
          ? current.boats.map((b) => (b.id === boat.id ? boat : b))
          : [...current.boats, boat],
        activeId: boat.id,
      });
      syncWorkingDimensions(boat);
      if (inAccountRef.current) later(`boat:${boat.id}`, () => upsertBoat(boat));
      return boat;
    },
    [commit, later, syncWorkingDimensions]
  );

  const removeBoat = useCallback(
    (id: string) => {
      const current = storeRef.current;
      const boats = current.boats.filter((b) => b.id !== id);
      const activeId = current.activeId === id ? (boats[0]?.id ?? null) : current.activeId;
      commit({ boats, activeId });
      if (current.activeId === id) {
        syncWorkingDimensions(boats.find((b) => b.id === activeId));
      }
      if (inAccountRef.current) {
        const pending = timers.current.get(`boat:${id}`);
        if (pending) clearTimeout(pending);
        timers.current.delete(`boat:${id}`);
        void deleteBoat(id).then((ok) => setSyncFailed(!ok));
      }
    },
    [commit, syncWorkingDimensions]
  );

  const saveSkipper = useCallback(
    (next: Skipper) => {
      setSkipper(next);
      if (inAccountRef.current) {
        // The sign-in email stays as it is; the marina finds the person by it.
        later("skipper", () => saveProfileFields({ fullName: next.name, phone: next.phone }));
      } else if (!persistSkipper(next)) {
        setStorageOk(false);
      }
    },
    [later, saveProfileFields]
  );

  const clearAll = useCallback(() => {
    const ids = storeRef.current.boats.map((b) => b.id);
    clearAllSavedData();
    writeActiveId(null);
    storeRef.current = { boats: [], activeId: null };
    setStore(storeRef.current);
    setSkipper({
      ...EMPTY_SKIPPER,
      email: inAccountRef.current ? (accountRef.current?.email ?? "") : "",
    });
    if (inAccountRef.current) {
      void Promise.all(ids.map(deleteBoat)).then((all) => setSyncFailed(!all.every(Boolean)));
    }
    try {
      window.dispatchEvent(new Event(TRIP_CHANGED_EVENT));
    } catch {
      // Nothing listening.
    }
  }, []);

  const value = useMemo<BoatContextValue>(
    () => ({
      ready,
      storageOk,
      inAccount,
      syncFailed,
      boats: store.boats,
      activeBoat: store.boats.find((b) => b.id === store.activeId) ?? null,
      setActiveId,
      saveBoat,
      removeBoat,
      skipper,
      saveSkipper,
      clearAll,
    }),
    [
      ready,
      storageOk,
      inAccount,
      syncFailed,
      store,
      skipper,
      setActiveId,
      saveBoat,
      removeBoat,
      saveSkipper,
      clearAll,
    ]
  );

  return <BoatContext.Provider value={value}>{children}</BoatContext.Provider>;
}

export function useBoats() {
  const context = useContext(BoatContext);
  if (!context) throw new Error("useBoats must be used within BoatProvider");
  return context;
}
