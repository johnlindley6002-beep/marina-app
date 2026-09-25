"use client";

import { useEffect, useMemo, useState } from "react";
import {
  calculateQuote,
  SEASON_LABELS,
  type Marina,
} from "../../../../data/marinas";
import {
  loadLastEnquiry,
  TRIP_CHANGED_EVENT,
  type LastEnquiry,
} from "../../../../lib/tripStore";

const inputClass =
  "field";
const labelClass = "field-label";
const eur = (n: number) => `€${n.toFixed(2)}`;

export default function StayRecap({
  marina,
  onRebook,
  embedded = false,
}: {
  marina: Marina;
  onRebook: () => void;
  embedded?: boolean;
}) {
  const [enquiry, setEnquiry] = useState<LastEnquiry | null>(null);
  const [departure, setDeparture] = useState("");
  const [departTime, setDepartTime] = useState("");

  useEffect(() => {
    function refresh() {
      const saved = loadLastEnquiry();
      const mine = saved && saved.marinaId === marina.id ? saved : null;
      setEnquiry(mine);
      if (mine) {
        setDeparture((d) => d || mine.departure);
        setDepartTime((t) => t || mine.etd);
      }
    }
    refresh();
    window.addEventListener(TRIP_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(TRIP_CHANGED_EVENT, refresh);
  }, [marina.id]);

  const quote = useMemo(() => {
    if (!enquiry || !departure) return null;
    return calculateQuote(
      marina,
      { loa: Number(enquiry.loa), arrival: enquiry.arrival, departure },
      {
        shorePower: enquiry.services.shorePower,
        water: enquiry.services.water,
        pumpOut: enquiry.services.pumpOut,
        fuel: enquiry.services.fuel,
        laundry: enquiry.services.laundry,
      }
    );
  }, [enquiry, departure, marina]);

  if (!enquiry) return null;

  function notifyDeparture() {
    if (!enquiry) return;
    const body = [
      `DEPARTURE NOTICE - ${marina.name.toUpperCase()}`,
      "",
      `Boat: ${enquiry.boatName || "-"}`,
      `Berth: ${enquiry.berthId || "-"}`,
      `Departure: ${departure || "-"}${departTime ? ` at ${departTime}` : ""}`,
      "",
      "Thank you for the stay.",
    ].join("\n");
    window.location.href = `mailto:${marina.email}?subject=${encodeURIComponent(
      `Departure notice - ${enquiry.boatName || "visiting vessel"}`
    )}&body=${encodeURIComponent(body)}`;
  }

  const Heading = embedded ? "h3" : "h2";

  return (
    <div className={embedded ? "hairline-top stack-md pt-8" : "bg-paper-deep section"}>
      <div className={embedded ? "" : "page-column"}>
        <Heading className={`type-heading text-ink ${embedded ? "type-h3" : "type-h2"}`}>
          Your stay &amp; departure
        </Heading>
        <p className="mt-2 max-w-2xl text-sm text-ink/75">
          Based on your last enquiry ({enquiry.arrival}
          {enquiry.boatName ? `, ${enquiry.boatName}` : ""}), saved on this
          device.
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="hairline-top pt-6">
            <h3 className="type-heading type-h3 text-ink">
              Settle-up estimate
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className={labelClass}>Departure date</span>
                <input
                  type="date"
                  value={departure}
                  onChange={(e) => setDeparture(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="block text-sm">
                <span className={labelClass}>Departure time</span>
                <input
                  type="time"
                  value={departTime}
                  onChange={(e) => setDepartTime(e.target.value)}
                  className={inputClass}
                />
              </label>
            </div>

            {quote ? (
              <table className="mt-4 w-full border-collapse text-left text-sm">
                <tbody>
                  {quote.berthLines.map((line) => (
                    <tr
                      key={line.season}
                      className="border-b border-hairline text-ink/75"
                    >
                      <td className="py-2 pr-4 ">
                        {line.nights} × {eur(line.rateEur)}
                        <span className="block text-xs text-ink/70">
                          Class {quote.marinaClass} · {SEASON_LABELS[line.season]}
                        </span>
                      </td>
                      <td className="py-2 text-right font-medium text-ink">
                        {eur(line.subtotalEur)}
                      </td>
                    </tr>
                  ))}
                  {quote.addOnLines.map((line) => (
                    <tr
                      key={line.label}
                      className="border-b border-hairline text-ink/75"
                    >
                      <td className="py-2 pr-4 ">
                        {line.label}
                        {line.note ? (
                          <span className="block text-xs text-ink/70">
                            {line.note}
                          </span>
                        ) : null}
                      </td>
                      <td className="py-2 text-right font-medium text-ink">
                        {line.amountEur !== null ? eur(line.amountEur) : "-"}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td className="pt-3 font-medium text-ink">
                      Estimated total
                    </td>
                    <td className="pt-3 text-right text-base font-medium text-ink">
                      {eur(quote.estimatedTotalEur)}
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <p className="mt-4 text-sm text-ink/75">
                Choose a departure date after your arrival to see the estimate.
              </p>
            )}
            <p className="mt-3 text-xs text-ink/70">
              Estimate only, excl. {Math.round(marina.vatRate * 100)}% VAT and
              utilities. The marina confirms the final total.
            </p>
          </div>

          <div className="space-y-6">
            <div className="hairline-top pt-6">
              <h3 className="type-heading type-h3 text-ink">
                Leaving? Let the marina know
              </h3>
              <p className="mt-2 text-sm text-ink/75">
                Opens a pre-filled email with your boat and departure.
              </p>
              <button
                type="button"
                onClick={notifyDeparture}
                className="mt-4 btn-dark"
              >
                Notify departure
              </button>
            </div>

            <div className="hairline-top pt-6">
              <h3 className="type-heading type-h3 text-ink">Coming back?</h3>
              <p className="mt-2 text-sm text-ink/75">
                Same boat and services, dates left blank.
              </p>
              <button
                type="button"
                onClick={onRebook}
                className="mt-4 btn-secondary"
              >
                Rebook this stay
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
