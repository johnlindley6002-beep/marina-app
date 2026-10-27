"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { siteConfig } from "@/data/site";
import { signOutStaff, STAFF_DATA_SOURCE } from "@/lib/data";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useStaffSession } from "./StaffSessionProvider";

const NAV = [
  { href: "/staff/arrivals", label: "Arrivals" },
  { href: "/staff/berths", label: "Berth map" },
  { href: "/staff/enquiries", label: "Enquiries" },
  { href: "/staff/reletting", label: "Reletting" },
  { href: "/staff/checkin", label: "Check-in" },
  { href: "/staff/records", label: "Records" },
];

// A compact top bar with the nav, replacing the consumer navbar and footer for
// the whole /staff/* area. Dense, working, not the consumer art direction.
export default function StaffShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { signedIn, email } = useStaffSession();
  const { t } = useLanguage();
  const onSignIn = pathname === "/staff/login";
  const mock = STAFF_DATA_SOURCE === "mock";
  // On the mock the dev persona's name shows; on Supabase, the email.
  const who = mock ? user?.name : signedIn ? email : null;

  async function handleSignOut() {
    await signOutStaff();
    if (!mock) router.replace("/staff/login");
  }

  return (
    <div className="staff-shell min-h-dvh bg-paper-deep">
      <div className="staff-topbar flex-wrap gap-y-2 py-2">
        <div className="flex min-w-0 items-center gap-4">
          <Link href="/staff/arrivals" className="shrink-0 text-sm font-semibold text-ink">
            aldock <span className="font-normal text-ink-soft">staff</span>
          </Link>
          {onSignIn ? null : (
            <nav className="staff-nav overflow-x-auto" aria-label="Staff">
              {NAV.map((item) => {
                const active = pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`staff-nav-link ${active ? "is-active" : ""}`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {who ? (
            <span className="text-xs text-ink-muted">{t.staffLogin.signedInAs(who)}</span>
          ) : null}
          {who && !onSignIn ? (
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="staff-btn staff-btn-ghost"
            >
              {t.staffLogin.signOut}
            </button>
          ) : null}
          <Link href="/" className="staff-btn staff-btn-ghost">
            Exit
          </Link>
        </div>
      </div>
      {siteConfig.mockMode && mock ? (
        <p className="border-b border-hairline bg-paper px-4 py-1.5 text-xs text-ink-muted">
          {siteConfig.accounts.mockNote}
        </p>
      ) : null}
      <main id="main" className="staff-page">
        {children}
      </main>
    </div>
  );
}
