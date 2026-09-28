"use client";

import { useState } from "react";
import { formatLongDate } from "../../lib/formatDate";
import {
  getBerthCalendar,
  type CalendarDay,
  type CalendarState,
} from "../../lib/mockData";
import { useMock } from "../../lib/useMock";
import { useAuth } from "../components/AuthProvider";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const EMPTY = { label: "", days: [] as CalendarDay[] };

// Each state differs by shape as well as tone, and the legend and every day
// carry the same words, so nothing depends on colour alone.
const STATE_CLASS: Record<CalendarState, string> = {
  none: "",
  booked: "bg-ink text-paper",
  open: "border border-ink",
  awaiting: "border border-dashed border-ink",
  away: "bg-paper-deep",
};

const STATE_WORDS: Record<CalendarState, string> = {
  none: "",
  booked: "booked",
  open: "open for reletting",
  awaiting: "awaiting approval",
  away: "away",
};

const LEGEND: Exclude<CalendarState, "none">[] = [
  "booked",
  "open",
  "awaiting",
  "away",
];

const LEGEND_LABEL: Record<Exclude<CalendarState, "none">, string> = {
  booked: "Booked",
  open: "Open for reletting",
  awaiting: "Awaiting approval",
  away: "Away",
};

function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// A month view of the holder's berth: their absences and any bookings on them.
export default function OwnerCalendar() {
  const { user } = useAuth();
  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const userId = user?.id ?? null;
  const { value: calendar } = useMock(
    () => getBerthCalendar(userId, cursor.year, cursor.month),
    EMPTY,
    `${userId}-${cursor.year}-${cursor.month}`
  );
  const today = todayIso();

  function shift(delta: number) {
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  const weeks: CalendarDay[][] = [];
  for (let i = 0; i < calendar.days.length; i += 7) {
    weeks.push(calendar.days.slice(i, i + 7));
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <p className="type-card text-ink" aria-live="polite">
          {calendar.label || " "}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => shift(-1)}
            aria-label="Previous month"
            className="btn-secondary min-w-11 px-0"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
              <path d="M12.5 4l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => shift(1)}
            aria-label="Next month"
            className="btn-secondary min-w-11 px-0"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
              <path d="M7.5 4l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <table className="mt-4 w-full table-fixed border-collapse text-center">
        <caption className="sr-only">
          Your berth, {calendar.label}. Absences and bookings are marked.
        </caption>
        <thead>
          <tr>
            {WEEKDAYS.map((d) => (
              <th key={d} scope="col" className="pb-2 text-xs font-medium text-ink/70">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, wi) => (
            <tr key={wi}>
              {week.map((day) => (
                <td key={day.iso} className="p-0.5">
                  <div
                    aria-current={day.iso === today ? "date" : undefined}
                    className={`tabular flex h-10 items-center justify-center rounded-[2px] text-sm md:h-12 ${
                      day.inMonth ? "text-ink" : "text-ink/40"
                    } ${STATE_CLASS[day.state]} ${
                      day.iso === today ? "font-bold underline underline-offset-4" : ""
                    }`}
                  >
                    <span aria-hidden="true">{day.day}</span>
                    <span className="sr-only">
                      {formatLongDate(day.iso)}
                      {day.state !== "none" ? `: ${STATE_WORDS[day.state]}` : ""}
                      {day.iso === today ? " (today)" : ""}
                    </span>
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink/75" aria-label="Key">
        {LEGEND.map((state) => (
          <li key={state} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className={`inline-block h-4 w-4 rounded-[2px] ${STATE_CLASS[state]}`}
            />
            {LEGEND_LABEL[state]}
          </li>
        ))}
      </ul>
    </div>
  );
}
