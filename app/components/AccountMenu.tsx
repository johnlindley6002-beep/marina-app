"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthProvider";
import ModeSwitch from "./ModeSwitch";

const itemClass =
  "flex min-h-11 items-center text-paper transition-colors hover:text-brass";

function MenuBody({
  onNavigate,
  showSwitch,
}: {
  onNavigate: () => void;
  showSwitch: boolean;
}) {
  const { user, signOut } = useAuth();
  if (!user) return null;
  const isStaff = user.roles.includes("staff");

  return (
    <>
      <div className="border-b border-paper/10 pb-3">
        <p className="font-medium text-paper">{user.name}</p>
        <p className="text-sm text-stone">{user.email}</p>
      </div>
      {showSwitch ? (
        <div className="border-b border-paper/10 py-3 lg:hidden">
          <ModeSwitch onSwitched={onNavigate} />
        </div>
      ) : null}
      <ul className="py-1">
        <li>
          <Link href="/account" onClick={onNavigate} className={itemClass}>
            Account
          </Link>
        </li>
        {isStaff ? (
          <li>
            <Link href="/staff" onClick={onNavigate} className={itemClass}>
              Staff area
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
            Sign out (mock)
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
  const { ready, user, canSwitchMode } = useAuth();
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
        <MenuBody onNavigate={onNavigate ?? (() => {})} showSwitch={canSwitchMode} />
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
        <span className="sr-only">Account menu for {user.name}</span>
      </button>
      {open ? (
        <div
          id="account-menu"
          className="absolute top-full right-0 z-50 mt-2 w-64 rounded-[3px] border border-paper/15 bg-ink px-4 py-3 shadow-lg"
        >
          {/* Below lg the navbar has no room for the switch, so it lives here. */}
          <MenuBody
            onNavigate={() => setOpen(false)}
            showSwitch={canSwitchMode}
          />
        </div>
      ) : null}
    </div>
  );
}
