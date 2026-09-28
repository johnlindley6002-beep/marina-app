import type { Metadata } from "next";
import MyBoatContent from "./MyBoatContent";

export const metadata: Metadata = {
  title: "My boat - aldock",
  description:
    "Save your boat, documents and favourite marinas on this device so every form fills itself in.",
};

export default function MyBoatPage() {
  return <MyBoatContent />;
}
