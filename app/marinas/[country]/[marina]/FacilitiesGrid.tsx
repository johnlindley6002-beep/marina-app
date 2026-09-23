"use client";

import { useEffect, useRef, useState } from "react";
import type { FacilityDetail } from "../../../../data/marinas";
import { useLanguage } from "../../../components/LanguageProvider";
import FacilityIcon from "./facility-icons";

export default function FacilitiesGrid({
  facilities,
}: {
  facilities: FacilityDetail[];
}) {
  const { locale } = useLanguage();
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
      if (event.key === "Escape") setOpenId(null);
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
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {facilities.map((facility) => (
          <button
            key={facility.id}
            type="button"
            onClick={(e) => {
              triggerRef.current = e.currentTarget;
              setOpenId(facility.id);
            }}
            className="flex flex-col items-center gap-3 rounded-sm border border-neutral-200 bg-white px-4 py-6 text-center transition-colors hover:border-navy/30"
          >
            <FacilityIcon facility={facility.icon} className="h-6 w-6 text-navy" />
            <span className="text-sm font-light text-neutral-600">
              {facility.name[locale]}
            </span>
          </button>
        ))}
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-navy/60 p-0 sm:items-center sm:p-6"
          onClick={() => setOpenId(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="facility-dialog-title"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-sm bg-white p-6 sm:rounded-sm md:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <FacilityIcon facility={open.icon} className="h-6 w-6 shrink-0 text-navy" />
                <h3
                  id="facility-dialog-title"
                  className="text-lg font-normal tracking-tight text-navy"
                >
                  {open.name[locale]}
                </h3>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpenId(null)}
                aria-label="Close"
                className="-mt-1 -mr-2 px-2 py-1 text-2xl leading-none text-neutral-400 hover:text-navy"
              >
                ×
              </button>
            </div>
            <p className="mt-4 text-sm leading-relaxed font-light text-neutral-600">
              {open.description[locale]}
            </p>
            <ul className="mt-4 space-y-2 border-t border-neutral-200 pt-4">
              {open.details.map((detail, i) => (
                <li key={i} className="text-sm font-light text-neutral-600">
                  {detail[locale]}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}
