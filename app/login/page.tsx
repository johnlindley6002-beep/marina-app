import type { Metadata } from "next";
import { Suspense } from "react";
import LoginContent from "@/features/account/components/LoginContent";

export const metadata: Metadata = {
  title: "Sign in - aldock",
  description: "Sign in to aldock with a link sent to your email.",
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
