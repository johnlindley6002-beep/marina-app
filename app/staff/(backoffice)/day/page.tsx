import type { Metadata } from "next";
import DayPlan from "@/features/staff/components/dock/DayPlan";

export const metadata: Metadata = {
  title: "Day plan - Staff - aldock",
  description: "The dockmaster's plan of the day.",
};

export default function Page() {
  return <DayPlan />;
}
