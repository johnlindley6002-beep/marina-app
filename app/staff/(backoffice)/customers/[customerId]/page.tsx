import type { Metadata } from "next";
import CustomerDetail from "@/features/staff/components/customers/CustomerDetail";

export const metadata: Metadata = {
  title: "Customer - Staff - aldock",
  description: "A customer's boats, right of use, documents and stays.",
};

export default async function CustomerPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = await params;
  return <CustomerDetail id={customerId} />;
}
