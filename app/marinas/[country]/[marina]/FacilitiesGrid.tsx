"use client";

import { useEffect, useRef, useState } from "react";
import type { FacilityDetail } from "../../../../data/marinas";
import { contentLocale } from "../../../../lib/i18n";
import { renderLengthTokens } from "../../../../lib/units";
import { useLanguage } from "../../../components/LanguageProvider";
import { useUnits } from "../../../components/UnitsProvider";
import FacilityIcon from "./facility-icons";

export default function FacilitiesGrid({
  facilities,
}: {
  facilities: FacilityDetail[];
}) {
  const { locale } = useLanguage();
  const cl = contentLocale(locale);
  const { units } = useUnits();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const open = facilities.find((f) => f.id === openId) ?? null;

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenId(null);
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        "button, a[href], input, select, textarea"
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      triggerRef.current?.focus();
    };
  }, [open]);

  return (
    <>
      <div className="mt-6 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
        {facilities.map((facility) => (
          <button
            key={facility.id}
            type="button"
            aria-haspopup="dialog"
            onClick={(e) => {
              triggerRef.current = e.currentTarget;
              setOpenId(facility.id);
            }}
            className="hairline-top flex items-center gap-4 py-4 text-left transition-colors hover:bg-paper-deep/60"
          >
            <FacilityIcon facility={facility.icon} className="h-6 w-6 text-ink" />
            <span className="text-sm text-ink/75">
              {facility.name[cl]}
            </span>
          </button>
        ))}
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/60 p-0 sm:items-center sm:p-6"
          onClick={() => setOpenId(null)}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="facility-dialog-title"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-sm bg-white p-6 sm:rounded-sm md:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <FacilityIcon facility={open.icon} className="h-6 w-6 shrink-0 text-ink" />
                <h3
                  id="facility-dialog-title"
                  className="text-lg font-medium tracking-tight text-ink"
                >
                  {open.name[cl]}
                </h3>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpenId(null)}
                aria-label="Close"
                className="-mt-1 -mr-2 px-2 py-1 text-2xl leading-none text-ink/70 hover:text-ink"
              >
                ×
              </button>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-ink/75">
              {open.description[cl]}
            </p>
            <ul className="mt-4 space-y-2 border-t border-hairline pt-4">
              {open.details.map((detail, i) => (
                <li key={i} className="text-sm text-ink/75">
                  {renderLengthTokens(detail[cl], units)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}
