"use client";

import { useState } from "react";
import { siteConfig } from "@/data/site";
import { DEV_TOOLS_ENABLED } from "@/lib/devTools";
import {
  emptyMockReletting,
  resetMockEnquiries,
  resetMockOutOfService,
  resetMockReletting,
} from "@/lib/data";
import { useAuth } from "@/components/providers/AuthProvider";

// MOCK / DEV ONLY. Stands in for signing in so each experience can be
// previewed: a visitor with no account, a plain voyager, a voyager who is also
// an owner, and a marina staff member. It does not exist in the real product.
// It renders only when dev tools are enabled (lib/devTools.ts) and
// siteConfig.mockMode is on. Delete it before launch.
export default function DevPersonaSwitcher() {
  const { personas, activePersonaId, signInAs } = useAuth();
  const [open, setOpen] = useState(false);

  if (!DEV_TOOLS_ENABLED || !siteConfig.mockMode) return null;

  const active = personas.find((p) => p.id === activePersonaId);

  return (
    <div className="relative">
      {open ? (
        <div
          role="group"
          aria-label="Mock sign in, dev only"
          className="absolute bottom-full left-0 mb-2 w-72 max-w-[calc(100vw-1.5rem)] rounded-md border border-paper/20 bg-ink p-3 text-paper shadow-overlay"
        >
          <p className="font-medium">Mock / dev only</p>
          <p className="mt-1 text-xs text-stone">
            Sign in as a sample account to preview each experience. Not part of the real product.
          </p>
          <ul className="mt-2">
            {personas.map((persona) => {
              const selected = persona.id === activePersonaId;
              return (
                <li key={persona.id}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => signInAs(persona.userId)}
                    className={`flex min-h-11 w-full flex-col items-start justify-center rounded-md px-3 text-left transition-colors ${
                      selected ? "bg-paper text-ink" : "hover:bg-paper/10"
                    }`}
                  >
                    <span className="font-medium">{persona.label}</span>
                    <span className={`text-xs ${selected ? "text-ink-soft" : "text-stone"}`}>
                      {persona.description}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            onClick={resetMockReletting}
            className="mt-2 flex min-h-11 w-full items-center rounded-md px-3 text-left text-xs text-stone hover:bg-paper/10"
          >
            Reset mock reletting data
          </button>
          <button
            type="button"
            onClick={emptyMockReletting}
            className="flex min-h-11 w-full items-center rounded-md px-3 text-left text-xs text-stone hover:bg-paper/10"
          >
            Show first-time berth holder view
          </button>
          <button
            type="button"
            onClick={() => {
              resetMockEnquiries();
              resetMockOutOfService();
            }}
            className="flex min-h-11 w-full items-center rounded-md px-3 text-left text-xs text-stone hover:bg-paper/10"
          >
            Reset mock staff data
          </button>
        </div>
      ) : null}
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-paper/30 bg-ink px-4 text-paper shadow-overlay transition-colors hover:border-paper"
      >
        <span className="text-xs font-medium">Mock</span>
        <span className="text-stone">{active?.label ?? "Signed out"}</span>
      </button>
    </div>
  );
}
