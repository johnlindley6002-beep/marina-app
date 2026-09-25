"use client";

import { useState } from "react";
import { siteConfig } from "../../data/site";
import { resetMockReletting } from "../../lib/mockData";
import { useAuth } from "./AuthProvider";

// MOCK / DEV ONLY. Stands in for signing in so each experience can be
// previewed: a visitor with no account, a plain voyager, a voyager who is also
// an owner, and a marina staff member. It does not exist in the real product.
// Hide it with siteConfig.mockMode = false, and delete it before launch.
export default function DevPersonaSwitcher() {
  const { personas, activePersonaId, signInAs } = useAuth();
  const [open, setOpen] = useState(false);

  if (!siteConfig.mockMode) return null;

  const active = personas.find((p) => p.id === activePersonaId);

  return (
    <div className="on-ink fixed bottom-3 left-3 z-[60] max-w-[calc(100vw-1.5rem)] text-sm">
      {open ? (
        <div
          role="group"
          aria-label="Mock sign in, dev only"
          className="mb-2 w-72 max-w-full rounded-[3px] border border-paper/20 bg-ink p-3 text-paper shadow-lg"
        >
          <p className="font-medium">Mock / dev only</p>
          <p className="mt-1 text-xs text-stone">
            Sign in as a sample account to preview each experience. Not part of
            the real product.
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
                    className={`flex min-h-11 w-full flex-col items-start justify-center rounded-[3px] px-3 text-left transition-colors ${
                      selected ? "bg-paper text-ink" : "hover:bg-paper/10"
                    }`}
                  >
                    <span className="font-medium">{persona.label}</span>
                    <span
                      className={`text-xs ${selected ? "text-ink/80" : "text-stone"}`}
                    >
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
            className="mt-2 flex min-h-11 w-full items-center rounded-[3px] px-3 text-left text-xs text-stone hover:bg-paper/10"
          >
            Reset mock reletting data
          </button>
        </div>
      ) : null}
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-paper/30 bg-ink px-4 text-paper shadow-lg transition-colors hover:border-paper"
      >
        <span className="text-xs font-medium">Mock</span>
        <span className="text-stone">{active?.label ?? "Signed out"}</span>
      </button>
    </div>
  );
}
