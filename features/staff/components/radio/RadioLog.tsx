"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { getPrimaryMarina } from "@/data/marinas";
import { addDaysIso, isoDateOfTimestamp, todayIso } from "@/lib/dates";
import {
  addRadioEntry,
  getRadioLog,
  radioEntryToArrival,
  type RadioEntry,
  useStaffData,
} from "@/lib/data";
import { formatClock, lisbonClockNow, lisbonToIso } from "../../lib/format";
import {
  validRadioChannel,
  validateRadioEntry,
  type RadioEntryErrors,
  type RadioSource,
} from "../../lib/radio";
import { useStaffAction } from "../../lib/useStaffAction";
import SupabaseOnly from "../SupabaseOnly";
import { useStaffText } from "../StaffLanguageProvider";

const NONE: RadioEntry[] = [];
const DEFAULT_CHANNEL = String(getPrimaryMarina().vhfChannel);

function QuickEntry() {
  const { s } = useStaffText();
  const r = s.radio;
  const [time, setTime] = useState(lisbonClockNow());
  const [boatName, setBoatName] = useState("");
  const [source, setSource] = useState<RadioSource>("vhf");
  const [channel, setChannel] = useState(DEFAULT_CHANNEL);
  const [request, setRequest] = useState("");
  const [errors, setErrors] = useState<RadioEntryErrors>({});
  const action = useStaffAction();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const entry = { time, boatName, source, channel, request };
    const found = validateRadioEntry(entry);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    const ok = await action.save(() =>
      addRadioEntry({
        loggedAt: lisbonToIso(todayIso(), time),
        boatName,
        source,
        channel: validRadioChannel(channel),
        request,
      })
    );
    if (ok) {
      setBoatName("");
      setRequest("");
      setTime(lisbonClockNow());
    }
  }

  const invalid = (on: boolean | undefined, id: string) =>
    on ? { "aria-invalid": true, "aria-describedby": id } : {};

  return (
    <form onSubmit={submit} noValidate className="staff-panel mt-4 grid gap-3 sm:grid-cols-4">
      <div>
        <label htmlFor="radio-time" className="staff-label">
          {r.time}
        </label>
        <input
          id="radio-time"
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="staff-field min-h-11"
          {...invalid(errors.time, "radio-time-err")}
        />
        {errors.time ? (
          <p id="radio-time-err" role="alert" className="field-error">
            {r.errTime}
          </p>
        ) : null}
      </div>
      <div className="sm:col-span-3">
        <label htmlFor="radio-boat" className="staff-label">
          {r.boatName}
        </label>
        <input
          id="radio-boat"
          value={boatName}
          onChange={(e) => setBoatName(e.target.value)}
          autoComplete="off"
          className="staff-field min-h-11"
          {...invalid(errors.boatName, "radio-boat-err")}
        />
        {errors.boatName ? (
          <p id="radio-boat-err" role="alert" className="field-error">
            {r.errBoat}
          </p>
        ) : null}
      </div>
      <div className="sm:col-span-2">
        <span className="staff-label" id="radio-source-label">
          {r.source}
        </span>
        <div
          role="group"
          aria-labelledby="radio-source-label"
          className="inline-flex rounded-md border border-ink/25 p-0.5 text-sm"
        >
          {(["vhf", "walk_in"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={source === value}
              onClick={() => setSource(value)}
              className={`min-h-11 rounded-sm px-4 ${source === value ? "bg-ink text-paper" : "text-ink-muted"}`}
            >
              {value === "vhf" ? r.vhf : r.walkIn}
            </button>
          ))}
        </div>
      </div>
      {source === "vhf" ? (
        <div className="sm:col-span-2">
          <label htmlFor="radio-channel" className="staff-label">
            {r.channel}
          </label>
          <input
            id="radio-channel"
            inputMode="numeric"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className="staff-field min-h-11 max-w-[8rem]"
            {...invalid(errors.channel, "radio-channel-err")}
          />
          {errors.channel ? (
            <p id="radio-channel-err" role="alert" className="field-error">
              {r.errChannel}
            </p>
          ) : null}
        </div>
      ) : null}
      <div className="sm:col-span-4">
        <label htmlFor="radio-request" className="staff-label">
          {r.request}
        </label>
        <textarea
          id="radio-request"
          rows={2}
          value={request}
          onChange={(e) => setRequest(e.target.value)}
          className="staff-field"
          {...invalid(errors.request, "radio-request-err")}
        />
        {errors.request ? (
          <p id="radio-request-err" role="alert" className="field-error">
            {r.errRequest}
          </p>
        ) : null}
      </div>
      <div className="sm:col-span-4">
        <button
          type="submit"
          disabled={action.busy}
          className="staff-btn staff-btn-primary min-h-11"
        >
          {r.log}
        </button>
        {action.error ? (
          <p role="alert" className="field-error mt-2">
            {action.error}
          </p>
        ) : null}
      </div>
    </form>
  );
}

