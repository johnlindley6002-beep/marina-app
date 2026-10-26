"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { DEV_TOOLS_ENABLED } from "@/lib/devTools";
import type { Role } from "@/lib/data";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";

function Message({ title, body }: { title: string; body: string }) {
  const { t } = useLanguage();
  const back = t.chrome.gate.back;
  return (
    <div className="section">
      <div className="page-column page-reading">
        <h1 className="type-title text-ink">{title}</h1>
        <p className="measure mt-4 text-lg text-ink-soft">{body}</p>
        <Link href="/marinas" className="btn-quiet mt-6">
          {back}
        </Link>
      </div>
    </div>
  );
}

// Shows its children only to a signed-in user who holds the required role, and
// otherwise a short explanation. MOCK: the real backend must also refuse the
// data itself, since hiding a screen is not security.
export default function RoleGate({ role, children }: { role?: Role; children: ReactNode }) {
  const { ready, user } = useAuth();
  const { t } = useLanguage();
  const gate = t.chrome.gate;

  if (!ready) {
    // Reserves the height so nothing jumps when the account loads.
    return <div className="min-h-[24rem]" aria-hidden="true" />;
  }
  if (!user) {
    return (
      <Message
        title={gate.signInTitle}
        body={DEV_TOOLS_ENABLED ? gate.signedOutDemo : gate.notAvailable}
      />
    );
  }
  if (role && !user.roles.includes(role)) {
    return (
      <Message
        title={role === "owner" ? gate.ownerTitle : gate.staffTitle}
        body={role === "owner" ? gate.ownerLocked : gate.staffLocked}
      />
    );
  }
  return <>{children}</>;
}
