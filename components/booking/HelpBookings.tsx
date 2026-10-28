"use client";

import { useState } from "react";
import {
  cancelMyHelp,
  myHelpBookings,
  reportRunningLate,
  useAccountData,
  type HelpBooking,
} from "@/lib/data";
import { formatClock, lisbonToIso } from "@/lib/lisbonTime";
import { isoDateOfTimestamp, todayIso } from "@/lib/dates";
import { useFormat } from "@/components/providers/useFormat";
import { useLanguage } from "@/components/providers/LanguageProvider";
import StatusChip from "@/components/ui/StatusChip";
import Field from "@/components/ui/Field";

const NONE: HelpBooking[] = [];

// More than an hour ago: too late to be a new time for today.
function isPast(iso: string): boolean {
  return new Date(iso).getTime() < Date.now() - 60 * 60 * 1000;
}

function Booking({ booking }: { booking: HelpBooking }) {
  const { t, locale } = useLanguage();
  const { date } = useFormat();
  const copy = t.help;
  const day = isoDateOfTimestamp(booking.dueAt);
  const clock = formatClock(booking.dueAt, "en-GB");
  const [late, setLate] = useState(false);
  const [time, setTime] = useState(clock);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const open = booking.status === "waiting" || booking.status === "booked";
  const id = `help-${booking.id}`;

  async function saveTime() {
    const at = lisbonToIso(day, time);
    if (!/^\d{2}:\d{2}$/.test(time) || isPast(at)) {
      setError(copy.errTime);
      return;
    }
    const result = await reportRunningLate(booking.id, at);
    setError(result.ok ? "" : t.accounts.errors.unknown);
    if (result.ok) {
      setNote(copy.timeSaved);
      setLate(false);
    }
  }

  return (
    <li className="hairline-top py-4 first:border-t-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <p className="font-medium text-ink">
          {copy.types[booking.type as keyof typeof copy.types] ?? ""}
        </p>
        <StatusChip>{copy.statuses[booking.status]}</StatusChip>
      </div>
      <p className="tabular mt-1 text-ink">
        {copy.at(date(day), formatClock(booking.dueAt, locale === "en" ? "en-GB" : locale))}
      </p>
      {open && day >= todayIso() ? (
        <div className="mt-2 flex flex-wrap items-end gap-3">
          {late ? (
            <>
              <Field label={copy.newTime} htmlFor={`${id}-time`} error={error || undefined}>
                <input
                  id={`${id}-time`}
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="field"
                />
              </Field>
              <button type="button" onClick={() => void saveTime()} className="btn-quiet min-h-11">
                {copy.saveTime}
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setLate(true)} className="btn-quiet min-h-11">
              {copy.runningLate}
            </button>
          )}
          <button
            type="button"
            onClick={async () => {
              const result = await cancelMyHelp(booking.id);
              if (!result.ok) setError(t.accounts.errors.unknown);
            }}
            className="link min-h-11 text-sm"
          >
            {copy.cancel}
          </button>
        </div>
      ) : null}
      <p role="status" className="mt-1 text-sm text-ink">
        {note}
      </p>
    </li>
  );
}

// The signed-in boater's own booked help, never anyone else's. "arrivals"
// shows a guest's arrival help; "holder" shows a berth holder's departures
// and returns.
export default function HelpBookings({ kind }: { kind: "arrivals" | "holder" }) {
  const { t } = useLanguage();
  const { value } = useAccountData(myHelpBookings, NONE);
  const shown = value.filter((b) =>
    kind === "arrivals" ? b.type === "arrival" : b.type === "departure" || b.type === "return"
  );
  if (shown.length === 0) return null;
  return (
    <section className="chapter" aria-labelledby={`help-bookings-${kind}`}>
      <h2 id={`help-bookings-${kind}`} className="type-heading type-h2 text-ink">
        {t.help.bookingsTitle}
      </h2>
      <ul className="mt-4">
        {shown.map((booking) => (
          <Booking key={booking.id} booking={booking} />
        ))}
      </ul>
    </section>
  );
}
