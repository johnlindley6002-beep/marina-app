"use client";

import { useState, type FormEvent } from "react";
import { formatLongDate } from "@/lib/dates";
import {
  auditLog,
  cancelStaffInvite,
  inviteStaff,
  teamMembers,
  updateStaffMember,
  useStaffData,
  type AuditEntry,
  type DbErrorKey,
  type DockResult,
  type TeamRow,
} from "@/lib/data";
import { assignableRoles, type StaffRole } from "../../lib/roles";
import { staffError } from "../../lib/errors";
import { formatClock } from "../../lib/format";
import SupabaseOnly from "../SupabaseOnly";
import { useStaffText } from "../StaffLanguageProvider";
import { useStaffContext } from "./useDock";

const NO_AUDIT: AuditEntry[] = [];

// The audit log's actions, as written by the database functions.
function actionLabel(labels: { [K in AuditAction]: string }, action: string): string {
  const known: Record<AuditAction, string> = {
    added: labels.added,
    invited: labels.invited,
    invite_accepted: labels.invite_accepted,
    invite_cancelled: labels.invite_cancelled,
    role_changed: labels.role_changed,
    changed: labels.changed,
    deactivated: labels.deactivated,
    reactivated: labels.reactivated,
  };
  return known[action as AuditAction] ?? action;
}

type AuditAction =
  | "added"
  | "invited"
  | "invite_accepted"
  | "invite_cancelled"
  | "role_changed"
  | "changed"
  | "deactivated"
  | "reactivated";

function useTeamError() {
  const { s } = useStaffText();
  return (key: DbErrorKey) => (s.team.errors as Record<string, string>)[key] ?? staffError(s, key);
}

function MemberRow({ row, roles }: { row: TeamRow; roles: StaffRole[] }) {
  const { s, dateLocale } = useStaffText();
  const t = s.team;
  const message = useTeamError();
  const [role, setRole] = useState<StaffRole>(row.role);
  const [lead, setLead] = useState(row.teamLead);
  const [until, setUntil] = useState(row.accessUntil ?? "");
  const [note, setNote] = useState("");
  const editable = !row.isMe && row.memberId !== null && roles.includes(row.role);
  const id = `team-${row.memberId ?? row.inviteId}`;

  async function run(write: () => Promise<DockResult>) {
    const result = await write();
    setNote(result.ok ? t.saved : message(result.error));
  }

  const status = row.inviteId
    ? t.pending
    : !row.active
      ? t.inactive
      : !row.effective
        ? t.expired
        : t.active;

  return (
    <tr>
      <td>
        <span className="font-medium text-ink">{row.displayName || row.email}</span>
        {row.displayName ? <span className="block text-xs text-ink-muted">{row.email}</span> : null}
        {row.isMe ? <span className="staff-badge staff-badge-outline ml-1">{t.you}</span> : null}
      </td>
      <td>
        {editable ? (
          <>
            <label htmlFor={`${id}-role`} className="sr-only">
              {t.role}
            </label>
            <select
              id={`${id}-role`}
              value={role}
              onChange={(e) => setRole(e.target.value as StaffRole)}
              className="staff-field min-h-11"
            >
              {roles.map((r) => (
                <option key={r} value={r}>
                  {s.roles[r]}
                </option>
              ))}
            </select>
            {role === "marinheiro" ? (
              <label className="mt-1 flex min-h-11 items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  className="h-5 w-5"
                  checked={lead}
                  onChange={(e) => setLead(e.target.checked)}
                />
                {s.roles.teamLead}
              </label>
            ) : null}
          </>
        ) : (
          <>
            {s.roles[row.role]}
            {row.teamLead ? ` (${s.roles.teamLead})` : ""}
          </>
        )}
      </td>
      <td>
        {editable ? (
          <>
            <label htmlFor={`${id}-until`} className="sr-only">
              {t.accessUntil}
            </label>
            <input
              id={`${id}-until`}
              type="date"
              value={until}
              onChange={(e) => setUntil(e.target.value)}
              className="staff-field min-h-11"
            />
          </>
        ) : row.accessUntil ? (
          formatLongDate(row.accessUntil, dateLocale)
        ) : (
          <span className="text-ink-muted">{t.noEnd}</span>
        )}
      </td>
      <td>{status}</td>
      <td>
        <div className="flex flex-wrap gap-1">
          {editable ? (
            <>
              <button
                type="button"
                onClick={() =>
                  void run(() =>
                    updateStaffMember(row.memberId!, {
                      role,
                      teamLead: lead,
                      accessUntil: until || null,
                    })
                  )
                }
                className="staff-btn staff-btn-primary min-h-11"
              >
                {t.save}
              </button>
              <button
                type="button"
                onClick={() =>
                  void run(() => updateStaffMember(row.memberId!, { active: !row.active }))
                }
                className={`staff-btn min-h-11 ${row.active ? "staff-btn-danger" : ""}`}
              >
                {row.active ? t.deactivate : t.reactivate}
              </button>
            </>
          ) : null}
          {row.inviteId && roles.includes(row.role) ? (
            <button
              type="button"
              onClick={() => void run(() => cancelStaffInvite(row.inviteId!))}
              className="staff-btn min-h-11"
            >
              {t.cancelInvite}
            </button>
          ) : null}
        </div>
        <p role="status" className="text-xs text-ink">
          {note}
        </p>
      </td>
    </tr>
  );
}

