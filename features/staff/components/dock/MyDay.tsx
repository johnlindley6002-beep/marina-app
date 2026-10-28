"use client";

import { useState } from "react";
import { todayIso } from "@/lib/dates";
import { claimJob } from "@/lib/data";
import { staffError } from "../../lib/errors";
import SupabaseOnly from "../SupabaseOnly";
import { useStaffText } from "../StaffLanguageProvider";
import JobCard from "./JobCard";
import { useDayJobs, useStaffContext, useTeam } from "./useDock";

function Day() {
  const { s } = useStaffText();
  const d = s.myDay;
  const { marinaId, memberId } = useStaffContext();
  const { jobs } = useDayJobs(todayIso());
  const team = useTeam(marinaId);
  const [error, setError] = useState("");
  const me = memberId ?? "";
  const mine = jobs.filter((job) => job.members.includes(me) && job.status !== "cancelled");
  const open = jobs.filter(
    (job) =>
      job.status === "to_do" && !job.members.includes(me) && job.members.length < job.peopleNeeded
  );

  return (
    <div className="mx-auto max-w-md">
      <h1 className="type-heading type-h2 text-ink">{d.title}</h1>
      <h2 className="type-heading type-h3 mt-4 text-ink">{d.mine}</h2>
      {mine.length === 0 ? <p className="staff-empty mt-2">{d.noneMine}</p> : null}
      <ul className="mt-2 space-y-2">
        {mine.map((job) => (
          <li key={job.id}>
            <JobCard job={job} team={team} />
          </li>
        ))}
      </ul>
      <h2 className="type-heading type-h3 mt-6 text-ink">{d.open}</h2>
      {open.length === 0 ? <p className="staff-empty mt-2">{s.jobs.emptyOpen}</p> : null}
      <ul className="mt-2 space-y-2">
        {open.map((job) => (
          <li key={job.id}>
            <JobCard job={job} team={team}>
              <button
                type="button"
                onClick={async () => {
                  const result = await claimJob(job.id);
                  setError(result.ok ? "" : staffError(s, result.error));
                }}
                className="staff-btn staff-btn-primary min-h-12 w-full text-base"
              >
                {s.jobs.claim}
              </button>
            </JobCard>
          </li>
        ))}
      </ul>
      {error ? (
        <p role="alert" className="field-error mt-2 text-base">
          {error}
        </p>
      ) : null}
    </div>
  );
}

// Today for a marinheiro: the jobs they are on and the open ones to claim.
export default function MyDay() {
  const { s } = useStaffText();
  return (
    <SupabaseOnly title={s.myDay.title}>
      <Day />
    </SupabaseOnly>
  );
}
