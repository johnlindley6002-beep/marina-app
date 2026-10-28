import type { Metadata } from "next";
import MyJob from "@/features/staff/components/dock/MyJob";

export const metadata: Metadata = {
  title: "My next job - Staff - aldock",
  description: "The job to do now.",
};

export default function Page() {
  return <MyJob />;
}
