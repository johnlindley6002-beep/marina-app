"use client";

import { useCallback, useState } from "react";

type Result = { ok: true } | { ok: false; error: string };

// Runs one staff write at a time: busy while it saves, then the error (or
// none). Buttons use busy to avoid a second click saving twice.
export function useStaffAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (action: () => Promise<Result>): Promise<boolean> => {
    setBusy(true);
    try {
      const result = await action();
      setError(result.ok ? null : result.error);
      return result.ok;
    } finally {
      setBusy(false);
    }
  }, []);

  return { busy, error, setError, run };
}
