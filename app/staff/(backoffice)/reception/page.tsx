import type { Metadata } from "next";
import ReceptionList from "@/features/staff/components/reception/ReceptionList";

export const metadata: Metadata = {
  title: "Reception - Staff - aldock",
  description: "Check boats in and out.",
};

export default function ReceptionPage() {
  return <ReceptionList />;
}
