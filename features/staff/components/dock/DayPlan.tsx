"use client";

import { useMemo, useState } from "react";
import { todayIso } from "@/lib/dates";
import {
  assignJob,
  createJob,
  getEnquiries,
  listShifts,
  unassignJob,
  updateJob,
  useStaffData,
  type DockJob,
  type DockResult,
  type DockShift,
  type Enquiry,
} from "@/lib/data";
import { capacityAt, daySlots, loadBySlot, slotState, type SlotState } from "../../lib/jobs";
import { formatClock, lisbonToIso } from "../../lib/format";
import { staffError } from "../../lib/errors";
import SupabaseOnly from "../SupabaseOnly";
import { useStaffId } from "../StaffSessionProvider";
import { useStaffText } from "../StaffLanguageProvider";
import JobCard from "./JobCard";
import { namesOf, useDayJobs, useStaffContext, useTeam } from "./useDock";

const NO_SHIFTS: DockShift[] = [];
const NO_ENQUIRIES: Enquiry[] = [];

const SLOT_CLASS: Record<SlotState, string> = {
  free: "bg-surface",
  full: "bg-brass",
  over: "bg-error/40",
};

function JobControls({
  job,
  day,
  onResult,
}: {
  job: DockJob;
  day: string;
  onResult: (r: DockResult<unknown>) => void;
}) {
  const { s } = useStaffText();
  const d = s.day;
  const { marinaId } = useStaffContext();
  const team = useTeam(marinaId);
  const dockTeam = team.filter(
    (p) => (p.role === "marinheiro" || p.role === "night_watch") && !job.members.includes(p.id)
  );
  const id = `job-${job.id}`;
  const run = async (write: () => Promise<DockResult<unknown>>) => onResult(await write());

  return (
    <div className="grid w-full gap-2 text-sm sm:grid-cols-4">
      <div>
        <label htmlFor={`${id}-time`} className="staff-label">
          {d.moveTo}
        </label>
        <input
          id={`${id}-time`}
          type="time"
          defaultValue={formatClock(job.dueAt, "en-GB")}
          onBlur={(e) =>
            e.target.value &&
            e.target.value !== formatClock(job.dueAt, "en-GB") &&
            void run(() => updateJob(job.id, { dueAt: lisbonToIso(day, e.target.value) }))
          }
          className="staff-field min-h-11"
        />
      </div>
      <div>
        <label htmlFor={`${id}-people`} className="staff-label">
          {d.people}
        </label>
        <select
          id={`${id}-people`}
          value={job.peopleNeeded}
          onChange={(e) =>
            void run(() => updateJob(job.id, { peopleNeeded: Number(e.target.value) }))
          }
          className="staff-field min-h-11"
        >
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={`${id}-order`} className="staff-label">
          {d.order}
        </label>
        <input
          id={`${id}-order`}
          inputMode="numeric"
          defaultValue={job.sortOrder ?? ""}
          aria-describedby="day-order-help"
          onBlur={(e) => {
            const value = e.target.value.trim();
            const next = value === "" ? null : Number(value);
            if (next !== job.sortOrder && (next === null || Number.isInteger(next))) {
              void run(() => updateJob(job.id, { sortOrder: next }));
            }
          }}
          className="staff-field min-h-11"
        />
      </div>
      <div>
        <label htmlFor={`${id}-assign`} className="staff-label">
          {d.assign}
        </label>
        <select
          id={`${id}-assign`}
          value=""
          onChange={(e) => e.target.value && void run(() => assignJob(job.id, e.target.value))}
          className="staff-field min-h-11"
        >
          <option value="">{d.nobody}</option>
          {dockTeam.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name || s.tasks.unnamedStaff}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap gap-2 sm:col-span-4">
        {job.members.map((memberId) => (
          <button
            key={memberId}
            type="button"
            onClick={() => void run(() => unassignJob(job.id, memberId))}
            className="staff-btn min-h-11"
          >
            {d.remove(namesOf([memberId], team, s.tasks.unnamedStaff)[0] ?? "")}
          </button>
        ))}
        <button
          type="button"
          onClick={() => void run(() => updateJob(job.id, { status: "cancelled" }))}
          className="staff-btn staff-btn-ghost min-h-11"
        >
          {d.cancelJob}
        </button>
      </div>
    </div>
  );
}

