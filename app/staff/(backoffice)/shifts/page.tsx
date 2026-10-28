import type { Metadata } from "next";
import { ShiftPlanner } from "@/features/staff/components/dock/Shifts";

export const metadata: Metadata = {
  title: "Shifts - Staff - aldock",
  description: "Plan the team's shifts.",
};

export default function Page() {
  return <ShiftPlanner />;
}
