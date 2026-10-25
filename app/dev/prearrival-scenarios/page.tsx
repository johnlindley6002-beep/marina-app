import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ScenarioLoader from "@/features/dev/components/ScenarioLoader";
import { DEV_TOOLS_ENABLED } from "@/lib/devTools";

export const metadata: Metadata = {
  title: "Pre-arrival scenarios (dev) - aldock",
  robots: { index: false },
};

export default function PreArrivalScenariosPage() {
  if (!DEV_TOOLS_ENABLED) notFound();
  return <ScenarioLoader />;
}
