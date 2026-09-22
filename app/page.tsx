import type { Metadata } from "next";
import HomeContent from "./components/HomeContent";

export const metadata: Metadata = {
  title: "aldock — Marina bookings, simplified",
  description: "Find and book a berth in Portugal's marinas.",
  openGraph: {
    title: "aldock — Marina bookings, simplified",
    description: "Find and book a berth in Portugal's marinas.",
    images: ["/images/cascais-marina-plan.webp"],
  },
};

export default function Home() {
  return <HomeContent />;
}
