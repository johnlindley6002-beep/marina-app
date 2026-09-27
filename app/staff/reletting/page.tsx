import type { Metadata } from "next";
import RelettingQueue from "./RelettingQueue";

export const metadata: Metadata = {
  title: "Reletting - Staff - aldock",
  description: "Owner absence requests waiting for the marina's consent.",
};

export default function RelettingPage() {
  return <RelettingQueue />;
}
