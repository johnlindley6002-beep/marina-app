"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ACCOUNT_DATA_SOURCE } from "@/lib/data";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";

const itemClass = "flex min-h-11 items-center text-paper transition-colors hover:text-stone";

function MenuBody({ onNavigate }: { onNavigate: () => void }) {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  if (!user) return null;
  const isStaff = user.roles.includes("staff");

  return (
    <>
      <div className="border-b border-paper/10 pb-3">
        <p className="font-medium text-paper">{user.name}</p>
        <p className="text-sm text-stone">{user.email}</p>
      </div>
      <ul className="py-1">
        <li>
          <Link href="/account" onClick={onNavigate} className={itemClass}>
            {t.chrome.account.account}
          </Link>
        </li>
        {ACCOUNT_DATA_SOURCE === "supabase" ? (
          <li>
            <Link href="/my-arrivals" onClick={onNavigate} className={itemClass}>
              {t.accounts.nav.myArrivals}
            </Link>
          </li>
        ) : null}
        {isStaff ? (
          <li>
            <Link href="/staff" onClick={onNavigate} className={itemClass}>
              {t.chrome.account.staffArea}
            </Link>
          </li>
        ) : null}
        <li>
          <button
            type="button"
            onClick={() => {
              signOut();
              onNavigate();
            }}
            className={`${itemClass} w-full text-left`}
          >
            {t.chrome.account.signOut}
          </button>
        </li>
      </ul>
    </>
  );
}

// The signed-in user's menu. It renders nothing for a signed-out visitor, since
// the mock has no sign-in screen (the dev switcher stands in for it).
export default function AccountMenu({
  variant = "dropdown",
  onNavigate,
}: {
  variant?: "dropdown" | "inline";
  onNavigate?: () => void;
}) {
  const { ready, user } = useAuth();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!ready || !user) return null;

  if (variant === "inline") {
    return (
      <div className="mt-10 border-t border-paper/10 pt-6">
        <MenuBody onNavigate={onNavigate ?? (() => {})} />
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls="account-menu"
        onClick={() => setOpen((o) => !o)}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-stone/40 text-sm font-medium text-paper transition-colors hover:border-paper"
      >
        <span aria-hidden="true">{user.initials}</span>
        <span className="sr-only">{t.chrome.account.menuFor(user.name)}</span>
      </button>
      {open ? (
        <div
          id="account-menu"
          className="absolute top-full right-0 z-50 mt-2 w-64 rounded-md border border-paper/15 bg-ink px-4 py-3 shadow-overlay"
        >
          {/* Below lg the navbar has no room for the switch, so it lives here. */}
          <MenuBody onNavigate={() => setOpen(false)} />
        </div>
      ) : null}
    </div>
  );
}
