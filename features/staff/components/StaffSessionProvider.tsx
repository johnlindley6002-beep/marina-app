"use client";

import { createContext, useContext, type ReactNode } from "react";
import { getStaffSignIn, useStaffData, type StaffSignIn } from "@/lib/data";

type StaffSessionValue = StaffSignIn & { ready: boolean };

const StaffSessionContext = createContext<StaffSessionValue | null>(null);

const NOBODY: StaffSignIn = { session: null, signedIn: false, email: "" };

// Who is using the back office. Re-reads when staff data changes, which
// includes signing out.
export function StaffSessionProvider({ children }: { children: ReactNode }) {
  const { value, ready } = useStaffData(getStaffSignIn, NOBODY);
  return (
    <StaffSessionContext.Provider value={{ ready, ...value }}>
      {children}
    </StaffSessionContext.Provider>
  );
}

export function useStaffSession(): StaffSessionValue {
  const ctx = useContext(StaffSessionContext);
  if (!ctx) throw new Error("useStaffSession must be used inside StaffSessionProvider");
  return ctx;
}

// The id the staff data functions take. Null until the session has loaded.
export function useStaffId(): string | null {
  return useStaffSession().session?.userId ?? null;
}
