"use client";

import { useEffect, useState } from "react";
import type { Marina } from "@/data/marinas";
import {
  clearLastEnquiry,
  loadLastEnquiry,
  TRIP_CHANGED_EVENT,
  type LastEnquiry,
} from "@/features/marina/lib/tripStore";
import { formatLength } from "@/lib/units";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useUnits } from "@/components/providers/UnitsProvider";
import { telHref } from "./EmergencyNumbers";

export default function OfflineCard({
  marina,
  embedded = false,
}: {
  marina: Marina;
  embedded?: boolean;
}) {
  const { units } = useUnits();
  const { t } = useLanguage();
  const copy = t.marinaPage.offline;
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

  const Heading = embedded ? "h3" : "h2";

  return (
    <div className={embedded ? "stack-lg" : "section"}>
      {embedded ? <hr className="mb-10 border-hairline" /> : null}
      <div className={embedded ? "" : "page-column"}>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <Heading className={`type-heading text-ink ${embedded ? "type-h3" : "type-h2"}`}>
            {copy.heading}
          </Heading>
          <p
            role="status"
            className={`text-xs font-medium ${online ? "text-ink-muted" : "text-ink"}`}
          >
            {online ? copy.online : copy.offline}
          </p>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">{copy.kept}</p>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="hairline-top pt-6">
            <h3 className="type-heading type-h3 text-ink">{copy.contactVhf}</h3>
            <ul className="mt-3 space-y-2 text-sm text-ink-soft">
              <li>
                <a
                  href={telHref(marina.phone)}
                  className="inline-flex min-h-11 items-center font-medium text-ink underline underline-offset-4"
                >
                  {marina.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${marina.email}`}
                  className="inline-flex min-h-11 items-center text-ink underline underline-offset-4"
                >
                  {marina.email}
                </a>
              </li>
              <li>{copy.hail(marina.vhfChannel)}</li>
              <li>
                <a
                  href={marina.planImage.src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center text-ink underline underline-offset-4"
                >
                  {copy.planImage}
                </a>
              </li>
            </ul>
          </div>

          <div className="hairline-top pt-6">
            <h3 className="type-heading type-h3 text-ink">{copy.savedEnquiry}</h3>
            {enquiry ? (
              <>
                <ul className="mt-3 space-y-1 text-sm text-ink-soft">
                  <li>{copy.arrival(enquiry.arrival, enquiry.eta)}</li>
                  <li>
                    {copy.departure(
                      enquiry.openEnded
                        ? copy.openEnded
                        : copy.departureTimes(enquiry.departure, enquiry.etd)
                    )}
                  </li>
                  <li>
                    {copy.boat(
                      enquiry.boatName || "-",
                      Number(enquiry.loa) > 0 ? formatLength(Number(enquiry.loa), units) : ""
                    )}
                  </li>
                  <li>{copy.berth(enquiry.berthId || copy.notSelected)}</li>
                </ul>
                <button
                  type="button"
                  onClick={clearLastEnquiry}
                  className="mt-2 inline-flex min-h-11 items-center text-sm text-ink-muted underline underline-offset-4 hover:text-error"
                >
                  {copy.clear}
                </button>
              </>
            ) : (
              <p className="mt-3 text-sm text-ink-soft">{copy.nothing}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
