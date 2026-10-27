import { redirect } from "next/navigation";

// Check-in moved to Reception.
export default function CheckInPage() {
  redirect("/staff/reception");
}
