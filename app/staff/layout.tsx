import type { Metadata } from "next";
import StaffShell from "@/features/staff/components/StaffShell";
import { StaffLanguageProvider } from "@/features/staff/components/StaffLanguageProvider";
import { StaffSessionProvider } from "@/features/staff/components/StaffSessionProvider";

export const metadata: Metadata = {
  title: "Staff - aldock",
  description: "The marina staff back office.",
};

// The whole /staff/* area sits in one dense shell, separate from the consumer
// app's navigation and art direction. The sign-in page sits here too; every
// other staff page is in (backoffice), behind the staff gate. The shell wraps
// the gate, not the other way round, so the page always has its main landmark
// and skip-link target, signed in or not.
export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <StaffLanguageProvider>
      <StaffSessionProvider>
        <StaffShell>{children}</StaffShell>
      </StaffSessionProvider>
    </StaffLanguageProvider>
  );
}
