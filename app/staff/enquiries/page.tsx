import type { Metadata } from "next";
import EnquiryInbox from "./EnquiryInbox";

export const metadata: Metadata = {
  title: "Enquiries - Staff - aldock",
  description: "Incoming berth requests, approved or declined in real time.",
};

export default function EnquiriesPage() {
  return <EnquiryInbox />;
}