function EntryRow({ entry }: { entry: RadioEntry }) {
  const { s, dateLocale } = useStaffText();
  const r = s.radio;
  const action = useStaffAction();
  return (
    <li className="staff-panel flex flex-wrap items-start justify-between gap-3 text-sm">
      <div className="min-w-0">
        <p className="font-medium text-ink">
          <span className="tabular">{formatClock(entry.loggedAt, dateLocale)}</span> ·{" "}
          {entry.boatName}{" "}
          <span className="staff-badge staff-badge-outline ml-1">
            {entry.source === "vhf" && entry.channel !== null
              ? r.viaVhf(entry.channel)
              : r.viaWalkIn}
          </span>
        </p>
        <p className="mt-1 text-ink-soft">{entry.request}</p>
      </div>
      <div>
        {entry.arrivalId ? (
          <Link href="/staff/enquiries" className="staff-btn">
            {r.arrivalMade}
          </Link>
        ) : (
          <button
            type="button"
            disabled={action.busy}
            onClick={() => void action.save(() => radioEntryToArrival(entry.id))}
            className="staff-btn"
          >
            {r.makeArrival}
          </button>
        )}
        {action.error ? (
          <p role="alert" className="field-error mt-2">
            {action.error}
          </p>
        ) : null}
      </div>
    </li>
  );
}

function Log() {
  const { s } = useStaffText();
  const r = s.radio;
  const today = todayIso();
  const since = lisbonToIso(addDaysIso(today, -6), "00:00");
  const { value: entries, ready } = useStaffData(() => getRadioLog(since), NONE, since);
  const { todays, earlier } = useMemo(
    () => ({
      todays: entries.filter((e) => isoDateOfTimestamp(e.loggedAt) === today),
      earlier: entries.filter((e) => isoDateOfTimestamp(e.loggedAt) !== today),
    }),
    [entries, today]
  );

  return (
    <div className="max-w-3xl">
      <h1 className="type-heading type-h2 text-ink">{r.title}</h1>
      <p className="mt-1 text-sm text-ink-muted">{r.intro}</p>
      <QuickEntry />

      <h2 className="type-heading type-h3 mt-6 text-ink">{r.today}</h2>
      {todays.length > 0 ? (
        <ul className="mt-2 space-y-2">
          {todays.map((e) => (
            <EntryRow key={e.id} entry={e} />
          ))}
        </ul>
      ) : (
        <p className="staff-empty mt-2">{ready ? r.empty : ""}</p>
      )}

      {earlier.length > 0 ? (
        <>
          <h2 className="type-heading type-h3 mt-6 text-ink">{r.earlier}</h2>
          <ul className="mt-2 space-y-2">
            {earlier.map((e) => (
              <EntryRow key={e.id} entry={e} />
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}

// Reception's log of VHF calls and walk-ins. Any entry can become an arrival,
// which lands in Enquiries for a decision.
export default function RadioLog() {
  const { s } = useStaffText();
  return (
    <SupabaseOnly title={s.radio.title}>
      <Log />
    </SupabaseOnly>
  );
}
