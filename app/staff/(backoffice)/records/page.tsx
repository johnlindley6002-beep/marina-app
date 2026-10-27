import { redirect } from "next/navigation";

// Records moved to Customers.
export default function RecordsPage() {
  redirect("/staff/customers");
}
