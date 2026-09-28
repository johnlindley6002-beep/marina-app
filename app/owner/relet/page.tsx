import type { Metadata } from "next";
import RelettingWizard from "./RelettingWizard";

export const metadata: Metadata = {
  title: "Make my berth available - aldock",
  description: "Ask the marina to relet your berth while you are away.",
};

export default function RelettingPage() {
  return <RelettingWizard />;
}