function InviteForm({ roles }: { roles: StaffRole[] }) {
  const { s } = useStaffText();
  const t = s.team;
  const message = useTeamError();
  const { marinaId } = useStaffContext();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<StaffRole>(
    roles.includes("marinheiro") ? "marinheiro" : roles[0]!
  );
  const [lead, setLead] = useState(false);
  const [until, setUntil] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNote("");
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError(t.errors.invalid_email);
    const result = await inviteStaff(marinaId, {
      email,
      role,
      teamLead: lead,
      accessUntil: until || null,
      name,
    });
    if (!result.ok) return setError(message(result.error));
    setError("");
    setNote(result.value === "added" ? t.added : t.invited);
    setEmail("");
    setName("");
  }

  return (
    <form onSubmit={submit} noValidate className="staff-panel mt-4 grid gap-3 sm:grid-cols-2">
      <h2 className="type-heading type-h3 text-ink sm:col-span-2">{t.invite}</h2>
      <div>
        <label htmlFor="invite-email" className="staff-label">
          {t.email}
        </label>
        <input
          id="invite-email"
          type="email"
          inputMode="email"
          autoComplete="off"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "invite-err" : undefined}
          className="staff-field min-h-11"
        />
      </div>
      <div>
        <label htmlFor="invite-name" className="staff-label">
          {t.name}
        </label>
        <input
          id="invite-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="off"
          className="staff-field min-h-11"
        />
      </div>
      <div>
        <label htmlFor="invite-role" className="staff-label">
          {t.role}
        </label>
        <select
          id="invite-role"
          value={role}
          onChange={(e) => setRole(e.target.value as StaffRole)}
          className="staff-field min-h-11"
        >
          {roles.map((r) => (
            <option key={r} value={r}>
              {s.roles[r]}
            </option>
          ))}
        </select>
        {role === "marinheiro" ? (
          <label className="mt-1 flex min-h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-5 w-5"
              checked={lead}
              onChange={(e) => setLead(e.target.checked)}
            />
            {t.teamLead}
          </label>
        ) : null}
      </div>
      <div>
        <label htmlFor="invite-until" className="staff-label">
          {t.accessUntil}
        </label>
        <input
          id="invite-until"
          type="date"
          value={until}
          onChange={(e) => setUntil(e.target.value)}
          aria-describedby="invite-until-help"
          className="staff-field min-h-11"
        />
        <p id="invite-until-help" className="text-xs text-ink-muted">
          {t.accessHelp}
        </p>
      </div>
      {error ? (
        <p id="invite-err" role="alert" className="field-error sm:col-span-2">
          {error}
        </p>
      ) : null}
      <div className="sm:col-span-2">
        <button type="submit" className="staff-btn staff-btn-primary min-h-11">
          {t.send}
        </button>
        <p role="status" className="mt-1 text-sm text-ink">
          {note}
        </p>
      </div>
    </form>
  );
}

function TeamPage() {
  const { s, dateLocale } = useStaffText();
  const t = s.team;
  const { marinaId, capabilities } = useStaffContext();
  const roles = assignableRoles(capabilities);
  const { value: rows } = useStaffData(
    async () => (await teamMembers(marinaId)) ?? [],
    [] as TeamRow[],
    marinaId
  );
  const readsAudit = capabilities.includes("view_audit_log");
  const { value: audit } = useStaffData(
    () => (readsAudit ? auditLog(marinaId) : Promise.resolve(NO_AUDIT)),
    NO_AUDIT,
    `${marinaId}|${readsAudit}`
  );

  return (
    <div>
      <h1 className="type-heading type-h2 text-ink">{t.title}</h1>
      {!capabilities.includes("manage_team") ? (
        <p className="mt-1 text-sm text-ink-muted">{t.dockOnly}</p>
      ) : null}
      <div className="staff-table-wrap mt-4" tabIndex={0} role="region" aria-label={t.title}>
        <table className="staff-table w-full text-left text-sm">
          <thead>
            <tr>
              <th scope="col">{t.member}</th>
              <th scope="col">{t.role}</th>
              <th scope="col">{t.accessUntil}</th>
              <th scope="col">{t.status}</th>
              <th scope="col">
                <span className="sr-only">{t.save}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <MemberRow key={row.memberId ?? row.inviteId} row={row} roles={roles} />
            ))}
          </tbody>
        </table>
      </div>
      {roles.length > 0 ? <InviteForm roles={roles} /> : null}

      {readsAudit ? (
        <section className="mt-6" aria-labelledby="team-audit">
          <h2 id="team-audit" className="type-heading type-h3 text-ink">
            {t.auditTitle}
          </h2>
          {audit.length === 0 ? <p className="staff-empty mt-2">{t.auditEmpty}</p> : null}
          <ul className="mt-2 space-y-1 text-sm">
            {audit.map((entry) => (
              <li key={entry.id} className="staff-panel">
                <span className="tabular text-ink-muted">
                  {formatLongDate(entry.at, dateLocale)} {formatClock(entry.at, dateLocale)}
                </span>{" "}
                <span className="font-medium text-ink">{actionLabel(t.actions, entry.action)}</span>{" "}
                {entry.targetEmail}
                {typeof entry.details.role === "string"
                  ? `, ${s.roles[entry.details.role as StaffRole] ?? ""}`
                  : ""}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

// The team as the director sees it (everyone, plus the audit log) or as the
// dockmaster sees it (the dock team only). The database enforces both.
export default function Team() {
  const { s } = useStaffText();
  return (
    <SupabaseOnly title={s.team.title}>
      <TeamPage />
    </SupabaseOnly>
  );
}
