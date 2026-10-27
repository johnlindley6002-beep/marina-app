"use client";

import { useMemo, useState, type FormEvent } from "react";
import { formatLongDate, isoDateOfTimestamp, todayIso } from "@/lib/dates";
import {
  addTask,
  getTaskBoard,
  setMyDisplayName,
  setTaskStatus,
  type TaskBoard,
  useStaffData,
} from "@/lib/data";
import { formatClock, lisbonClockNow, lisbonToIso } from "../../lib/format";
import {
  isOverdue,
  sortTasks,
  validateTask,
  type DockTask,
  type NewTaskErrors,
} from "../../lib/tasks";
import { useStaffAction } from "../../lib/useStaffAction";
import SupabaseOnly from "../SupabaseOnly";
import { useStaffText } from "../StaffLanguageProvider";

type Filter = "to_do" | "done" | "all";

function YourName({ board }: { board: TaskBoard }) {
  const { s } = useStaffText();
  const t = s.tasks;
  const [name, setName] = useState("");
  const action = useStaffAction();
  if (!board.me || board.me.name) return null;
  return (
    <form
      className="staff-panel mt-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (name.trim()) void action.save(() => setMyDisplayName(name));
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
        <button
          type="submit"
          disabled={action.busy}
          className="staff-btn staff-btn-primary min-h-12"
        >
          {t.saveName}
        </button>
      </div>
      {action.error ? (
        <p role="alert" className="field-error mt-2">
          {action.error}
        </p>
      ) : null}
    </form>
  );
}

function NewTaskForm({ board }: { board: TaskBoard }) {
  const { s } = useStaffText();
  const t = s.tasks;
  const [berth, setBerth] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(todayIso());
  const [time, setTime] = useState(lisbonClockNow());
  const [assignee, setAssignee] = useState("");
  const [errors, setErrors] = useState<NewTaskErrors>({});
  const action = useStaffAction();
  const berthIds = useMemo(() => new Map(board.berths.map((b) => [b.code, b.id])), [board.berths]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validateTask(
      { berthCode: berth, description, date, time },
      new Set(berthIds.keys())
    );
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    const code = berth.trim().toUpperCase();
    const ok = await action.save(() =>
      addTask({
        berthId: code ? (berthIds.get(code) ?? null) : null,
        description,
        dueAt: lisbonToIso(date, time),
        assignedTo: assignee || null,
      })
    );
    if (ok) {
      setBerth("");
      setDescription("");
    }
  }

  const err = (on: boolean | undefined, id: string) =>
    on ? { "aria-invalid": true, "aria-describedby": id } : {};

  return (
    <details className="staff-panel mt-4">
      <summary className="min-h-11 cursor-pointer py-2 text-base font-medium text-ink">
        {t.newTask}
      </summary>
      <form onSubmit={submit} noValidate className="mt-2 grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="task-description" className="staff-label">
            {t.description}
          </label>
          <textarea
            id="task-description"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="staff-field text-base"
            {...err(errors.description, "task-description-err")}
          />
          {errors.description ? (
            <p id="task-description-err" role="alert" className="field-error">
              {t.errDescription}
            </p>
          ) : null}
        </div>
        <div>
          <label htmlFor="task-berth" className="staff-label">
            {t.berth}
          </label>
          <input
            id="task-berth"
            list="task-berth-codes"
            value={berth}
            onChange={(e) => setBerth(e.target.value)}
            placeholder={t.berthPlaceholder}
            autoCapitalize="characters"
            className="staff-field min-h-12 text-base"
            {...err(errors.berthCode, "task-berth-err")}
          />
          <datalist id="task-berth-codes">
            {board.berths.map((b) => (
              <option key={b.id} value={b.code} />
            ))}
          </datalist>
          {errors.berthCode ? (
            <p id="task-berth-err" role="alert" className="field-error">
              {t.errBerth(berth.trim().toUpperCase())}
            </p>
          ) : null}
        </div>
        <div>
          <label htmlFor="task-assignee" className="staff-label">
            {t.assignTo}
          </label>
          <select
            id="task-assignee"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            className="staff-field min-h-12 text-base"
          >
            <option value="">{t.nobody}</option>
            {board.staff.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name || t.unnamedStaff}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="task-date" className="staff-label">
            {t.date}
          </label>
          <input
            id="task-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="staff-field min-h-12 text-base"
            {...err(errors.when, "task-when-err")}
          />
        </div>
        <div>
          <label htmlFor="task-time" className="staff-label">
            {t.time}
          </label>
          <input
            id="task-time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="staff-field min-h-12 text-base"
            {...err(errors.when, "task-when-err")}
          />
        </div>
        {errors.when ? (
          <p id="task-when-err" role="alert" className="field-error sm:col-span-2">
            {t.errTime}
          </p>
        ) : null}
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={action.busy}
            className="staff-btn staff-btn-primary min-h-12 w-full text-base sm:w-auto"
          >
            {t.add}
          </button>
          {action.error ? (
            <p role="alert" className="field-error mt-2">
              {action.error}
            </p>
          ) : null}
        </div>
      </form>
    </details>
  );
}

