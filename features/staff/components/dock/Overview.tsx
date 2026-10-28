"use client";

import Link from "next/link";
import { useState } from "react";
import { formatLongDate, todayIso } from "@/lib/dates";
import {
  getBerthStatuses,
  getEnquiries,
  listShifts,
  useStaffData,
  type BerthOperationalInfo,
  type DockShift,
  type Enquiry,
} from "@/lib/data";
import { shiftSpan } from "../../lib/jobs";
import SupabaseOnly from "../SupabaseOnly";
import { useStaffId } from "../StaffSessionProvider";
import { useStaffText } from "../StaffLanguageProvider";
import { useDayJobs, useStaffContext, useTeam } from "./useDock";

const NO_ENQUIRIES: Enquiry[] = [];
const NO_STATUSES: Record<string, BerthOperationalInfo> = {};
const NO_SHIFTS: DockShift[] = [];

function Kpi({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="staff-kpi">
      <p className="staff-kpi-value tabular">{value}</p>
      <p className="text-xs text-ink-muted">{label}</p>
    </div>
  );
}

function Board() {
  const { s, dateLocale } = useStaffText();
  const o = s.overview;
  const staffId = useStaffId();
  const { marinaId } = useStaffContext();
  const team = useTeam(marinaId);
  const today = todayIso();
  const { value: enquiries } = useStaffData(
    () => getEnquiries(staffId),
    NO_ENQUIRIES,
    staffId ?? ""
  );
  const { value: statuses } = useStaffData(
    () => getBerthStatuses(marinaId, today),
    NO_STATUSES,
    today
  );
  const { value: shifts } = useStaffData(() => listShifts(today, today), NO_SHIFTS, today);
  const { jobs } = useDayJobs(today);

  const approved = enquiries.filter((e) => e.status === "approved");
  const arrivals = approved.filter((e) => e.arrival === today).length;
  const departures = approved.filter((e) => !e.openEnded && e.departure === today).length;
  const all = Object.values(statuses);
  const used = all.filter((x) => x.status !== "free" && x.status !== "out-of-service").length;
  const open = jobs.filter((j) => j.status === "to_do");
  const short = open.filter((j) => j.members.length < j.peopleNeeded);
  // The moment the overview opened; live updates re-read the data, not the clock.
  const [now] = useState(() => Date.now());
  const onDuty = [
    ...new Set(
      shifts
        .filter((sh) => {
          const { start, end } = shiftSpan(sh);
          return start <= now && now < end;
        })
        .map((sh) => sh.memberId)
    ),
  ]
    .map((id) => team.find((p) => p.id === id))
    .filter((p) => p !== undefined);

  return (
    <div>
      <h1 className="type-heading type-h2 text-ink">{o.title}</h1>
      <p className="mt-1 text-sm text-ink-muted">{o.today(formatLongDate(today, dateLocale))}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Kpi value={arrivals} label={o.arrivals} />
        <Kpi value={departures} label={o.departures} />
        <Kpi value={o.occupancyValue(used, all.length)} label={o.occupancy} />
        <Kpi value={open.length} label={o.openJobs} />
        <Kpi value={short.length} label={o.understaffedJobs} />
      </div>
      <section className="staff-panel mt-4" aria-labelledby="overview-duty">
        <h2 id="overview-duty" className="type-heading type-h3 text-ink">
          {o.onDuty}
        </h2>
        {onDuty.length === 0 ? (
          <p className="staff-empty mt-2">{o.nobodyOnDuty}</p>
        ) : (
          <ul className="mt-2 flex flex-wrap gap-2 text-sm">
            {onDuty.map((p) => (
              <li key={p.id} className="staff-chip">
                {(p.name || s.tasks.unnamedStaff) + ", " + s.roles[p.role]}
              </li>
            ))}
          </ul>
        )}
      </section>
      <Link href="/staff/day" className="staff-btn staff-btn-primary mt-4">
        {o.seeDay}
      </Link>
    </div>
  );
}

// The director's morning view: today's arrivals and departures, how full the
// marina is, jobs open and short of people, and who is working now.
export default function Overview() {
  const { s } = useStaffText();
  return (
    <SupabaseOnly title={s.overview.title}>
      <Board />
    </SupabaseOnly>
  );
}
