import type { ReactNode } from "react";

// A small outlined status label, the same everywhere a status is shown.
export default function StatusChip({ children }: { children: ReactNode }) {
  return <span className="chip">{children}</span>;
}
