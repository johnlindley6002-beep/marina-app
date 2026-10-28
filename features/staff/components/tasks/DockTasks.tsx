"use client";

import { useMemo, useState, type FormEvent } from "react";
import { todayIso } from "@/lib/dates";
import {
  claimJob,
  completeJob,
  createJob,
  getPlannerBerths,
  setMyName,
  useStaffData,
  type DockResult,
  type PlannerBerth,
} from "@/lib/data";
import { lisbonClockNow, lisbonToIso } from "../../lib/format";
import { isOverdue, validateTask, type NewTaskErrors } from "../../lib/tasks";
import { peopleForLength, type JobType } from "../../lib/jobs";
import { parseMetres } from "../../lib/reception";
import { staffError } from "../../lib/errors";
import SupabaseOnly from "../SupabaseOnly";
import { useStaffText } from "../StaffLanguageProvider";
import JobCard from "../dock/JobCard";
import { useDayJobs, useStaffContext, useTeam } from "../dock/useDock";

type Filter = "to_do" | "done" | "all";
const NO_BERTHS: PlannerBerth[] = [];
const JOB_TYPES: JobType[] = ["arrival", "departure", "return", "power", "inspection", "other"];

function YourName() {
  const { s } = useStaffText();
  const t = s.tasks;
  const { displayName, memberId } = useStaffContext();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  if (!memberId || displayName) return null;
  return (
    <form
      className="staff-panel mt-4"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!name.trim()) return;
        const result = await setMyName(name);
        setError(result.ok ? "" : staffError(s, result.error));
      }}
    >
      <label htmlFor="task-my-name" className="staff-label">
        {t.yourName}
      </label>
      <p id="task-my-name-help" className="text-xs text-ink-muted">
        {t.yourNameHelp}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <input
          id="task-my-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          aria-describedby="task-my-name-help"
          className="staff-field min-h-12 max-w-xs text-base"
        />
        <button type="submit" className="staff-btn staff-btn-primary min-h-12">
          {t.saveName}
        </button>
      </div>
      {error ? (
        <p role="alert" className="field-error mt-2">
          {error}
        </p>
      ) : null}
    </form>
  );
}

