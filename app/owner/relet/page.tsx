import type { Metadata } from "next";
import RelettingWizard from "@/features/owner/components/RelettingWizard";

export const metadata: Metadata = {
  title: "Offer my berth - aldock",
  description: "Ask the marina to relet your berth while you are away.",
};

export default function RelettingPage() {
  return <RelettingWizard />;
}
