// The dock team and who may do what, against Supabase: jobs and who is on
// them, shifts, alerts, the team and its audit log, incident reports, the
// night watch's list, and the boater's booked help. Every write is one
// database function or one row, and the database checks the capability.

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { emitChange } from "@/data/mock/storage";
import type { Job, JobStatus, JobType, Shift } from "@/features/staff/lib/jobs";
import type { StaffRole } from "@/features/staff/lib/roles";
import { dbErrorKey, type DbErrorKey } from "./errors";

function db(): SupabaseClient {
  return createClient();
}

export type DockResult<T = undefined> = { ok: true; value: T } | { ok: false; error: DbErrorKey };

async function call<T = undefined>(
  write: PromiseLike<{ data: unknown; error: { code?: string; message?: string } | null }>
): Promise<DockResult<T>> {
  try {
    const { data, error } = await write;
    if (error) return { ok: false, error: dbErrorKey(error) };
    emitChange();
    return { ok: true, value: data as T };
  } catch {
    return { ok: false, error: "unknown" };
  }
}

// ---------------------------------------------------------------------------
// Jobs
// ---------------------------------------------------------------------------

export type DockJob = Job & {
  reason: string;
  reasonNote: string;
  source: string;
  description: string;
  helpRequestedAt: string | null;
  arrivalId: string | null;
};

export type TeamPerson = { id: string; name: string; role: StaffRole; teamLead: boolean };

type JobRow = {
  id: string;
  job_type: JobType;
  status: JobStatus;
  due_at: string;
  done_at: string | null;
  boat_name: string;
  length_m: number | string | null;
  beam_m: number | string | null;
  people_needed: number;
  sort_order: number | null;
  reason: string;
  reason_note: string;
  source: string;
  description: string;
  help_requested_at: string | null;
  arrival_id: string | null;
  berths: { code: string } | null;
  job_assignments: { member_id: string }[];
};

const JOB_SELECT = `id, job_type, status, due_at, done_at, boat_name, length_m, beam_m, people_needed,
  sort_order, reason, reason_note, source, description, help_requested_at, arrival_id,
  berths(code), job_assignments(member_id)`;

