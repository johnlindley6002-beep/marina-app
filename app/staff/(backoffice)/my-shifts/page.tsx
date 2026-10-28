import type { Metadata } from "next";
import { MyShifts } from "@/features/staff/components/dock/Shifts";

export const metadata: Metadata = {
  title: "My shifts - Staff - aldock",
  description: "Your upcoming shifts.",
};

export default function Page() {
  return <MyShifts />;
}
