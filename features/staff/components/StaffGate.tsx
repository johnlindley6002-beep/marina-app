"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import RoleGate from "@/components/layout/RoleGate";
import { useStaffText } from "./StaffLanguageProvider";
import { signOutStaff, STAFF_DATA_SOURCE } from "@/lib/data";
import { useStaffSession } from "./StaffSessionProvider";

// Shows the back office only to signed-in staff of a marina. Signed out, it
// goes to the sign-in page. This hides screens only: row level security is
// what refuses the data. On the mock data (the end-to-end tests) the dev
// persona gate applies, as before.
export default function StaffGate({ children }: { children: ReactNode }) {
  const { ready, session, signedIn, email } = useStaffSession();
  const router = useRouter();
  const { s } = useStaffText();
  const copy = s.login;
  const supabase = STAFF_DATA_SOURCE === "supabase";

  useEffect(() => {
    if (supabase && ready && !signedIn) router.replace("/staff/login");
  }, [supabase, ready, signedIn, router]);

  if (!supabase) return <RoleGate role="staff">{children}</RoleGate>;

  if (!ready || !signedIn) {
    // Reserves the height so nothing jumps while the session loads.
    return <div className="min-h-[24rem]" aria-hidden="true" />;
  }
  if (!session) {
    return (
      <div className="page-reading">
        <h1 className="type-heading type-h2 text-ink">{copy.notStaffTitle}</h1>
        <p className="measure mt-2 text-ink-soft">{copy.notStaff(email)}</p>
        <button
          type="button"
          onClick={async () => {
            await signOutStaff();
            router.replace("/staff/login");
          }}
          className="btn-quiet mt-6"
        >
          {s.shell.signOut}
        </button>
      </div>
    );
  }
  return <>{children}</>;
}
