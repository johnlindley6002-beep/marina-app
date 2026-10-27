import type { Metadata } from "next";
import RecordsBrowser from "@/features/staff/components/RecordsBrowser";

export const metadata: Metadata = {
  title: "Records - Staff - aldock",
  description: "Boats, berths and customers, tied together.",
};

export default function RecordsPage() {
  return <RecordsBrowser />;
}