function Plan() {
  const { s, dateLocale } = useStaffText();
  const d = s.day;
  const staffId = useStaffId();
  const { marinaId } = useStaffContext();
  const team = useTeam(marinaId);
  const [day, setDay] = useState(todayIso());
  const [error, setError] = useState("");
  const { jobs } = useDayJobs(day);
  const { value: shifts } = useStaffData(() => listShifts(day, day), NO_SHIFTS, day);
  const { value: enquiries } = useStaffData(
    () => getEnquiries(staffId),
    NO_ENQUIRIES,
    staffId ?? ""
  );

  const marinheiroShifts = shifts.filter(
    (sh) => team.find((p) => p.id === sh.memberId)?.role === "marinheiro"
  );
  const load = useMemo(() => loadBySlot(jobs), [jobs]);
  const slots = daySlots(day);
  const live = jobs.filter((j) => j.status !== "cancelled");
  const helped = new Set(jobs.map((j) => j.arrivalId).filter(Boolean));
  const unassisted = enquiries.filter(
    (e) =>
      e.status === "approved" &&
      !helped.has(e.id) &&
      ((e.arrivalStatus === "pending" && e.arrival === day) ||
        (e.arrivalStatus === "arrived" && e.departure === day))
  );

  const onResult = (r: DockResult<unknown>) => setError(r.ok ? "" : staffError(s, r.error));

  return (
    <div>
      <h1 className="type-heading type-h2 text-ink">{d.title}</h1>
      <label className="mt-3 block max-w-xs text-sm">
        <span className="staff-label">{d.date}</span>
        <input
          type="date"
          value={day}
          onChange={(e) => e.target.value && setDay(e.target.value)}
          className="staff-field min-h-11"
        />
      </label>

      <section className="staff-panel mt-4" aria-labelledby="day-capacity">
        <h2 id="day-capacity" className="staff-label">
          {d.capacity}
        </h2>
        <ol className="mt-2 flex flex-wrap gap-1">
          {slots.map((slot) => {
            const booked = load.get(slot) ?? 0;
            const capacity = capacityAt(slot, marinheiroShifts);
            const state = slotState(booked, capacity);
            const label = `${d.slotLabel(formatClock(slot, dateLocale), booked, capacity)}, ${d.states[state]}`;
            return (
              <li
                key={slot}
                title={label}
                className={`w-11 rounded-sm border border-ink/25 p-1 text-center text-xs ${SLOT_CLASS[state]}`}
              >
                <span className="tabular block text-ink">{formatClock(slot, dateLocale)}</span>
                <span className="tabular block font-medium text-ink">
                  {booked}/{capacity}
                </span>
                <span className="sr-only">{label}</span>
              </li>
            );
          })}
        </ol>
        <p className="mt-2 flex flex-wrap gap-3 text-xs text-ink-soft">
          {(["free", "full", "over"] as const).map((state) => (
            <span key={state} className="inline-flex items-center gap-1">
              <span
                className={`inline-block h-3 w-5 rounded-sm border border-ink/25 ${SLOT_CLASS[state]}`}
                aria-hidden="true"
              />
              {d.states[state]}
            </span>
          ))}
        </p>
      </section>

      <h2 className="type-heading type-h3 mt-6 text-ink">{d.jobsTitle(live.length)}</h2>
      <p id="day-order-help" className="text-xs text-ink-muted">
        {d.orderHelp}
      </p>
      {live.length === 0 ? <p className="staff-empty mt-2">{d.noJobs}</p> : null}
      <ul className="mt-2 space-y-3">
        {live.map((job) => (
          <li key={job.id}>
            <JobCard job={job} team={team}>
              {job.status === "done" ? null : (
                <JobControls job={job} day={day} onResult={onResult} />
              )}
            </JobCard>
          </li>
        ))}
      </ul>
      {error ? (
        <p role="alert" className="field-error mt-2">
          {error}
        </p>
      ) : null}

      <section className="mt-6" aria-labelledby="day-unassisted">
        <h2 id="day-unassisted" className="type-heading type-h3 text-ink">
          {d.unassistedTitle}
        </h2>
        {unassisted.length === 0 ? <p className="staff-empty mt-2">{d.unassistedEmpty}</p> : null}
        <ul className="mt-2 space-y-2">
          {unassisted.map((e) => {
            const departing = e.arrivalStatus === "arrived";
            const time = (departing ? e.etd : e.eta) || "12:00";
            return (
              <li
                key={e.id}
                className="staff-panel flex flex-wrap items-center justify-between gap-2 text-sm"
              >
                <span>
                  <span className="staff-badge staff-badge-outline mr-2">
                    {departing ? d.departing : d.arriving}
                  </span>
                  <span className="font-medium text-ink">{e.boatName || s.common.unnamedBoat}</span>{" "}
                  <span className="tabular text-ink-soft">
                    {time} ·{" "}
                    {e.assignedBerthId ? s.common.berthCode(e.assignedBerthId) : s.jobs.noBerth}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={async () =>
                    onResult(
                      await createJob(marinaId, {
                        jobType: departing ? "departure" : "arrival",
                        berthCode: e.assignedBerthId ?? "",
                        boatName: e.boatName,
                        lengthM: Number(e.loa) || null,
                        beamM: Number(e.beam) || null,
                        dueAt: lisbonToIso(day, time),
                        reason: "",
                        reasonNote: "",
                        peopleNeeded: null,
                        source: "staff",
                        description: "",
                      })
                    )
                  }
                  className="staff-btn min-h-11"
                >
                  {d.addHelp}
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

// The dockmaster's day: how full each half hour is against the marinheiros on
// shift, every job with its time, people and who is on it, and the arrivals
// and departures nobody booked help for.
export default function DayPlan() {
  const { s } = useStaffText();
  return (
    <SupabaseOnly title={s.day.title}>
      <Plan />
    </SupabaseOnly>
  );
}
