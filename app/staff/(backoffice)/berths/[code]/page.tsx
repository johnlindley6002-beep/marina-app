import type { Metadata } from "next";
import BerthPageContent from "@/features/staff/components/BerthPageContent";

export const metadata: Metadata = {
  title: "Berth - Staff - aldock",
  description: "A berth's holder, stays, relet offers and history.",
};

export default async function BerthPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <BerthPageContent code={decodeURIComponent(code)} />;
}
