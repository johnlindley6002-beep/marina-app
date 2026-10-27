import type { Metadata } from "next";
import CheckInScreen from "@/features/staff/components/reception/CheckInScreen";

export const metadata: Metadata = {
  title: "Check-in - Staff - aldock",
  description: "One boat's check-in at the desk.",
};

export default async function CheckInPage({ params }: { params: Promise<{ arrivalId: string }> }) {
  const { arrivalId } = await params;
  return <CheckInScreen id={arrivalId} />;
}