function num(v: number | string | null): number | null {
  if (v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function jobFromRow(r: JobRow): DockJob {
  return {
    id: r.id,
    type: r.job_type,
    status: r.status,
    dueAt: r.due_at,
    doneAt: r.done_at,
    berthCode: r.berths?.code ?? null,
    boatName: r.boat_name,
    lengthM: num(r.length_m),
    beamM: num(r.beam_m),
    peopleNeeded: r.people_needed,
    sortOrder: r.sort_order,
    members: r.job_assignments.map((a) => a.member_id),
    reason: r.reason,
    reasonNote: r.reason_note,
    source: r.source,
    description: r.description,
    helpRequestedAt: r.help_requested_at,
    arrivalId: r.arrival_id,
  };
}

// Jobs due between two moments, with who is on each.
export async function listJobs(fromIso: string, toIso: string): Promise<DockJob[] | null> {
  try {
    const { data, error } = await db()
      .from("dock_tasks")
      .select(JOB_SELECT)
      .gte("due_at", fromIso)
      .lt("due_at", toIso)
      .order("due_at");
    if (error) return null;
    return ((data ?? []) as unknown as JobRow[]).map(jobFromRow);
  } catch {
    return null;
  }
}

export async function teamDirectory(marinaId: string): Promise<TeamPerson[]> {
  try {
    const { data, error } = await db().rpc("team_directory", { p_marina: marinaId });
    if (error) return [];
    return (
      (data ?? []) as {
        member_id: string;
        display_name: string;
        role: StaffRole;
        team_lead: boolean;
      }[]
    ).map((m) => ({ id: m.member_id, name: m.display_name, role: m.role, teamLead: m.team_lead }));
  } catch {
    return [];
  }
}

export type NewJob = {
  jobType: JobType;
  berthCode: string;
  boatName: string;
  lengthM: number | null;
  beamM: number | null;
  dueAt: string;
  reason: string;
  reasonNote: string;
  peopleNeeded: number | null;
  source: "walk_in" | "vhf" | "staff";
  description: string;
};

export function createJob(marinaId: string, job: NewJob): Promise<DockResult<string>> {
  return call<string>(
    db().rpc("create_job", {
      p_marina: marinaId,
      p: {
        job_type: job.jobType,
        berth_code: job.berthCode,
        boat_name: job.boatName,
        length_m: job.lengthM === null ? "" : String(job.lengthM),
        beam_m: job.beamM === null ? "" : String(job.beamM),
        due_at: job.dueAt,
        reason: job.reason,
        reason_note: job.reasonNote,
        people_needed: job.peopleNeeded === null ? "" : String(job.peopleNeeded),
        source: job.source,
        description: job.description,
      },
    })
  );
}

export const claimJob = (id: string) => call(db().rpc("claim_job", { p_job: id }));
export const completeJob = (id: string) => call(db().rpc("complete_job", { p_job: id }));
export const requestJobHelp = (id: string) => call(db().rpc("request_job_help", { p_job: id }));
export const assignJob = (id: string, memberId: string) =>
  call(db().rpc("assign_job", { p_job: id, p_member: memberId }));
export const unassignJob = (id: string, memberId: string) =>
  call(db().rpc("unassign_job", { p_job: id, p_member: memberId }));

export function updateJob(
  id: string,
  change: {
    dueAt?: string;
    peopleNeeded?: number;
    sortOrder?: number | null;
    status?: "to_do" | "cancelled";
  }
): Promise<DockResult> {
  const p: Record<string, string | null> = {};
  if (change.dueAt) p.due_at = change.dueAt;
  if (change.peopleNeeded) p.people_needed = String(change.peopleNeeded);
  if (change.sortOrder !== undefined)
    p.sort_order = change.sortOrder === null ? null : String(change.sortOrder);
  if (change.status) p.status = change.status;
  return call(db().rpc("update_job", { p_job: id, p }));
}

// ---------------------------------------------------------------------------
// Shifts
// ---------------------------------------------------------------------------

export type DockShift = Shift & { id: string };

export async function listShifts(fromDay: string, toDay: string): Promise<DockShift[]> {
  try {
    const { data, error } = await db()
      .from("shifts")
      .select("id, member_id, day, starts_at, ends_at")
      .gte("day", fromDay)
      .lte("day", toDay)
      .order("day")
      .order("starts_at");
    if (error) return [];
    return (
      (data ?? []) as {
        id: string;
        member_id: string;
        day: string;
        starts_at: string;
        ends_at: string;
      }[]
    ).map((s) => ({
      id: s.id,
      memberId: s.member_id,
      day: s.day,
      startsAt: s.starts_at.slice(0, 5),
      endsAt: s.ends_at.slice(0, 5),
    }));
  } catch {
    return [];
  }
}

export const addShift = (marinaId: string, shift: Shift) =>
  call(
    db().from("shifts").insert({
      marina_id: marinaId,
      member_id: shift.memberId,
      day: shift.day,
      starts_at: shift.startsAt,
      ends_at: shift.endsAt,
    })
  );

export const removeShift = (id: string) => call(db().from("shifts").delete().eq("id", id));

// ---------------------------------------------------------------------------
// Alerts
// ---------------------------------------------------------------------------

export type StaffAlert = {
  id: string;
  kind: "assigned" | "help";
  jobId: string | null;
  createdAt: string;
};

export async function unreadAlerts(): Promise<StaffAlert[]> {
  try {
    const { data, error } = await db()
      .from("staff_alerts")
      .select("id, kind, job_id, created_at")
      .is("read_at", null)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) return [];
    return (
      (data ?? []) as {
        id: string;
        kind: StaffAlert["kind"];
        job_id: string | null;
        created_at: string;
      }[]
    ).map((a) => ({ id: a.id, kind: a.kind, jobId: a.job_id, createdAt: a.created_at }));
  } catch {
    return [];
  }
}

export const markAlertsRead = (ids: string[]) =>
  call(db().from("staff_alerts").update({ read_at: new Date().toISOString() }).in("id", ids));

// Calls back on any change to jobs, who is on them, or my alerts.
export function subscribeToDock(
  onChange: (table: string, row: Record<string, unknown>) => void
): () => void {
  const client = db();
  const channel = client.channel("staff-dock");
  for (const table of ["dock_tasks", "job_assignments", "staff_alerts"]) {
    channel.on("postgres_changes", { event: "*", schema: "public", table }, (payload) =>
      onChange(table, (payload.new ?? {}) as Record<string, unknown>)
    );
  }
  channel.subscribe();
  return () => {
    void client.removeChannel(channel);
  };
}

// ---------------------------------------------------------------------------
// The team
// ---------------------------------------------------------------------------

export type TeamRow = {
  memberId: string | null;
  inviteId: string | null;
  email: string;
  displayName: string;
  role: StaffRole;
  teamLead: boolean;
  accessUntil: string | null;
  active: boolean;
  effective: boolean;
  isMe: boolean;
};

export async function teamMembers(marinaId: string): Promise<TeamRow[] | null> {
  try {
    const { data, error } = await db().rpc("team_members", { p_marina: marinaId });
    if (error) return null;
    return (
      (data ?? []) as {
        member_id: string | null;
        invite_id: string | null;
        email: string;
        display_name: string;
        role: StaffRole;
        team_lead: boolean;
        access_until: string | null;
        active: boolean;
        effective: boolean;
        is_me: boolean;
      }[]
    ).map((r) => ({
      memberId: r.member_id,
      inviteId: r.invite_id,
      email: r.email,
      displayName: r.display_name,
      role: r.role,
      teamLead: r.team_lead,
      accessUntil: r.access_until,
      active: r.active,
      effective: r.effective,
      isMe: r.is_me,
    }));
  } catch {
    return null;
  }
}

export function inviteStaff(
  marinaId: string,
  invite: {
    email: string;
    role: StaffRole;
    teamLead: boolean;
    accessUntil: string | null;
    name: string;
  }
): Promise<DockResult<"added" | "invited">> {
  return call<"added" | "invited">(
    db().rpc("invite_staff", {
      p_marina: marinaId,
      p_email: invite.email,
      p_role: invite.role,
      p_team_lead: invite.teamLead,
      p_access_until: invite.accessUntil,
      p_name: invite.name,
    })
  );
}

export function updateStaffMember(
  memberId: string,
  change: { role?: StaffRole; teamLead?: boolean; accessUntil?: string | null; active?: boolean }
): Promise<DockResult> {
  const p: Record<string, unknown> = {};
  if (change.role) p.role = change.role;
  if (change.teamLead !== undefined) p.team_lead = change.teamLead;
  if (change.accessUntil !== undefined) p.access_until = change.accessUntil;
  if (change.active !== undefined) p.active = change.active;
  return call(db().rpc("update_staff_member", { p_member: memberId, p }));
}

export const cancelStaffInvite = (id: string) =>
  call(db().rpc("cancel_staff_invite", { p_invite: id }));

export const setMyName = (name: string) =>
  call(db().rpc("set_my_display_name", { new_name: name }));

export type AuditEntry = {
  id: number;
  action: string;
  targetEmail: string;
  details: Record<string, unknown>;
  at: string;
};

export async function auditLog(marinaId: string): Promise<AuditEntry[]> {
  try {
    const { data, error } = await db()
      .from("staff_audit_log")
      .select("id, action, target_email, details, at")
      .eq("marina_id", marinaId)
      .order("at", { ascending: false })
      .limit(100);
    if (error) return [];
    return (
      (data ?? []) as {
        id: number;
        action: string;
        target_email: string;
        details: Record<string, unknown>;
        at: string;
      }[]
    ).map((r) => ({
      id: r.id,
      action: r.action,
      targetEmail: r.target_email,
      details: r.details,
      at: r.at,
    }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Night watch: tonight's boats, late check-in, incident reports
// ---------------------------------------------------------------------------

export type Movement = {
  arrivalId: string;
  kind: "arrival" | "departure";
  boatName: string;
  lengthM: number | null;
  beamM: number | null;
  berthCode: string | null;
  time: string | null;
  arrivalStatus: string;
};

export async function tonightMovements(marinaId: string): Promise<Movement[] | null> {
  try {
    const { data, error } = await db().rpc("tonight_movements", { p_marina: marinaId });
    if (error) return null;
    return (
      (data ?? []) as {
        arrival_id: string;
        kind: Movement["kind"];
        boat_name: string;
        length_m: number | string | null;
        beam_m: number | string | null;
        berth_code: string | null;
        at_time: string | null;
        arrival_status: string;
      }[]
    ).map((m) => ({
      arrivalId: m.arrival_id,
      kind: m.kind,
      boatName: m.boat_name,
      lengthM: num(m.length_m),
      beamM: num(m.beam_m),
      berthCode: m.berth_code,
      time: m.at_time ? m.at_time.slice(0, 5) : null,
      arrivalStatus: m.arrival_status,
    }));
  } catch {
    return null;
  }
}

export const lateCheckIn = (arrivalId: string) =>
  call(db().rpc("late_check_in", { p_arrival: arrivalId }));

export type Incident = {
  id: string;
  occurredAt: string;
  berthCode: string | null;
  description: string;
};

export async function listIncidents(): Promise<Incident[]> {
  try {
    const { data, error } = await db()
      .from("incident_reports")
      .select("id, occurred_at, description, berths(code)")
      .order("occurred_at", { ascending: false })
      .limit(50);
    if (error) return [];
    return (
      (data ?? []) as unknown as {
        id: string;
        occurred_at: string;
        description: string;
        berths: { code: string } | null;
      }[]
    ).map((r) => ({
      id: r.id,
      occurredAt: r.occurred_at,
      berthCode: r.berths?.code ?? null,
      description: r.description,
    }));
  } catch {
    return [];
  }
}

export async function fileIncident(
  marinaId: string,
  report: { occurredAt: string; berthCode: string; description: string }
): Promise<DockResult> {
  let berthId: string | null = null;
  const code = report.berthCode.trim().toUpperCase();
  if (code) {
    const { data } = await db()
      .from("berths")
      .select("id")
      .eq("marina_id", marinaId)
      .eq("code", code)
      .maybeSingle();
    if (!data) return { ok: false, error: "not_found" };
    berthId = (data as { id: string }).id;
  }
  const { data: user } = await db().auth.getUser();
  return call(
    db()
      .from("incident_reports")
      .insert({
        marina_id: marinaId,
        occurred_at: report.occurredAt,
        berth_id: berthId,
        description: report.description.trim(),
        reported_by: user.user?.id ?? null,
      })
  );
}

// ---------------------------------------------------------------------------
// Boaters: booked help, busyness, running late
// ---------------------------------------------------------------------------

export type HelpReason = "short_handed" | "first_time" | "other";

export type SlotBusyness = { busy: boolean; quieter: string[] };

export async function slotBusyness(marinaId: string, atIso: string): Promise<SlotBusyness | null> {
  try {
    const { data, error } = await db().rpc("slot_busyness", { p_marina: marinaId, p_at: atIso });
    if (error) return null;
    const value = data as { busy: boolean; quieter: string[] };
    return { busy: Boolean(value.busy), quieter: value.quieter ?? [] };
  } catch {
    return null;
  }
}

export const bookArrivalHelp = (arrivalId: string, reason: HelpReason, note: string) =>
  call(db().rpc("book_arrival_help", { p_arrival: arrivalId, p_reason: reason, p_note: note }));

export const bookHolderHelp = (
  contractId: string,
  kind: "departure" | "return",
  atIso: string,
  note: string
) =>
  call<string>(
    db().rpc("book_holder_help", {
      p_contract: contractId,
      p_kind: kind,
      p_at: atIso,
      p_note: note,
    })
  );

export const reportRunningLate = (jobId: string, atIso: string) =>
  call(db().rpc("report_running_late", { p_job: jobId, p_new_at: atIso }));

export const cancelMyHelp = (jobId: string) => call(db().rpc("cancel_my_help", { p_job: jobId }));

export type HelpBooking = {
  id: string;
  marinaId: string;
  type: JobType;
  dueAt: string;
  status: "waiting" | "booked" | "done" | "cancelled";
  arrivalId: string | null;
  contractId: string | null;
  berthCode: string | null;
};

export async function myHelpBookings(): Promise<HelpBooking[]> {
  try {
    const { data, error } = await db()
      .from("my_help_bookings")
      .select(
        "id, marina_id, job_type, due_at, display_status, arrival_id, contract_id, berth_code"
      )
      .order("due_at");
    if (error) return [];
    return (
      (data ?? []) as {
        id: string;
        marina_id: string;
        job_type: JobType;
        due_at: string;
        display_status: HelpBooking["status"];
        arrival_id: string | null;
        contract_id: string | null;
        berth_code: string | null;
      }[]
    ).map((b) => ({
      id: b.id,
      marinaId: b.marina_id,
      type: b.job_type,
      dueAt: b.due_at,
      status: b.display_status,
      arrivalId: b.arrival_id,
      contractId: b.contract_id,
      berthCode: b.berth_code,
    }));
  } catch {
    return [];
  }
}
