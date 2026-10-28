"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { bookHolderHelp, slotBusyness, type SlotBusyness } from "@/lib/data";
import { formatClock, lisbonToIso } from "@/lib/lisbonTime";
import { todayIso } from "@/lib/dates";
import { useLanguage } from "@/components/providers/LanguageProvider";
import Field from "@/components/ui/Field";

type Kind = "departure" | "return" | "both";

// Busy or not for one moment, and quieter times if busy. Never refuses.
function Busyness({
  marinaId,
  at,
  onPick,
}: {
  marinaId: string;
  at: string | null;
  onPick: (time: string) => void;
}) {
  const { t, locale } = useLanguage();
  const copy = t.help;
  const [value, setValue] = useState<SlotBusyness | null>(null);
  useEffect(() => {
    if (!at) return setValue(null);
    let live = true;
    const timer = setTimeout(
      () => void slotBusyness(marinaId, at).then((v) => live && setValue(v)),
      400
    );
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [marinaId, at]);
  if (!value) return null;
  if (!value.busy) return <p className="text-sm text-ink-soft">{copy.roomy}</p>;
  return (
    <div className="text-sm">
      <p className="font-medium text-ink">{copy.busy}</p>
      {value.quieter.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="text-ink-soft">{copy.quieter}</span>
          {value.quieter.map((slot) => (
            <button
              key={slot}
              type="button"
              onClick={() => onPick(formatClock(slot, "en-GB"))}
              className="btn-quiet min-h-11"
            >
              {formatClock(slot, locale === "en" ? "en-GB" : locale)}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// A berth holder books the dock team for leaving the berth, coming back, or
// both. After booking a departure with a return date, they are offered the
// relet flow with those dates filled in.
export default function BookHelp({
  contractId,
  marinaId,
}: {
  contractId: string;
  marinaId: string;
}) {
  const { t } = useLanguage();
  const copy = t.help;
  const [kind, setKind] = useState<Kind>("departure");
  const [leaveDate, setLeaveDate] = useState("");
  const [leaveTime, setLeaveTime] = useState("10:00");
  const [returnDate, setReturnDate] = useState("");
  const [returnTime, setReturnTime] = useState("16:00");
  const [error, setError] = useState("");
  const [booked, setBooked] = useState<{ from: string; to: string } | null>(null);
  const leaving = kind !== "return";
  const returning = kind !== "departure";
  const leaveAt = leaving && leaveDate ? lisbonToIso(leaveDate, leaveTime) : null;
  const returnAt = returning && returnDate ? lisbonToIso(returnDate, returnTime) : null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBooked(null);
    const now = Date.now();
    const valid = (at: string | null) => at !== null && new Date(at).getTime() > now;
    if ((leaving && !valid(leaveAt)) || (returning && !valid(returnAt)))
      return setError(copy.errTime);
    if (leaveAt && returnAt && returnAt <= leaveAt) return setError(copy.errTime);
    if (leaving && leaveAt) {
      const r = await bookHolderHelp(contractId, "departure", leaveAt, "");
      if (!r.ok) return setError(t.accounts.errors.unknown);
    }
    if (returning && returnAt) {
      const r = await bookHolderHelp(contractId, "return", returnAt, "");
      if (!r.ok) return setError(t.accounts.errors.unknown);
    }
    setError("");
    setBooked({ from: leaving ? leaveDate : "", to: returning ? returnDate : "" });
  }

  return (
    <form onSubmit={submit} noValidate className="stack-md">
      <h3 className="type-heading type-h3 text-ink">{copy.holderTitle}</h3>
      <p className="measure mt-2 text-ink-soft">{copy.holderIntro}</p>
      <fieldset className="mt-4">
        <legend className="field-label">{copy.kind}</legend>
        <div className="flex flex-wrap gap-x-6">
          {(["departure", "return", "both"] as const).map((k) => (
            <label
              key={k}
              className="flex min-h-11 cursor-pointer items-center gap-2 text-base text-ink"
            >
              <input
                type="radio"
                name={`help-kind-${contractId}`}
                className="h-5 w-5"
                checked={kind === k}
                onChange={() => setKind(k)}
              />
              {copy.kinds[k]}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="mt-4 grid max-w-md gap-4 sm:grid-cols-2">
        {leaving ? (
          <>
            <Field label={copy.leaveDate} htmlFor={`leave-date-${contractId}`}>
              <input
                id={`leave-date-${contractId}`}
                type="date"
                min={todayIso()}
                value={leaveDate}
                onChange={(e) => setLeaveDate(e.target.value)}
                className="field"
              />
            </Field>
            <Field label={copy.time} htmlFor={`leave-time-${contractId}`}>
              <input
                id={`leave-time-${contractId}`}
                type="time"
                value={leaveTime}
                onChange={(e) => setLeaveTime(e.target.value)}
                className="field"
              />
            </Field>
            <div className="sm:col-span-2">
              <Busyness marinaId={marinaId} at={leaveAt} onPick={setLeaveTime} />
            </div>
          </>
        ) : null}
        {returning ? (
          <>
            <Field label={copy.returnDate} htmlFor={`return-date-${contractId}`}>
              <input
                id={`return-date-${contractId}`}
                type="date"
                min={todayIso()}
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="field"
              />
            </Field>
            <Field label={copy.time} htmlFor={`return-time-${contractId}`}>
              <input
                id={`return-time-${contractId}`}
                type="time"
                value={returnTime}
                onChange={(e) => setReturnTime(e.target.value)}
                className="field"
              />
            </Field>
            <div className="sm:col-span-2">
              <Busyness marinaId={marinaId} at={returnAt} onPick={setReturnTime} />
            </div>
          </>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-error">
          {error}
        </p>
      ) : null}
      <button type="submit" className="btn-quiet mt-4 min-h-11">
        {copy.book}
      </button>
      <div role="status" className="mt-2">
        {booked ? (
          <>
            <p className="text-ink">{copy.bookedOk}</p>
            {booked.from && booked.to ? (
              <p className="mt-1">
                <Link
                  href={`/owner/relet?from=${booked.from}&to=${booked.to}`}
                  className="link inline-flex min-h-11 items-center"
                >
                  {copy.offerRelet}
                </Link>
                <span className="ml-2 text-sm text-ink-muted">{copy.offerReletHint}</span>
              </p>
            ) : null}
          </>
        ) : null}
      </div>
    </form>
  );
}