function NewJobForm() {
  const { s } = useStaffText();
  const j = s.jobs;
  const { marinaId } = useStaffContext();
  const { value: berths } = useStaffData(getPlannerBerths, NO_BERTHS);
  const codes = useMemo(() => new Set(berths.map((b) => b.code)), [berths]);
  const [type, setType] = useState<JobType>("arrival");
  const [berth, setBerth] = useState("");
  const [boat, setBoat] = useState("");
  const [length, setLength] = useState("");
  const [beam, setBeam] = useState("");
  const [date, setDate] = useState(todayIso());
  const [time, setTime] = useState(lisbonClockNow());
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [people, setPeople] = useState("");
  const [source, setSource] = useState<"staff" | "walk_in" | "vhf">("staff");
  const [errors, setErrors] = useState<NewTaskErrors & { size?: true }>({});
  const [result, setResult] = useState<DockResult<string> | null>(null);

  const lengthValue = parseMetres(length);
  const suggested = peopleForLength(typeof lengthValue === "number" ? lengthValue : null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found: NewTaskErrors & { size?: true } = validateTask(
      { berthCode: berth, description: "x", date, time },
      codes
    );
    if (parseMetres(length) === "invalid" || parseMetres(beam) === "invalid") found.size = true;
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    const beamValue = parseMetres(beam);
    const created = await createJob(marinaId, {
      jobType: type,
      berthCode: berth.trim().toUpperCase(),
      boatName: boat,
      lengthM: typeof lengthValue === "number" ? lengthValue : null,
      beamM: typeof beamValue === "number" ? beamValue : null,
      dueAt: lisbonToIso(date, time),
      reason,
      reasonNote: note,
      peopleNeeded: people ? Number(people) : null,
      source,
      description: "",
    });
    setResult(created);
    if (created.ok) {
      setBoat("");
      setBerth("");
      setNote("");
    }
  }

  const invalid = (on: boolean | undefined, id: string) =>
    on ? { "aria-invalid": true, "aria-describedby": id } : {};

  return (
    <details className="staff-panel mt-4">
      <summary className="min-h-11 cursor-pointer py-2 text-base font-medium text-ink">
        {j.create}
      </summary>
      <form onSubmit={submit} noValidate className="mt-2 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="job-type" className="staff-label">
            {j.type}
          </label>
          <select
            id="job-type"
            value={type}
            onChange={(e) => setType(e.target.value as JobType)}
            className="staff-field min-h-12 text-base"
          >
            {JOB_TYPES.map((t) => (
              <option key={t} value={t}>
                {j.types[t]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="job-source" className="staff-label">
            {j.source}
          </label>
          <select
            id="job-source"
            value={source}
            onChange={(e) => setSource(e.target.value as typeof source)}
            className="staff-field min-h-12 text-base"
          >
            {(["staff", "walk_in", "vhf"] as const).map((v) => (
              <option key={v} value={v}>
                {j.sources[v]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="job-berth" className="staff-label">
            {j.berth}
          </label>
          <input
            id="job-berth"
            list="job-berth-codes"
            value={berth}
            onChange={(e) => setBerth(e.target.value)}
            autoCapitalize="characters"
            className="staff-field min-h-12 text-base"
            {...invalid(errors.berthCode, "job-berth-err")}
          />
          <datalist id="job-berth-codes">
            {berths.map((b) => (
              <option key={b.code} value={b.code} />
            ))}
          </datalist>
          {errors.berthCode ? (
            <p id="job-berth-err" role="alert" className="field-error">
              {j.errBerth}
            </p>
          ) : null}
        </div>
        <div>
          <label htmlFor="job-boat" className="staff-label">
            {j.boat}
          </label>
          <input
            id="job-boat"
            value={boat}
            onChange={(e) => setBoat(e.target.value)}
            autoComplete="off"
            className="staff-field min-h-12 text-base"
          />
        </div>
        <div>
          <label htmlFor="job-length" className="staff-label">
            {j.lengthM}
          </label>
          <input
            id="job-length"
            inputMode="decimal"
            value={length}
            onChange={(e) => setLength(e.target.value)}
            className="staff-field min-h-12 text-base"
            {...invalid(errors.size, "job-size-err")}
          />
        </div>
        <div>
          <label htmlFor="job-beam" className="staff-label">
            {j.beamM}
          </label>
          <input
            id="job-beam"
            inputMode="decimal"
            value={beam}
            onChange={(e) => setBeam(e.target.value)}
            className="staff-field min-h-12 text-base"
            {...invalid(errors.size, "job-size-err")}
          />
        </div>
        {errors.size ? (
          <p id="job-size-err" role="alert" className="field-error sm:col-span-2">
            {j.errNumber}
          </p>
        ) : null}
        <div>
          <label htmlFor="job-date" className="staff-label">
            {j.date}
          </label>
          <input
            id="job-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="staff-field min-h-12 text-base"
            {...invalid(errors.when, "job-when-err")}
          />
        </div>
        <div>
          <label htmlFor="job-time" className="staff-label">
            {j.when}
          </label>
          <input
            id="job-time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="staff-field min-h-12 text-base"
            {...invalid(errors.when, "job-when-err")}
          />
        </div>
        {errors.when ? (
          <p id="job-when-err" role="alert" className="field-error sm:col-span-2">
            {j.errWhen}
          </p>
        ) : null}
        <div>
          <label htmlFor="job-reason" className="staff-label">
            {j.reason}
          </label>
          <select
            id="job-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="staff-field min-h-12 text-base"
          >
            <option value="">{j.noReason}</option>
            {(["short_handed", "first_time", "other"] as const).map((r) => (
              <option key={r} value={r}>
                {j.reasons[r]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="job-people" className="staff-label">
            {j.peopleNeeded}
          </label>
          <select
            id="job-people"
            value={people}
            onChange={(e) => setPeople(e.target.value)}
            aria-describedby="job-people-help"
            className="staff-field min-h-12 text-base"
          >
            <option value="">{j.people(suggested)}</option>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <p id="job-people-help" className="text-xs text-ink-muted">
            {j.peopleSuggested(suggested)}
          </p>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="job-note" className="staff-label">
            {j.reasonNote}
          </label>
          <input
            id="job-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="staff-field min-h-12 text-base"
          />
        </div>
        <div className="sm:col-span-2">
          <button
            type="submit"
            className="staff-btn staff-btn-primary min-h-12 w-full text-base sm:w-auto"
          >
            {j.add}
          </button>
          <p role="status" className="mt-1 text-sm text-ink">
            {result?.ok ? j.added : ""}
          </p>
          {result && !result.ok ? (
            <p role="alert" className="field-error">
              {staffError(s, result.error)}
            </p>
          ) : null}
        </div>
      </form>
    </details>
  );
}

function Jobs() {
  const { s } = useStaffText();
  const t = s.tasks;
  const j = s.jobs;
  const { marinaId, memberId, capabilities } = useStaffContext();
  const { jobs, ready } = useDayJobs(todayIso());
  const team = useTeam(marinaId);
  const [filter, setFilter] = useState<Filter>("to_do");
  const [mine, setMine] = useState(false);
  const [error, setError] = useState("");
  const claims = capabilities.includes("claim_jobs");
  const plans = capabilities.includes("plan_day");
  const me = memberId ?? "";

  const todo = jobs.filter((job) => job.status === "to_do");
  const shown = jobs
    .filter((job) => job.status !== "cancelled")
    .filter((job) => filter === "all" || job.status === filter)
    .filter((job) => !mine || job.members.includes(me))
    .sort((a, b) =>
      a.status === b.status
        ? a.dueAt.localeCompare(b.dueAt)
        : a.status === "to_do"
          ? -1
          : b.status === "to_do"
            ? 1
            : 0
    );

  async function run(write: () => Promise<DockResult>) {
    const result = await write();
    setError(result.ok ? "" : staffError(s, result.error));
  }

  if (!ready) return <div className="min-h-[24rem]" aria-hidden="true" />;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="type-heading type-h2 text-ink">{t.title}</h1>
      <YourName />
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div
          role="group"
          aria-label={t.filterLabel}
          className="inline-flex rounded-md border border-ink/25 p-0.5 text-sm"
        >
          {(["to_do", "done", "all"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
              className={`min-h-11 rounded-sm px-3 ${filter === value ? "bg-ink text-paper" : "text-ink-muted"}`}
            >
              {value === "to_do" ? t.todo(todo.length) : value === "done" ? t.done : t.all}
            </button>
          ))}
        </div>
        {memberId ? (
          <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              className="h-5 w-5"
              checked={mine}
              onChange={(e) => setMine(e.target.checked)}
            />
            {t.mine}
          </label>
        ) : null}
      </div>
      {capabilities.some((c) => c === "create_jobs" || c === "plan_day" || c === "assign_jobs") ? (
        <NewJobForm />
      ) : null}
      <ul className="mt-4 space-y-3">
        {shown.map((job) => {
          const onIt = job.members.includes(me);
          return (
            <li key={job.id}>
              <JobCard job={job} team={team}>
                {isOverdue(
                  { status: job.status === "to_do" ? "to_do" : "done", dueAt: job.dueAt },
                  new Date()
                ) ? (
                  <span className="staff-badge staff-badge-warn">{t.overdue}</span>
                ) : null}
                {job.status === "to_do" && claims && !onIt ? (
                  <button
                    type="button"
                    onClick={() => void run(() => claimJob(job.id))}
                    className="staff-btn staff-btn-primary min-h-12 w-full text-base sm:w-auto"
                  >
                    {j.claim}
                  </button>
                ) : null}
                {job.status === "to_do" && (onIt || plans) ? (
                  <button
                    type="button"
                    onClick={() => void run(() => completeJob(job.id))}
                    className="staff-btn min-h-12 w-full text-base sm:w-auto"
                  >
                    {j.done}
                  </button>
                ) : null}
              </JobCard>
            </li>
          );
        })}
      </ul>
      {shown.length === 0 ? <p className="staff-empty mt-4">{t.empty}</p> : null}
      {error ? (
        <p role="alert" className="field-error mt-2">
          {error}
        </p>
      ) : null}
    </div>
  );
}

// Today's jobs for the whole team: add one (the desk, the night watch, a
// walk-in or a VHF call), claim one, mark one done.
export default function DockTasks() {
  const { s } = useStaffText();
  return (
    <SupabaseOnly title={s.tasks.title}>
      <Jobs />
    </SupabaseOnly>
  );
}
