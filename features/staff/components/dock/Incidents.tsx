"use client";

import { useState, type FormEvent } from "react";
import { formatLongDate, todayIso } from "@/lib/dates";
import { fileIncident, listIncidents, useStaffData, type Incident } from "@/lib/data";
import { formatClock, lisbonClockNow, lisbonToIso } from "../../lib/format";
import { staffError } from "../../lib/errors";
import SupabaseOnly from "../SupabaseOnly";
import { useStaffText } from "../StaffLanguageProvider";
import { useStaffContext } from "./useDock";

const NONE: Incident[] = [];

function Reports() {
  const { s, dateLocale } = useStaffText();
  const t = s.incidents;
  const { marinaId } = useStaffContext();
  const { value: reports } = useStaffData(listIncidents, NONE);
  const [time, setTime] = useState(lisbonClockNow());
  const [berth, setBerth] = useState("");
  const [what, setWhat] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDone(false);
    if (!what.trim()) return setError(t.errWhat);
    const result = await fileIncident(marinaId, {
      occurredAt: lisbonToIso(todayIso(), time),
      berthCode: berth,
      description: what,
    });
    if (!result.ok) return setError(staffError(s, result.error));
    setError("");
    setWhat("");
    setBerth("");
    setDone(true);
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="type-heading type-h2 text-ink">{t.title}</h1>
      <form onSubmit={submit} noValidate className="staff-panel mt-4 grid gap-3">
        <div>
          <label htmlFor="incident-time" className="staff-label">
            {t.when}
          </label>
          <input
            id="incident-time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="staff-field min-h-12 text-base"
          />
        </div>
        <div>
          <label htmlFor="incident-berth" className="staff-label">
            {t.berth}
          </label>
          <input
            id="incident-berth"
            value={berth}
            onChange={(e) => setBerth(e.target.value)}
            autoCapitalize="characters"
            className="staff-field min-h-12 text-base"
          />
        </div>
        <div>
          <label htmlFor="incident-what" className="staff-label">
            {t.what}
          </label>
          <textarea
            id="incident-what"
            rows={4}
            value={what}
            onChange={(e) => setWhat(e.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "incident-err" : undefined}
            className="staff-field text-base"
          />
        </div>
        {error ? (
          <p id="incident-err" role="alert" className="field-error">
            {error}
          </p>
        ) : null}
        <button type="submit" className="staff-btn staff-btn-primary min-h-14 w-full text-lg">
          {t.file}
        </button>
        <p role="status" className="min-h-6 text-base text-ink">
          {done ? t.filed : ""}
        </p>
      </form>

      <h2 className="type-heading type-h3 mt-6 text-ink">{t.recent}</h2>
      {reports.length === 0 ? <p className="staff-empty mt-2">{t.none}</p> : null}
      <ul className="mt-2 space-y-2">
        {reports.map((r) => (
          <li key={r.id} className="staff-panel text-sm">
            <p className="tabular text-ink-muted">
              {formatLongDate(r.occurredAt, dateLocale)} {formatClock(r.occurredAt, dateLocale)}
              {r.berthCode ? ` · ${s.common.berthCode(r.berthCode)}` : ""}
            </p>
            <p className="mt-1 text-ink">{r.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Incidents() {
  const { s } = useStaffText();
  return (
    <SupabaseOnly title={s.incidents.title}>
      <Reports />
    </SupabaseOnly>
  );
}
