"use client";

import { useEffect, useState } from "react";
import type { Marina } from "../../../../data/marinas";
import {
  clearLastEnquiry,
  loadLastEnquiry,
  TRIP_CHANGED_EVENT,
  type LastEnquiry,
} from "../../../../lib/tripStore";
import { formatLength } from "../../../../lib/units";
import { useUnits } from "../../../components/UnitsProvider";
import { telHref } from "./EmergencyNumbers";

export default function OfflineCard({ marina }: { marina: Marina }) {
  const { units } = useUnits();
  const [enquiry, setEnquiry] = useState<LastEnquiry | null>(null);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    function refresh() {
      const saved = loadLastEnquiry();
      setEnquiry(saved && saved.marinaId === marina.id ? saved : null);
    }
    function updateOnline() {
      setOnline(navigator.onLine);
    }
    refresh();
    updateOnline();
    window.addEventListener(TRIP_CHANGED_EVENT, refresh);
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    return () => {
      window.removeEventListener(TRIP_CHANGED_EVENT, refresh);
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
    };
  }, [marina.id]);

  return (
    <section className="px-6 py-16 md:px-8 md:py-24">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="text-xs font-normal tracking-[0.25em] text-navy/60 uppercase">
            Offline essentials
          </p>
          <p
            role="status"
            className={`text-xs font-normal ${online ? "text-neutral-500" : "text-amber-800"}`}
          >
            {online ? "Online" : "You're offline — showing saved details"}
          </p>
        </div>
        <p className="mt-2 max-w-2xl text-sm font-light text-neutral-600">
          These details are kept on this device and stay available without a
          signal once you have opened this page online.
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="border border-neutral-200 bg-white p-6">
            <h3 className="text-sm font-normal text-navy">Contact &amp; VHF</h3>
            <ul className="mt-3 space-y-2 text-sm font-light text-neutral-600">
              <li>
                <a
                  href={telHref(marina.phone)}
                  className="font-normal text-navy underline underline-offset-4"
                >
                  {marina.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${marina.email}`}
                  className="text-navy underline underline-offset-4"
                >
                  {marina.email}
                </a>
              </li>
              <li>Hail on VHF channel {marina.vhfChannel}</li>
              <li>
                <a
                  href={marina.planImage.src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-navy underline underline-offset-4"
                >
                  Open the marina plan (image)
                </a>
              </li>
            </ul>
          </div>

          <div className="border border-neutral-200 bg-white p-6">
            <h3 className="text-sm font-normal text-navy">
              Your saved enquiry
            </h3>
            {enquiry ? (
              <>
                <ul className="mt-3 space-y-1 text-sm font-light text-neutral-600">
                  <li>
                    Arrival: {enquiry.arrival}
                    {enquiry.eta ? ` (ETA ${enquiry.eta})` : ""}
                  </li>
                  <li>
                    Departure:{" "}
                    {enquiry.openEnded
                      ? "open-ended"
                      : `${enquiry.departure}${enquiry.etd ? ` (ETD ${enquiry.etd})` : ""}`}
                  </li>
                  <li>
                    Boat: {enquiry.boatName || "—"}
                    {Number(enquiry.loa) > 0
                      ? `, ${formatLength(Number(enquiry.loa), units)}`
                      : ""}
                  </li>
                  <li>Berth: {enquiry.berthId || "not selected"}</li>
                </ul>
                <button
                  type="button"
                  onClick={clearLastEnquiry}
                  className="mt-4 text-sm font-light text-neutral-500 underline underline-offset-4 hover:text-red-600"
                >
                  Clear saved enquiry
                </button>
              </>
            ) : (
              <p className="mt-3 text-sm font-light text-neutral-600">
                Nothing saved yet. When you send an enquiry, its dates, boat
                and berth are kept here for offline use.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
