"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { siteConfig } from "../../data/site";
import type { Role } from "../../lib/mockData";
import { useAuth } from "./AuthProvider";

function Message({ title, body }: { title: string; body: string }) {
  return (
    <div className="section px-5 md:px-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="type-heading type-h2 text-ink">{title}</h1>
        <p className="measure mt-4 text-lg text-ink/75">{body}</p>
        <Link
          href="/marinas"
          className="mt-6 inline-flex min-h-11 items-center text-ink underline decoration-brass decoration-2 underline-offset-[6px]"
        >
          Back to marinas
        </Link>
      </div>
    </div>
  );
}

// Shows its children only to a signed-in user who holds the required role, and
// otherwise a short explanation. MOCK: the real backend must also refuse the
// data itself, since hiding a screen is not security.
export default function RoleGate({
  role,
  children,
}: {
  role?: Role;
  children: ReactNode;
}) {
  const { ready, user } = useAuth();

  if (!ready) {
    // Reserves the height so nothing jumps when the account loads.
    return <div className="min-h-[24rem]" aria-hidden="true" />;
  }
  if (!user) {
    return (
      <Message
        title="Sign in to continue"
        body={
          siteConfig.mockMode
            ? siteConfig.accounts.signedOut
            : "You are not signed in."
        }
      />
    );
  }
  if (role && !user.roles.includes(role)) {
    return (
      <Message
        title={role === "owner" ? "Owner mode is not available" : "Staff area"}
        body={
          role === "owner"
            ? siteConfig.accounts.ownerLocked
            : siteConfig.accounts.staffLocked
        }
      />
    );
  }
  return <>{children}</>;
}
