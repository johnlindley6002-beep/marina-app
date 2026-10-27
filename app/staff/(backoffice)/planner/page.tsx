import type { Metadata } from "next";
import BerthPlanner from "@/features/staff/components/planner/BerthPlanner";

export const metadata: Metadata = {
  title: "Berth planner - Staff - aldock",
  description: "Berths by day for the next fourteen days.",
};

export default function PlannerPage() {
  return <BerthPlanner />;
}
