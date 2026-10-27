"use client";

import type { ReactNode } from "react";
import { STAFF_DATA_SOURCE } from "@/lib/data";
import { useStaffText } from "./StaffLanguageProvider";

// The newer back office screens read the marina's database directly and have
// no browser mock. On the mock data (the demo and the end-to-end tests) they
// show this note instead, under their own heading.
export default function SupabaseOnly({ title, children }: { title: string; children: ReactNode }) {
  const { s } = useStaffText();
  if (STAFF_DATA_SOURCE !== "mock") return <>{children}</>;
  return (
    <div>
      <h1 className="type-heading type-h2 text-ink">{title}</h1>
      <div className="staff-panel mt-4 max-w-xl">
        <p className="font-medium text-ink">{s.common.needsSupabaseTitle}</p>
        <p className="mt-1 text-sm text-ink-soft">{s.common.needsSupabase}</p>
      </div>
    </div>
  );
}
