import type { Metadata } from "next";
import RadioLog from "@/features/staff/components/radio/RadioLog";

export const metadata: Metadata = {
  title: "Radio log - Staff - aldock",
  description: "VHF calls and walk-ins at reception.",
};

export default function RadioPage() {
  return <RadioLog />;
}
