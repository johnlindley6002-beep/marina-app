"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { siteConfig } from "@/data/site";
import { signOutStaff, STAFF_DATA_SOURCE } from "@/lib/data";
import { useAuth } from "@/components/providers/AuthProvider";
import { navFor } from "../lib/roles";
import { useStaffSession } from "./StaffSessionProvider";
import { useStaffText, type StaffLang } from "./StaffLanguageProvider";

const LANGS: { value: StaffLang; label: string; name: string }[] = [
  { value: "en", label: "EN", name: "English" },
  { value: "pt", label: "PT", name: "Português" },
];

// A compact top bar with the nav, replacing the consumer navbar and footer for
// the whole /staff/* area. Dense, working, not the consumer art direction.
export default function StaffShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { signedIn, email, session } = useStaffSession();
  // Only what the role can use.
  const nav = navFor(session?.capabilities ?? []);
  const { s, lang, setLang } = useStaffText();
  const onSignIn = pathname === "/staff/login";
  const mock = STAFF_DATA_SOURCE === "mock";
  // On the mock the dev persona's name shows; on Supabase, the email.
  const who = mock ? user?.name : signedIn ? email : null;

  async function handleSignOut() {
    await signOutStaff();
    if (!mock) router.replace("/staff/login");
  }

  return (
    <div className="staff-shell min-h-dvh bg-paper-deep" lang={lang}>
      <div className="staff-topbar flex-wrap gap-y-2 py-2">
        <div className="flex min-w-0 items-center gap-4">
          <Link href="/staff" className="shrink-0 text-sm font-semibold text-ink">
            aldock <span className="font-normal text-ink-soft">{s.shell.brand}</span>
          </Link>
          {onSignIn ? null : (
            <nav className="staff-nav overflow-x-auto" aria-label={s.shell.navLabel}>
              {nav.map((item) => {
                const active = pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`staff-nav-link ${active ? "is-active" : ""}`}
                  >
                    {s.shell.nav[item.key]}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div
            role="group"
            aria-label={s.shell.language}
            className="inline-flex rounded-md border border-ink/25 p-0.5 text-xs"
          >
            {LANGS.map((option) => (
              <button
                key={option.value}
                type="button"
                lang={option.value}
                aria-label={option.name}
                aria-pressed={lang === option.value}
                onClick={() => setLang(option.value)}
                className={`min-h-10 min-w-10 rounded-sm px-2 ${
                  lang === option.value ? "bg-ink text-paper" : "text-ink-muted"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {who ? (
            <span className="text-xs text-ink-muted">
              {s.shell.signedInAs(who)}
              {session?.role ? `, ${s.roles[session.role]}` : ""}
            </span>
          ) : null}
          {who && !onSignIn ? (
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="staff-btn staff-btn-ghost"
            >
              {s.shell.signOut}
            </button>
          ) : null}
          <Link href="/" className="staff-btn staff-btn-ghost">
            {s.shell.exit}
          </Link>
        </div>
      </div>
      {siteConfig.mockMode && mock ? (
        <p className="border-b border-hairline bg-paper px-4 py-1.5 text-xs text-ink-muted">
          {s.shell.mockNote}
        </p>
      ) : null}
      <main id="main" className="staff-page">
        {children}
      </main>
    </div>
  );
}
