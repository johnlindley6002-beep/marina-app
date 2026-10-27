import type { Metadata } from "next";
import RelettingQueue from "@/features/staff/components/RelettingQueue";

export const metadata: Metadata = {
  title: "Reletting - Staff - aldock",
  description: "Berth holder absence requests waiting for the marina's consent.",
};

export default function RelettingPage() {
  return <RelettingQueue />;
}
