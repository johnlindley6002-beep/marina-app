import type { Metadata } from "next";
import CustomerList from "@/features/staff/components/customers/CustomerList";

export const metadata: Metadata = {
  title: "Customers - Staff - aldock",
  description: "Berth holders and guests, with their boats and documents.",
};

export default function CustomersPage() {
  return <CustomerList />;
}
