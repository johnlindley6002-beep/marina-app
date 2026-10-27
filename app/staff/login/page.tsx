import type { Metadata } from "next";
import { Suspense } from "react";
import StaffLogin from "@/features/staff/components/StaffLogin";

export const metadata: Metadata = {
  title: "Staff sign-in - aldock",
  description: "Sign in to the marina staff back office.",
};

export default function StaffLoginPage() {
  return (
    <Suspense>
      <StaffLogin />
    </Suspense>
  );
}
