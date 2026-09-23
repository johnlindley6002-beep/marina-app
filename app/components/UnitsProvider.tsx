"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { unitLabel, type UnitSystem } from "../../lib/units";

type UnitsContextValue = {
  units: UnitSystem;
  setUnits: (units: UnitSystem) => void;
  label: "m" | "ft";
};

const UnitsContext = createContext<UnitsContextValue | null>(null);
const STORAGE_KEY = "aldock-units";

export function UnitsProvider({ children }: { children: ReactNode }) {
  const [units, setUnitsState] = useState<UnitSystem>("metric");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "metric" || stored === "imperial") setUnitsState(stored);
    } catch {
      // Default (metric) stands when storage is unavailable.
    }
  }, []);

  const value = useMemo<UnitsContextValue>(
    () => ({
      units,
      label: unitLabel(units),
      setUnits: (next) => {
        setUnitsState(next);
        try {
          window.localStorage.setItem(STORAGE_KEY, next);
        } catch {
          // Session state still updates.
        }
      },
    }),
    [units]
  );

  return (
    <UnitsContext.Provider value={value}>{children}</UnitsContext.Provider>
  );
}

export function useUnits() {
  const context = useContext(UnitsContext);
  if (!context) throw new Error("useUnits must be used within UnitsProvider");
  return context;
}
