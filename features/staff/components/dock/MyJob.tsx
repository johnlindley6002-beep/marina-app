"use client";

import { useEffect, useState } from "react";
import { todayIso } from "@/lib/dates";
import { claimJob, completeJob, requestJobHelp, unassignJob, type DockResult } from "@/lib/data";
import { nextJob, pontoonOf } from "../../lib/jobs";
import { staffError } from "../../lib/errors";
import SupabaseOnly from "../SupabaseOnly";
import { useStaffText } from "../StaffLanguageProvider";
import JobCard from "./JobCard";
import { useDayJobs, useStaffContext, useTeam } from "./useDock";

type Permission = "default" | "granted" | "denied" | "unsupported";

function readPermission(): Permission {
  return typeof Notification === "undefined" ? "unsupported" : Notification.permission;
}

// Asks once for notifications; a phone that cannot or will not keeps the
// in-app alerts.
function NotifyButton() {
  const { s } = useStaffText();
  const m = s.myJob;
  const [permission, setPermission] = useState<Permission>("default");
  useEffect(() => setPermission(readPermission()), []);

  if (permission === "granted") return <p className="text-sm text-ink-muted">{m.notifyReady}</p>;
  if (permission === "denied" || permission === "unsupported") {
    return <p className="text-sm text-ink-muted">{m.notifyBlocked}</p>;
  }
  return (
    <div>
      <button
        type="button"
        onClick={async () => setPermission(await Notification.requestPermission())}
        className="staff-btn min-h-12 w-full text-base"
      >
        {m.notifyOn}
      </button>
      <p className="mt-1 text-sm text-ink-muted">{m.notifyOnHelp}</p>
    </div>
  );
}

function Job() {
  const { s } = useStaffText();
  const m = s.myJob;
  const j = s.jobs;
  const { marinaId, memberId } = useStaffContext();
  const { jobs, ready } = useDayJobs(todayIso());
  const team = useTeam(marinaId);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const me = memberId ?? "";
  const mine = jobs
    .filter((job) => job.status === "to_do" && job.members.includes(me))
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const lastDone = jobs
    .filter((job) => job.status === "done" && job.members.includes(me))
    .sort((a, b) => (b.doneAt ?? "").localeCompare(a.doneAt ?? ""))[0];
  const current = mine[0] ?? null;
  const suggestion = current ? null : nextJob(jobs, me, pontoonOf(lastDone?.berthCode ?? null));

  async function act(action: () => Promise<DockResult>, done = "") {
    setBusy(true);
    setError("");
    const result = await action();
    setBusy(false);
    if (result.ok) setMessage(done);
    else setError(staffError(s, result.error));
  }

  if (!ready) return <div className="min-h-[24rem]" aria-hidden="true" />;

  return (
    <div className="mx-auto max-w-md">
      <h1 className="type-heading type-h2 text-ink">{m.title}</h1>
      <div className="mt-4">
        {current ? (
          <>
            <p className="staff-label">{m.current}</p>
            <JobCard job={current} team={team} large>
              <button
                type="button"
                disabled={busy}
                onClick={() => void act(() => completeJob(current.id))}
                className="staff-btn staff-btn-primary min-h-14 w-full text-lg"
              >
                {j.done}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void act(() => requestJobHelp(current.id), j.helpSent)}
                className="staff-btn min-h-14 w-full text-lg"
              >
                {j.needHelp}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void act(() => unassignJob(current.id, me))}
                className="staff-btn staff-btn-ghost min-h-12 w-full text-base"
              >
                {j.leave}
              </button>
            </JobCard>
          </>
        ) : suggestion ? (
          <>
            <p className="staff-label">{m.suggested}</p>
            <JobCard job={suggestion} team={team} large>
              <button
                type="button"
                disabled={busy}
                onClick={() => void act(() => claimJob(suggestion.id))}
                className="staff-btn staff-btn-primary min-h-14 w-full text-lg"
              >
                {j.claim}
              </button>
            </JobCard>
          </>
        ) : (
          <p className="staff-panel text-lg text-ink">{m.nothing}</p>
        )}
      </div>
      <p role="status" className="mt-3 min-h-6 text-base text-ink">
        {message}
      </p>
      {error ? (
        <p role="alert" className="field-error text-base">
          {error}
        </p>
      ) : null}
      {mine.length > 1 ? (
        <ul className="mt-4 space-y-2">
          {mine.slice(1).map((job) => (
            <li key={job.id}>
              <JobCard job={job} team={team} />
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-6">
        <NotifyButton />
      </div>
    </div>
  );
}

// The marinheiro's phone screen: the job they are on, or the next one to
// take. When one is done the next appears on its own.
export default function MyJob() {
  const { s } = useStaffText();
  return (
    <SupabaseOnly title={s.myJob.title}>
      <Job />
    </SupabaseOnly>
  );
}
