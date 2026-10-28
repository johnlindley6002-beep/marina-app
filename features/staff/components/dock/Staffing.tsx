"use client";

import { addDaysIso, formatLongDate, todayIso } from "@/lib/dates";
import { listJobs, listShifts, useStaffData, type DockJob, type DockShift } from "@/lib/data";
import { busyHours, staffingByHour } from "../../lib/jobs";
import { formatClock, lisbonToIso } from "../../lib/format";
import SupabaseOnly from "../SupabaseOnly";
import { useStaffText } from "../StaffLanguageProvider";
import { useDayJobs, useStaffContext, useTeam } from "./useDock";

const NO_SHIFTS: DockShift[] = [];
const NO_JOBS: DockJob[] = [];

const STATE_CLASS = {
  under: "staff-badge-warn",
  over: "staff-badge-accent",
  ok: "staff-badge-outline",
} as const;

// Shades of the busiest hour, from the ink token.
const SHADES = ["bg-surface", "bg-ink/10", "bg-ink/25", "bg-ink/45", "bg-ink/70"];

function View() {
  const { s, dateLocale } = useStaffText();
  const st = s.staffing;
  const { marinaId } = useStaffContext();
  const team = useTeam(marinaId);
  const tomorrow = addDaysIso(todayIso(), 1);
  const { jobs } = useDayJobs(tomorrow);
  const { value: shifts } = useStaffData(() => listShifts(tomorrow, tomorrow), NO_SHIFTS, tomorrow);
  // The season so far: the last 180 days of finished jobs.
  const since = lisbonToIso(addDaysIso(todayIso(), -180), "00:00");
  const { value: history } = useStaffData(
    async () => (await listJobs(since, lisbonToIso(todayIso(), "00:00"))) ?? NO_JOBS,
    NO_JOBS,
    since
  );
  const marinheiros = shifts.filter(
    (sh) => team.find((p) => p.id === sh.memberId)?.role === "marinheiro"
  );
  const hours = staffingByHour(tomorrow, jobs, marinheiros).filter(
    (h) => h.needed > 0 || h.onShift > 0
  );
  const { grid, max } = busyHours(history);

  return (
    <div>
      <h1 className="type-heading type-h2 text-ink">{st.title}</h1>
      <h2 className="type-heading type-h3 mt-4 text-ink">
        {st.tomorrow(formatLongDate(tomorrow, dateLocale))}
      </h2>
      <div
        className="staff-table-wrap mt-2"
        tabIndex={0}
        role="region"
        aria-label={st.tomorrow(tomorrow)}
      >
        <table className="staff-table w-full text-left text-sm">
          <thead>
            <tr>
              <th scope="col">{st.hour}</th>
              <th scope="col">{st.needed}</th>
              <th scope="col">{st.onShift}</th>
              <th scope="col">{s.team.status}</th>
            </tr>
          </thead>
          <tbody>
            {hours.map((h) => (
              <tr key={h.hourIso}>
                <td className="tabular">{formatClock(h.hourIso, dateLocale)}</td>
                <td className="tabular">{h.needed}</td>
                <td className="tabular">{h.onShift}</td>
                <td>
                  <span className={`staff-badge ${STATE_CLASS[h.state]}`}>
                    {st.states[h.state]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="type-heading type-h3 mt-6 text-ink">{st.history}</h2>
      <p className="text-xs text-ink-muted">{st.historyHelp}</p>
      {max === 0 ? (
        <p className="staff-empty mt-2">{st.historyEmpty}</p>
      ) : (
        <div className="staff-table-wrap mt-2" tabIndex={0} role="region" aria-label={st.history}>
          <table className="border-collapse text-xs">
            <thead>
              <tr>
                <th scope="col" className="px-1" />
                {Array.from({ length: 16 }, (_, i) => i + 6).map((hour) => (
                  <th
                    key={hour}
                    scope="col"
                    className="tabular w-8 px-1 text-center font-medium text-ink-muted"
                  >
                    {hour}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grid.map((row, weekday) => (
                <tr key={weekday}>
                  <th scope="row" className="px-1 text-left font-medium text-ink">
                    {st.weekdays[weekday]}
                  </th>
                  {row.slice(6, 22).map((n, i) => {
                    const shade =
                      SHADES[
                        Math.min(SHADES.length - 1, Math.ceil((n / max) * (SHADES.length - 1)))
                      ];
                    const label = st.cell(st.weekdays[weekday] ?? "", i + 6, n);
                    return (
                      <td
                        key={i}
                        title={label}
                        className={`h-7 w-8 border border-hairline ${shade}`}
                      >
                        <span className="sr-only">{label}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Tomorrow's booked workload against the people on shift, hour by hour, and
// the season's busy and quiet hours to plan shifts from.
export default function Staffing() {
  const { s } = useStaffText();
  return (
    <SupabaseOnly title={s.staffing.title}>
      <View />
    </SupabaseOnly>
  );
}
