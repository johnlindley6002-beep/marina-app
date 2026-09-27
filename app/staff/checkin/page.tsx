import type { Metadata } from "next";
import CheckInFlow from "./CheckInFlow";

export const metadata: Metadata = {
  title: "Check-in - Staff - aldock",
  description: "Arriving, on site and departing today.",
};

export default function CheckInPage() {
  return <CheckInFlow />;
}
