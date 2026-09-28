"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MOCK_CHANGED_EVENT, MOCK_STORAGE_KEYS } from "./mockData";

// MOCK. Reads a value from the mock data layer and reads it again whenever the
// mock data changes, here or in another tab, so an owner's screen updates when
// staff act. The value is the fallback until the first client read, which keeps
// server and client output identical. Pass a key (for example the user's id)
// that changes when the reader should be run again.
export function useMock<T>(
  read: () => T,
  fallback: T,
  key = ""
): { value: T; ready: boolean } {
  const [value, setValue] = useState<T>(fallback);
  const [ready, setReady] = useState(false);
  const readRef = useRef(read);

  useEffect(() => {
    readRef.current = read;
  });

  const refresh = useCallback(() => {
    setValue(readRef.current());
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
  }, [refresh, key]);

  return { value, ready };
}
