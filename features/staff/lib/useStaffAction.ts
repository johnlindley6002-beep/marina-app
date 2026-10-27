"use client";

import { useCallback, useState } from "react";
import { SAVE_FAILED } from "@/lib/data";
import { useStaffText } from "../components/StaffLanguageProvider";

type Result = { ok: true } | { ok: false; error: string };

// Runs one staff write at a time: busy while it saves, then the error (or
// none). Buttons use busy to avoid a second click saving twice. A save that
// failed on the network shows in the staff language; the rules' own messages
// are still English.
export function useStaffAction() {
  const { s } = useStaffText();
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

  // For the Supabase-only screens, whose writes answer true or false.
  const save = useCallback(
    (write: () => Promise<boolean>) =>
      run(async () => ((await write()) ? { ok: true } : { ok: false, error: SAVE_FAILED })),
    [run]
  );

  return {
    busy,
    error: error === SAVE_FAILED ? s.common.saveFailed : error,
    setError,
    run,
    save,
  };
}
