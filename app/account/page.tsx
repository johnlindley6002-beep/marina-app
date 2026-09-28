import type { Metadata } from "next";
import AccountContent from "./AccountContent";

export const metadata: Metadata = {
  title: "Account - aldock",
  description: "Your profile and roles on aldock.",
};

export default function AccountPage() {
  return <AccountContent />;
}
