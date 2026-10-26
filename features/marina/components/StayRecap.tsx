"use client";

import { useEffect, useMemo, useState } from "react";
import { calculateQuote, type Marina } from "@/data/marinas";
import { addOnText } from "@/features/marina/lib/addOnText";
import {
  loadLastEnquiry,
  TRIP_CHANGED_EVENT,
  type LastEnquiry,
} from "@/features/marina/lib/tripStore";
import { mailText } from "@/lib/i18n/mail";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useFormat } from "@/components/providers/useFormat";

const inputClass = "field";
const labelClass = "field-label";

export default function StayRecap({
  marina,
  onRebook,
  embedded = false,
}: {
  marina: Marina;
  onRebook: () => void;
  embedded?: boolean;
}) {
  const { t, locale } = useLanguage();
  const { money, moneyPrecise } = useFormat();
  const copy = t.stay.recap;
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
    const m = mailText(locale).departure;
    const boat = enquiry.boatName || "-";
    const body = [
      m.title(marina.name.toUpperCase()),
      "",
      m.boat(boat),
      m.berth(enquiry.berthId || "-"),
      m.departure(departure || "-", departTime),
      "",
      m.thanks,
    ].join("\n");
    window.location.href = `mailto:${marina.email}?subject=${encodeURIComponent(
      m.subject(enquiry.boatName || m.visitingVessel)
    )}&body=${encodeURIComponent(body)}`;
  }

  const Heading = embedded ? "h3" : "h2";

  return (
    <div className={embedded ? "hairline-top stack-md pt-8" : "section bg-paper-deep"}>
      <div className={embedded ? "" : "page-column"}>
        <Heading className={`type-heading text-ink ${embedded ? "type-h3" : "type-h2"}`}>
          {copy.heading}
        </Heading>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
          {copy.basedOn(enquiry.arrival, enquiry.boatName)}
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="hairline-top pt-6">
            <h3 className="type-heading type-h3 text-ink">{copy.settleUp}</h3>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className={labelClass}>{copy.departureDate}</span>
                <input
                  type="date"
                  value={departure}
                  onChange={(e) => setDeparture(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="block text-sm">
                <span className={labelClass}>{copy.departureTime}</span>
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
                    <tr key={line.season} className="border-b border-hairline text-ink-soft">
                      <td className="py-2 pr-4">
                        {line.nights} × {money(line.rateEur)}
                        <span className="block text-xs text-ink-muted">
                          {copy.classSeason(quote.marinaClass, t.stay.season[line.season])}
                        </span>
                      </td>
                      <td className="py-2 text-right font-medium text-ink">
                        {money(line.subtotalEur)}
                      </td>
                    </tr>
                  ))}
                  {quote.addOnLines.map((line) => {
                    const text = addOnText(t.stay.estimate, line.kind, marina, money, moneyPrecise);
                    return (
                      <tr key={line.kind} className="border-b border-hairline text-ink-soft">
                        <td className="py-2 pr-4">
                          {text.label}
                          <span className="block text-xs text-ink-muted">{text.note}</span>
                        </td>
                        <td className="py-2 text-right font-medium text-ink">
                          {line.amountEur !== null ? money(line.amountEur) : "-"}
                        </td>
                      </tr>
                    );
                  })}
                  <tr>
                    <td className="pt-3 font-medium text-ink">{copy.estimatedTotal}</td>
                    <td className="pt-3 text-right text-base font-medium text-ink">
                      {money(quote.estimatedTotalEur)}
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <p className="mt-4 text-sm text-ink-soft">{copy.chooseDeparture}</p>
            )}
            <p className="mt-3 text-xs text-ink-muted">
              {copy.estimateOnly(Math.round(marina.vatRate * 100))}
            </p>
          </div>

          <div className="space-y-6">
            <div className="hairline-top pt-6">
              <h3 className="type-heading type-h3 text-ink">{copy.leaving}</h3>
              <p className="mt-2 text-sm text-ink-soft">{copy.leavingNote}</p>
              <button type="button" onClick={notifyDeparture} className="btn-dark mt-4">
                {copy.notifyDeparture}
              </button>
            </div>

            <div className="hairline-top pt-6">
              <h3 className="type-heading type-h3 text-ink">{copy.comingBack}</h3>
              <p className="mt-2 text-sm text-ink-soft">{copy.comingBackNote}</p>
              <button type="button" onClick={onRebook} className="btn-secondary mt-4">
                {copy.rebook}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
