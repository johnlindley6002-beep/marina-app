import type { Metadata } from "next";
import RoleGate from "../components/RoleGate";
import StaffShell from "./StaffShell";

export const metadata: Metadata = {
  title: "Staff - aldock",
  description: "The marina staff back office.",
};

// The whole /staff/* area sits behind one role gate and one dense shell,
// separate from the consumer app's navigation and art direction. The shell
// wraps the gate, not the other way round, so the page always has its main
// landmark and skip-link target, signed in or not.
export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StaffShell>
      <RoleGate role="staff">{children}</RoleGate>
    </StaffShell>
  );
}
