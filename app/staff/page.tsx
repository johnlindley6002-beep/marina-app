import type { Metadata } from "next";
import StaffContent from "./StaffContent";

export const metadata: Metadata = {
  title: "Staff area - aldock",
  description: "Marina staff area.",
};

export default function StaffPage() {
  return <StaffContent />;
}
