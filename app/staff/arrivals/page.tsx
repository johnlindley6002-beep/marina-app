import type { Metadata } from "next";
import ArrivalsBoard from "@/features/staff/components/ArrivalsBoard";

export const metadata: Metadata = {
  title: "Arrivals - Staff - aldock",
  description: "Today and upcoming arrivals and departures.",
};

export default function ArrivalsPage() {
  return <ArrivalsBoard />;
}
