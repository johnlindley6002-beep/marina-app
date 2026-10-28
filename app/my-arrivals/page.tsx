import type { Metadata } from "next";
import MyArrivalsContent from "@/features/account/components/MyArrivalsContent";

export const metadata: Metadata = {
  title: "My arrivals - aldock",
  description: "Your berth requests and where each one stands.",
};

export default function MyArrivalsPage() {
  return <MyArrivalsContent />;
}
