import type { Metadata } from "next";
import Tonight from "@/features/staff/components/dock/Tonight";

export const metadata: Metadata = {
  title: "Tonight - Staff - aldock",
  description: "The night watch's list.",
};

export default function Page() {
  return <Tonight />;
}
