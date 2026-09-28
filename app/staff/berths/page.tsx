import type { Metadata } from "next";
import BerthOperations from "./BerthOperations";

export const metadata: Metadata = {
  title: "Berth map - Staff - aldock",
  description: "Live berth occupancy: assign, reassign or mark out of service.",
};

export default function BerthsPage() {
  return <BerthOperations />;
}
