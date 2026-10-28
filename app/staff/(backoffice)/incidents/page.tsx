import type { Metadata } from "next";
import Incidents from "@/features/staff/components/dock/Incidents";

export const metadata: Metadata = {
  title: "Incident report - Staff - aldock",
  description: "Report an incident.",
};

export default function Page() {
  return <Incidents />;
}
