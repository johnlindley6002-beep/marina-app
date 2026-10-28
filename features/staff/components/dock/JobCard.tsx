"use client";

import type { ReactNode } from "react";
import type { DockJob, TeamPerson } from "@/lib/data";
import { formatClock } from "../../lib/format";
import { useStaffText } from "../StaffLanguageProvider";
import { namesOf } from "./useDock";

// One job as the dock team sees it: time, type, berth, boat and size, why,
// how many people and who is on it. Never anyone's contact details.
export default function JobCard({
  job,
  team,
  large = false,
  children,
}: {
  job: DockJob;
  team: TeamPerson[];
  large?: boolean;
  children?: ReactNode;
}) {
  const { s, dateLocale } = useStaffText();
  const j = s.jobs;
  const names = namesOf(job.members, team, s.tasks.unnamedStaff);
  const short = job.status === "to_do" && job.members.length < job.peopleNeeded;

  return (
    <article className={`staff-panel ${large ? "p-5" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className={`tabular font-semibold text-ink ${large ? "text-4xl" : "text-xl"}`}>
          {formatClock(job.dueAt, dateLocale)}
        </p>
        <span className="flex flex-wrap gap-1">
          <span className="staff-badge staff-badge-ink text-sm">{j.types[job.type]}</span>
          {job.berthCode ? (
            <span className="staff-badge staff-badge-outline text-sm">
              {s.common.berthCode(job.berthCode)}
            </span>
          ) : null}
          {short ? (
            <span className="staff-badge staff-badge-warn text-sm">{j.understaffed}</span>
          ) : null}
          {job.helpRequestedAt && job.status === "to_do" ? (
            <span className="staff-badge staff-badge-accent text-sm">{j.helpAsked}</span>
          ) : null}
          {job.status === "done" ? (
            <span className="staff-badge staff-badge-outline text-sm">{j.doneLabel}</span>
          ) : null}
          {job.status === "pending" ? (
            <span className="staff-badge staff-badge-outline text-sm">{j.waiting}</span>
          ) : null}
        </span>
      </div>
      <p className={`mt-2 font-medium text-ink ${large ? "text-2xl" : "text-lg"}`}>
        {job.boatName || j.noBoat}
      </p>
      {job.lengthM !== null ? (
        <p className="tabular text-base text-ink-soft">
          {j.size(String(job.lengthM), job.beamM === null ? "?" : String(job.beamM))}
        </p>
      ) : null}
      {job.reason || job.reasonNote || job.description ? (
        <p className="mt-1 text-base text-ink-soft">
          {[
            job.reason ? j.reasons[job.reason as keyof typeof j.reasons] : "",
            job.reasonNote,
            job.description,
          ]
            .filter(Boolean)
            .join(". ")}
        </p>
      ) : null}
      <p className="mt-2 text-base text-ink">
        {j.people(job.peopleNeeded)} · {j.staffed(job.members.length, job.peopleNeeded)}
      </p>
      {names.length > 0 ? <p className="text-sm text-ink-muted">{names.join(", ")}</p> : null}
      {children ? (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">{children}</div>
      ) : null}
    </article>
  );
}
