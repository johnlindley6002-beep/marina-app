import { redirect } from "next/navigation";

// Arrivals is the home screen of the staff back office.
export default function StaffIndexPage() {
  redirect("/staff/arrivals");
}
