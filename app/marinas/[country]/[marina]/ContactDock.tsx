"use client";

import { useEffect, useRef, useState } from "react";
import type { Marina } from "../../../../data/marinas";
import { loadBoatProfile } from "../../../../lib/boatProfile";
import { useBoats } from "../../../components/BoatProvider";
import { useLanguage } from "../../../components/LanguageProvider";
import { telHref } from "./EmergencyNumbers";

// The four general-contact options, shared by the compact floating phone
// button and the light "Contact marina" link in the action zone.
export function ContactList({ marina }: { marina: Marina }) {
  const { t } = useLanguage();
  const { activeBoat: active } = useBoats();

  function messageMarina() {
    const dims = loadBoatProfile();
    const lines = [
      "Hello,",
      "",
      "I have a question about visiting the marina.",
      "",
      active?.name ? `Boat: ${active.name}` : "",
      dims.loa ? `Length overall: ${dims.loa} m` : "",
      dims.beam ? `Beam: ${dims.beam} m` : "",
      dims.draft ? `Draft: ${dims.draft} m` : "",
      "",
      "Thanks,",
    ].filter((line, i, all) => line !== "" || all[i - 1] !== "");
    window.location.href = `mailto:${marina.email}?subject=${encodeURIComponent(
      `Message to ${marina.name}`
    )}&body=${encodeURIComponent(lines.join("\n"))}`;
  }

  const rowClass =
    "flex items-center justify-between gap-4 border-b border-hairline px-4 py-3 text-sm text-ink";

  return (
    <div>
      <a href={telHref(marina.phone)} className={`${rowClass} hover:bg-paper-deep`}>
        <span>{t.dock.call}</span>
        <span className="font-medium">{marina.phone}</span>
      </a>
      <p className={rowClass}>
        <span>{t.dock.vhf}</span>
        <span className="font-medium">{marina.vhfChannel}</span>
      </p>
      <a href={`mailto:${marina.email}`} className={`${rowClass} hover:bg-paper-deep`}>
        <span>{t.dock.email}</span>
        <span className="font-medium">{marina.email}</span>
      </a>
      <button
        type="button"
        onClick={messageMarina}
        className="w-full px-4 py-3 text-left text-sm font-medium text-ink hover:bg-paper-deep"
      >
        {t.dock.message}
      </button>
    </div>
  );
}

// Small, unobtrusive phone button that stays reachable while scrolling.
export default function ContactDock({ marina }: { marina: Marina }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLElement>("a,button")?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="fixed right-4 bottom-4 z-40 flex flex-col items-end gap-2">
      {open ? (
        <div
          ref={panelRef}
          id="contact-dock-panel"
          role="dialog"
          aria-label={t.dock.heading}
          className="surface-lift w-72"
        >
          <p className="type-label px-4 pt-4 pb-2">
            {t.dock.heading}
          </p>
          <ContactList marina={marina} />
        </div>
      ) : null}
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls="contact-dock-panel"
        aria-label={open ? t.dock.close : t.dock.open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-white shadow-lg hover:bg-ink-2"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className="h-5 w-5"
          aria-hidden="true"
        >
          {open ? (
            <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"
            />
          )}
        </svg>
      </button>
    </div>
  );
}
