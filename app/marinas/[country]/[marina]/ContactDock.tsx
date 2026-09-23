"use client";

import { useEffect, useRef, useState } from "react";
import type { Marina } from "../../../../data/marinas";
import { loadBoatProfile, loadBoats } from "../../../../lib/boatProfile";
import { useLanguage } from "../../../components/LanguageProvider";
import { telHref } from "./EmergencyNumbers";

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

  function messageMarina() {
    const store = loadBoats();
    const active = store.boats.find((b) => b.id === store.activeId);
    const dims = active ?? loadBoatProfile();
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

  const actionClass =
    "flex items-center justify-between gap-4 border-b border-neutral-100 px-4 py-3 text-sm text-navy hover:bg-neutral-50";

  return (
    <div className="fixed right-4 bottom-4 z-40 flex flex-col items-end gap-2">
      {open ? (
        <div
          ref={panelRef}
          id="contact-dock-panel"
          role="dialog"
          aria-label={t.dock.heading}
          className="w-72 border border-neutral-200 bg-white shadow-lg"
        >
          <p className="px-4 pt-4 pb-2 text-xs font-normal tracking-wide text-navy/60 uppercase">
            {t.dock.heading}
          </p>
          <a href={telHref(marina.phone)} className={actionClass}>
            <span>{t.dock.call}</span>
            <span className="font-normal">{marina.phone}</span>
          </a>
          <p className={actionClass.replace("hover:bg-neutral-50", "")}>
            <span>{t.dock.vhf}</span>
            <span className="font-normal">{marina.vhfChannel}</span>
          </p>
          <a href={`mailto:${marina.email}`} className={actionClass}>
            <span>{t.dock.email}</span>
            <span className="font-normal">{marina.email}</span>
          </a>
          <button
            type="button"
            onClick={messageMarina}
            className="w-full px-4 py-3 text-left text-sm font-normal text-navy hover:bg-neutral-50"
          >
            {t.dock.message}
          </button>
        </div>
      ) : null}
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls="contact-dock-panel"
        onClick={() => setOpen((v) => !v)}
        className="bg-navy px-5 py-3 text-sm font-normal tracking-wide text-white shadow-lg hover:bg-navy-accent"
      >
        {open ? t.dock.close : t.dock.open}
      </button>
    </div>
  );
}
