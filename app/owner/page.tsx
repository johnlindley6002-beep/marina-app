import type { Metadata } from "next";
import OwnerContent from "./OwnerContent";

export const metadata: Metadata = {
  title: "My berth - aldock",
  description: "The berth you hold and the boat the marina has on file.",
};

export default function OwnerPage() {
  return <OwnerContent />;
}
