"use client";

import { useState, type FormEvent } from "react";
import { addDaysIso, formatLongDate, todayIso } from "@/lib/dates";
import { addShift, listShifts, removeShift, useStaffData, type DockShift } from "@/lib/data";
import { staffError } from "../../lib/errors";
import SupabaseOnly from "../SupabaseOnly";
import { useStaffText } from "../StaffLanguageProvider";
import { useStaffContext, useTeam } from "./useDock";

const NONE: DockShift[] = [];

function Planner() {
  const { s, dateLocale } = useStaffText();
  const sh = s.shifts;
  const { marinaId } = useStaffContext();
  const team = useTeam(marinaId);
  const [day, setDay] = useState(todayIso());
  const [member, setMember] = useState("");
  const [starts, setStarts] = useState("08:00");
  const [ends, setEnds] = useState("16:00");
  const [error, setError] = useState("");
  const { value: shifts } = useStaffData(() => listShifts(day, day), NONE, day);
  const dockTeam = team.filter(
    (p) => p.role === "marinheiro" || p.role === "night_watch" || p.role === "dockmaster"
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!member) return setError(sh.errPerson);
    if (starts === ends) return setError(sh.errTimes);
    const result = await addShift(marinaId, {
      memberId: member,
      day,
      startsAt: starts,
      endsAt: ends,
    });
    setError(result.ok ? "" : staffError(s, result.error));
  }

  return (
    <div className="max-w-2xl">
      <h1 className="type-heading type-h2 text-ink">{sh.title}</h1>
      <label className="mt-3 block max-w-xs text-sm">
        <span className="staff-label">{sh.day}</span>
        <input
          type="date"
          value={day}
          onChange={(e) => e.target.value && setDay(e.target.value)}
          className="staff-field min-h-11"
        />
      </label>

      <ul className="mt-4 space-y-2">
        {shifts.map((shift) => (
          <li
            key={shift.id}
            className="staff-panel flex flex-wrap items-center justify-between gap-2 text-base"
          >
            <span>
              <span className="font-medium text-ink">
                {team.find((p) => p.id === shift.memberId)?.name || s.tasks.unnamedStaff}
              </span>{" "}
              <span className="tabular text-ink-soft">{sh.span(shift.startsAt, shift.endsAt)}</span>
            </span>
            <button
              type="button"
              onClick={() => void removeShift(shift.id)}
              className="staff-btn min-h-11"
            >
              {sh.remove}
            </button>
          </li>
        ))}
      </ul>
      {shifts.length === 0 ? <p className="staff-empty mt-2">{sh.none}</p> : null}

      <form onSubmit={submit} noValidate className="staff-panel mt-4 grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-3">
          <label htmlFor="shift-person" className="staff-label">
            {sh.person}
          </label>
          <select
            id="shift-person"
            value={member}
            onChange={(e) => setMember(e.target.value)}
            className="staff-field min-h-11"
          >
            <option value="">{s.day.nobody}</option>
            {dockTeam.map((p) => (
              <option key={p.id} value={p.id}>
                {(p.name || s.tasks.unnamedStaff) + ", " + s.roles[p.role]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="shift-starts" className="staff-label">
            {sh.starts}
          </label>
          <input
            id="shift-starts"
            type="time"
            value={starts}
            onChange={(e) => setStarts(e.target.value)}
            className="staff-field min-h-11"
          />
        </div>
        <div>
          <label htmlFor="shift-ends" className="staff-label">
            {sh.ends}
          </label>
          <input
            id="shift-ends"
            type="time"
            value={ends}
            onChange={(e) => setEnds(e.target.value)}
            aria-describedby="shift-ends-help"
            className="staff-field min-h-11"
          />
          <p id="shift-ends-help" className="text-xs text-ink-muted">
            {sh.ends_help}
          </p>
        </div>
        <div className="flex items-end">
          <button type="submit" className="staff-btn staff-btn-primary min-h-11">
            {sh.add}
          </button>
        </div>
        {error ? (
          <p role="alert" className="field-error sm:col-span-3">
            {error}
          </p>
        ) : null}
      </form>
      <p className="mt-2 text-xs text-ink-muted">{formatLongDate(day, dateLocale)}</p>
    </div>
  );
}

function Mine() {
  const { s, dateLocale } = useStaffText();
  const sh = s.shifts;
  const { memberId } = useStaffContext();
  const today = todayIso();
  const { value: shifts } = useStaffData(
    () => listShifts(today, addDaysIso(today, 13)),
    NONE,
    today
  );
  const mine = shifts.filter((shift) => shift.memberId === memberId);

  return (
    <div className="mx-auto max-w-md">
      <h1 className="type-heading type-h2 text-ink">{sh.myTitle}</h1>
      {mine.length === 0 ? <p className="staff-empty mt-3">{sh.noneMine}</p> : null}
      <ul className="mt-3 space-y-2">
        {mine.map((shift) => (
          <li key={shift.id} className="staff-panel text-lg text-ink">
            <p className="font-medium">{formatLongDate(shift.day, dateLocale)}</p>
            <p className="tabular">{sh.span(shift.startsAt, shift.endsAt)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

// The dockmaster plans shifts; each marinheiro and the night watch see theirs.
export function ShiftPlanner() {
  const { s } = useStaffText();
  return (
    <SupabaseOnly title={s.shifts.title}>
      <Planner />
    </SupabaseOnly>
  );
}

export function MyShifts() {
  const { s } = useStaffText();
  return (
    <SupabaseOnly title={s.shifts.myTitle}>
      <Mine />
    </SupabaseOnly>
  );
}
