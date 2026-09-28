"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { siteConfig } from "../../data/site";
import { useAuth } from "../components/AuthProvider";

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
  const { user, signOut } = useAuth();

  return (
    <div className="staff-shell min-h-screen bg-paper-deep">
      <div className="staff-topbar flex-wrap gap-y-2 py-2">
        <div className="flex min-w-0 items-center gap-4">
          <Link href="/staff/arrivals" className="shrink-0 text-sm font-semibold text-ink">
            aldock <span className="font-normal text-ink/75">staff</span>
          </Link>
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
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {user ? (
            <span className="text-xs text-ink/70">
              Signed in as <span className="font-medium text-ink">{user.name}</span>
            </span>
          ) : null}
          <button type="button" onClick={signOut} className="staff-btn staff-btn-ghost">
            Sign out
          </button>
          <Link href="/" className="staff-btn staff-btn-ghost">
            Exit
          </Link>
        </div>
      </div>
      {siteConfig.mockMode ? (
        <p className="border-b border-hairline bg-paper px-4 py-1.5 text-xs text-ink/70">
          {siteConfig.accounts.mockNote}
        </p>
      ) : null}
      <main id="main" className="staff-page">
        {children}
      </main>
    </div>
  );
}
