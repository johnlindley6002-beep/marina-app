import type { Metadata } from "next";
import Staffing from "@/features/staff/components/dock/Staffing";

export const metadata: Metadata = {
  title: "Staffing - Staff - aldock",
  description: "Workload against people on shift.",
};

export default function Page() {
  return <Staffing />;
}
