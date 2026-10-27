// Dock tasks: the checks on a new task and the order the list shows.

export type TaskStatus = "to_do" | "done";

export type DockTask = {
  id: string;
  berthCode: string | null;
  description: string;
  dueAt: string;
  assignedTo: string | null;
  status: TaskStatus;
  doneAt: string | null;
};

export type NewTask = {
  berthCode: string;
  description: string;
  date: string;
  time: string;
};

export type NewTaskErrors = Partial<Record<"berthCode" | "description" | "when", true>>;

// A description is needed, a time is needed, and a berth, when given, must be
// one the marina has.
export function validateTask(task: NewTask, berthCodes: Set<string>): NewTaskErrors {
  const errors: NewTaskErrors = {};
  if (task.description.trim() === "") errors.description = true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(task.date) || !/^\d{2}:\d{2}$/.test(task.time)) {
    errors.when = true;
  }
  const code = task.berthCode.trim().toUpperCase();
  if (code !== "" && !berthCodes.has(code)) errors.berthCode = true;
  return errors;
}

// A task still to do whose time has passed.
export function isOverdue(task: Pick<DockTask, "status" | "dueAt">, now: Date): boolean {
  return task.status === "to_do" && new Date(task.dueAt).getTime() < now.getTime();
}

// To do first, soonest first; then done, most recently done first.
export function sortTasks<T extends Pick<DockTask, "status" | "dueAt" | "doneAt">>(
  tasks: T[]
): T[] {
  return [...tasks].sort((a, b) => {
    if (a.status !== b.status) return a.status === "to_do" ? -1 : 1;
    if (a.status === "to_do") return a.dueAt.localeCompare(b.dueAt);
    return (b.doneAt ?? "").localeCompare(a.doneAt ?? "");
  });
}
