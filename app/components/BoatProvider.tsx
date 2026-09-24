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
} from "../../lib/boatProfile";
import { TRIP_CHANGED_EVENT } from "../../lib/tripStore";

export type BoatInput = Omit<SavedBoat, "id"> & { id?: string };

type BoatContextValue = {
  ready: boolean;
  storageOk: boolean;
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

// One place that owns the saved boats, the active boat and the skipper's
// details, so every form pre-fills from the same data and stays in step,
// including across browser tabs.
export function BoatProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [storageOk, setStorageOk] = useState(true);
  const [store, setStore] = useState<BoatStore>({ boats: [], activeId: null });
  const [skipper, setSkipper] = useState<Skipper>({ ...EMPTY_SKIPPER });
  const storeRef = useRef(store);

  const reload = useCallback(() => {
    const next = loadBoats();
    storeRef.current = next;
    setStore(next);
    setSkipper(loadSkipper());
  }, []);

  useEffect(() => {
    reload();
    setStorageOk(isStorageAvailable());
    setReady(true);

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
  }, [reload]);

  const commit = useCallback((next: BoatStore) => {
    storeRef.current = next;
    setStore(next);
    if (!saveBoats(next)) setStorageOk(false);
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
      return boat;
    },
    [commit, syncWorkingDimensions]
  );

  const removeBoat = useCallback(
    (id: string) => {
      const current = storeRef.current;
      const boats = current.boats.filter((b) => b.id !== id);
      const activeId =
        current.activeId === id ? (boats[0]?.id ?? null) : current.activeId;
      commit({ boats, activeId });
      if (current.activeId === id) {
        syncWorkingDimensions(boats.find((b) => b.id === activeId));
      }
    },
    [commit, syncWorkingDimensions]
  );

  const saveSkipper = useCallback((next: Skipper) => {
    setSkipper(next);
    if (!persistSkipper(next)) setStorageOk(false);
  }, []);

  const clearAll = useCallback(() => {
    clearAllSavedData();
    storeRef.current = { boats: [], activeId: null };
    setStore(storeRef.current);
    setSkipper({ ...EMPTY_SKIPPER });
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