function TaskCard({ task, board }: { task: DockTask; board: TaskBoard }) {
  const { s, dateLocale } = useStaffText();
  const t = s.tasks;
  const action = useStaffAction();
  const assignee = board.staff.find((m) => m.id === task.assignedTo);
  const overdue = isOverdue(task, new Date());
  const dueDay = isoDateOfTimestamp(task.dueAt);
  const done = task.status === "done";

  return (
    <li className={`staff-panel ${done ? "opacity-70" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="tabular text-2xl font-semibold text-ink">
          {formatClock(task.dueAt, dateLocale)}
          {dueDay !== todayIso() ? (
            <span className="ml-2 text-sm font-normal text-ink-muted">
              {formatLongDate(task.dueAt, dateLocale)}
            </span>
          ) : null}
        </p>
        <span className="flex flex-wrap gap-1">
          {task.berthCode ? (
            <span className="staff-badge staff-badge-ink text-sm">
              {s.common.berthCode(task.berthCode)}
            </span>
          ) : null}
          {overdue ? (
            <span className="staff-badge staff-badge-warn text-sm">{t.overdue}</span>
          ) : null}
          {done ? (
            <span className="staff-badge staff-badge-outline text-sm">{t.statusDone}</span>
          ) : null}
        </span>
      </div>
      <p className="mt-2 text-base text-ink">{task.description}</p>
      <p className="mt-1 text-sm text-ink-muted">
        {assignee ? assignee.name || t.unnamedStaff : t.unassigned}
      </p>
      <button
        type="button"
        disabled={action.busy}
        onClick={() => void action.save(() => setTaskStatus(task.id, done ? "to_do" : "done"))}
        className={`staff-btn mt-3 min-h-12 w-full text-base sm:w-auto ${done ? "" : "staff-btn-primary"}`}
      >
        {done ? t.markTodo : t.markDone}
      </button>
      {action.error ? (
        <p role="alert" className="field-error mt-2">
          {action.error}
        </p>
      ) : null}
    </li>
  );
}

function Tasks() {
  const { s } = useStaffText();
  const t = s.tasks;
  const { value: board, ready } = useStaffData(getTaskBoard, null);
  const [filter, setFilter] = useState<Filter>("to_do");
  const [mine, setMine] = useState(false);

  if (!ready) return <div className="min-h-[24rem]" aria-hidden="true" />;
  if (!board) return <p className="staff-empty">{s.common.saveFailed}</p>;

  const todoCount = board.tasks.filter((task) => task.status === "to_do").length;
  const shown = sortTasks(board.tasks)
    .filter((task) => filter === "all" || task.status === filter)
    .filter((task) => !mine || (board.me && task.assignedTo === board.me.id));

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="type-heading type-h2 text-ink">{t.title}</h1>

      <YourName board={board} />

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
              {value === "to_do" ? t.todo(todoCount) : value === "done" ? t.done : t.all}
            </button>
          ))}
        </div>
        {board.me ? (
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

      <NewTaskForm board={board} />

      <ul className="mt-4 space-y-3">
        {shown.map((task) => (
          <TaskCard key={task.id} task={task} board={board} />
        ))}
      </ul>
      {shown.length === 0 ? <p className="staff-empty mt-4">{t.empty}</p> : null}
    </div>
  );
}

// The dock team's task list, laid out for a phone on the pontoon: big times,
// big buttons, one column.
export default function DockTasks() {
  const { s } = useStaffText();
  return (
    <SupabaseOnly title={s.tasks.title}>
      <Tasks />
    </SupabaseOnly>
  );
}
