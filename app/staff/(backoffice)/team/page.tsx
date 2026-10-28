import type { Metadata } from "next";
import Team from "@/features/staff/components/dock/Team";

export const metadata: Metadata = {
  title: "Team - Staff - aldock",
  description: "Staff accounts, roles and access.",
};

export default function Page() {
  return <Team />;
}
