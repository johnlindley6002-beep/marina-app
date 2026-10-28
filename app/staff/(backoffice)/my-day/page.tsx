import type { Metadata } from "next";
import MyDay from "@/features/staff/components/dock/MyDay";

export const metadata: Metadata = {
  title: "My day - Staff - aldock",
  description: "Today's jobs.",
};

export default function Page() {
  return <MyDay />;
}
