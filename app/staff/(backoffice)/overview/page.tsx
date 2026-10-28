import type { Metadata } from "next";
import Overview from "@/features/staff/components/dock/Overview";

export const metadata: Metadata = {
  title: "Overview - Staff - aldock",
  description: "Today at the marina, for the director.",
};

export default function Page() {
  return <Overview />;
}
