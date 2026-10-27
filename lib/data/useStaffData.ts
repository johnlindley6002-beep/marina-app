"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MOCK_CHANGED_EVENT, MOCK_STORAGE_KEYS } from "@/data/mock/storage";

// The async counterpart of useMock for the staff back office. Reads once, and
// again whenever staff data changes here (every staff write announces itself)
// or, on the mock, in another tab. The value is the fallback until the first
// read finishes. Pass a key that changes when the reader should run again.
export function useStaffData<T>(
  read: () => Promise<T>,
  fallback: T,
  key = ""
): { value: T; ready: boolean } {
  const [value, setValue] = useState<T>(fallback);
  const [ready, setReady] = useState(false);
  const readRef = useRef(read);
  const latest = useRef(0);

  useEffect(() => {
    readRef.current = read;
  });

  const refresh = useCallback(() => {
    // Only the newest read may land, so a slow earlier one cannot win.
    const ticket = ++latest.current;
    void readRef.current().then((next) => {
      if (ticket !== latest.current) return;
      setValue(next);
      setReady(true);
    });
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
  }, [refresh, key]);

  return { value, ready };
}
