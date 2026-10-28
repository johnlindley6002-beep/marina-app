"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { addDaysIso, effectiveEnquiryDeparture, todayIso } from "@/lib/dates";
import {
  getBerthStatusesFor,
  getEnquiries,
  markEnquiryArrived,
  markEnquiryDeparted,
  reassignEnquiryBerth,
  setEnquiryFlag,
  type BerthOperationalInfo,
  type Enquiry,
  useStaffData,
} from "@/lib/data";
import { formatLength } from "@/lib/units";
import { useStaffAction } from "../lib/useStaffAction";
import { useStaffId } from "./StaffSessionProvider";
import { Collapse } from "@/components/ui/Disclosure";
import { useUnits } from "@/components/providers/UnitsProvider";
import { serviceList } from "../lib/services";
import BerthPicker from "./BerthPicker";
import { useStaffText } from "./StaffLanguageProvider";
import PreArrivalArrivals from "./PreArrivalArrivals";
import { EnquiryRow } from "./EnquiryInbox";

const NONE: Enquiry[] = [];
const NO_STATUSES: Record<string, Record<string, BerthOperationalInfo>> = {};
const WINDOW_DAYS = 6;

type EventKind = "arrival" | "departure";
type BoardEvent = { enquiry: Enquiry; kind: EventKind; date: string; time: string };

function EventRow({
  event,
  staffId,
  releasedBerth,
}: {
  event: BoardEvent;
  staffId: string | null;
  releasedBerth: boolean;
}) {
  const { enquiry, kind } = event;
  const { units } = useUnits();
  const { s } = useStaffText();
  const a = s.arrivals;
  const [open, setOpen] = useState(false);
  const { busy, error, run } = useStaffAction();
  const [flagDraft, setFlagDraft] = useState(enquiry.flagNote);
  const [editingFlag, setEditingFlag] = useState(false);
  const rowId = `arrival-${enquiry.id}-${kind}`;

  return (
    <li className="staff-panel">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={rowId}
        className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2 text-left"
      >
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 font-medium text-ink">
            {enquiry.boatName || s.common.unnamedBoat}
            <span className="staff-badge staff-badge-outline">
              {kind === "arrival" ? a.arriving : a.departing}
            </span>
            {enquiry.services.helpMooring && kind === "arrival" ? (
              <span className="staff-badge staff-badge-accent">{a.needsMooringHelp}</span>
            ) : null}
            {enquiry.flagNote ? (
              <span className="staff-badge staff-badge-warn">{a.flagged}</span>
            ) : null}
            {enquiry.arrivalStatus === "arrived" ? (
              <span className="staff-badge staff-badge-ink">{a.onSite}</span>
            ) : null}
            {releasedBerth ? (
              <span className="staff-badge staff-badge-accent">{a.releasedBerth}</span>
            ) : null}
          </p>
          <p className="tabular mt-1 text-xs text-ink-muted">
            {formatLength(Number(enquiry.loa), units)} {s.common.loa} ·{" "}
            {formatLength(Number(enquiry.beam), units)} {s.common.beam} ·{" "}
            {formatLength(Number(enquiry.draft), units)} {s.common.draft} ·{" "}
            {s.common.berthCode(enquiry.assignedBerthId ?? a.berthUnassigned)}
          </p>
        </div>
        <div className="tabular text-right text-sm text-ink">
          <p className="font-medium">
            {kind === "arrival" ? enquiry.eta || a.etaMissing : enquiry.etd || a.etdMissing}
          </p>
          <p className="text-xs text-ink-muted">{event.date}</p>
        </div>
      </button>

      <Collapse open={open} id={rowId}>
        <div className="mt-3 border-t border-hairline pt-3 text-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="staff-label">{a.skipper}</p>
              <p className="text-ink">{enquiry.skipperName || s.common.notGiven}</p>
              <p className="text-ink-muted">{enquiry.phone}</p>
              <p className="text-ink-muted">{enquiry.email}</p>
            </div>
            <div>
              <p className="staff-label">{a.stay}</p>
              <p className="text-ink">
                {s.common.range(
                  enquiry.arrival,
                  enquiry.openEnded ? s.common.openEnded : enquiry.departure
                )}
              </p>
              <p className="text-ink-muted">{s.common.onBoard(enquiry.peopleOnBoard)}</p>
            </div>
          </div>

          {serviceList(enquiry, s).length > 0 ? (
            <div className="mt-3">
              <p className="staff-label">{a.servicesRequested}</p>
              <p className="text-ink-soft">{serviceList(enquiry, s).join(", ")}</p>
            </div>
          ) : null}

          {enquiry.crew.length > 0 ? (
            <div className="mt-3">
              <p className="staff-label">{a.crew(enquiry.crew.length)}</p>
              <ul className="text-ink-soft">
                {enquiry.crew.map((c, i) => (
                  <li key={i}>
                    {c.fullName || s.common.unnamed}, {c.role || c.personType}
                    {c.nationality ? `, ${c.nationality}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-3 flex flex-wrap items-end gap-3">
            <label className="block text-sm">
              <span className="staff-label" id={`${rowId}-berth`}>
                {a.assignedBerth}
              </span>
              <BerthPicker
                id={`${rowId}-berth`}
                marinaId={enquiry.marinaId}
                loa={enquiry.loa}
                dateIso={enquiry.arrival}
                value={enquiry.assignedBerthId ?? ""}
                onChange={(berthId) =>
                  void run(() => reassignEnquiryBerth(staffId, enquiry.id, berthId))
                }
              />
            </label>
            {kind === "arrival" && enquiry.arrivalStatus === "pending" ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void run(() => markEnquiryArrived(staffId, enquiry.id))}
                className="staff-btn staff-btn-primary"
              >
                {a.markArrived}
              </button>
            ) : null}
            {kind === "departure" && enquiry.arrivalStatus === "arrived" ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void run(() => markEnquiryDeparted(staffId, enquiry.id))}
                className="staff-btn staff-btn-primary"
              >
                {a.markDeparted}
              </button>
            ) : null}
            {!editingFlag ? (
              <button type="button" onClick={() => setEditingFlag(true)} className="staff-btn">
                {enquiry.flagNote ? a.editFlag : a.flagIssue}
              </button>
            ) : null}
            <Link href={`/staff/reception/${enquiry.id}`} className="staff-btn">
              {a.openCheckIn}
            </Link>
          </div>

          {editingFlag ? (
            <div className="mt-3 max-w-md">
              <label className="block text-sm">
                <span className="staff-label">{a.staffNote}</span>
                <textarea
                  value={flagDraft}
                  onChange={(e) => setFlagDraft(e.target.value)}
                  className="staff-field"
                  rows={2}
                />
              </label>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    if (await run(() => setEnquiryFlag(staffId, enquiry.id, flagDraft))) {
                      setEditingFlag(false);
                    }
                  }}
                  className="staff-btn staff-btn-primary"
                >
                  {s.common.save}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingFlag(false)}
                  className="staff-btn staff-btn-ghost"
                >
                  {s.common.cancel}
                </button>
              </div>
            </div>
          ) : enquiry.flagNote ? (
            <p className="mt-3 text-sm text-error">{enquiry.flagNote}</p>
          ) : null}

          {error ? (
            <p role="alert" className="field-error mt-2">
              {error}
            </p>
          ) : null}
        </div>
      </Collapse>
    </li>
  );
}

export default function ArrivalsBoard() {
  const staffId = useStaffId();
  const { s } = useStaffText();
  const a = s.arrivals;
  const { value: enquiries, ready } = useStaffData(
    () => getEnquiries(staffId),
    NONE,
    staffId ?? ""
  );
  const [when, setWhen] = useState<"today" | "upcoming">("upcoming");
  const [type, setType] = useState<"all" | "arrival" | "departure">("all");

  const today = todayIso();
  const windowEnd = addDaysIso(today, WINDOW_DAYS);

  // Requests nobody has answered yet, oldest first, so none is left waiting.
  // They arrive here live: see StaffRealtime.
  const waiting = useMemo(
    () =>
      enquiries
        .filter((e) => e.status === "new" || e.status === "dates_proposed")
        .sort((x, y) => x.createdAt.localeCompare(y.createdAt)),
    [enquiries]
  );

  const events = useMemo(() => {
    const out: BoardEvent[] = [];
    for (const e of enquiries) {
      if (e.status !== "approved") continue;
      if (e.arrival >= today && e.arrival <= windowEnd) {
        out.push({ enquiry: e, kind: "arrival", date: e.arrival, time: e.eta });
      }
      const dep = effectiveEnquiryDeparture(e);
      if (!e.openEnded && dep >= today && dep <= windowEnd) {
        out.push({ enquiry: e, kind: "departure", date: dep, time: e.etd });
      }
    }
    return out
      .filter((ev) => (when === "today" ? ev.date === today : true))
      .filter((ev) => (type === "all" ? true : ev.kind === type))
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  }, [enquiries, when, type, today, windowEnd]);

  // One read for the berth status on every row's day, to badge berths a
  // berth holder has released.
  const statusPairs = useMemo(
    () =>
      events
        .filter((ev) => ev.enquiry.assignedBerthId)
        .map((ev) => ({ marinaId: ev.enquiry.marinaId, dateIso: ev.date })),
    [events]
  );
  const statusKey = statusPairs.map((p) => `${p.marinaId}|${p.dateIso}`).join(",");
  const { value: statuses } = useStaffData(
    () => getBerthStatusesFor(statusPairs),
    NO_STATUSES,
    statusKey
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="type-heading type-h2 text-ink">{a.title}</h1>
      </div>

      <section className="mt-3" aria-labelledby="new-requests-heading">
        <h2 id="new-requests-heading" className="type-heading type-h3 text-ink">
          {s.requests.boardTitle(waiting.length)}
        </h2>
        {ready && waiting.length === 0 ? (
          <p className="staff-empty mt-2">{s.requests.boardNone}</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {waiting.map((e) => (
              <EnquiryRow key={e.id} enquiry={e} staffId={staffId} />
            ))}
          </ul>
        )}
      </section>

      <div className="mt-6 flex flex-wrap gap-4">
        <div
          role="group"
          aria-label={a.when}
          className="inline-flex rounded-md border border-ink/25 p-0.5 text-xs"
        >
          {(["today", "upcoming"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={when === v}
              onClick={() => setWhen(v)}
              className={`min-h-10 rounded-sm px-3 ${when === v ? "bg-ink text-paper" : "text-ink-muted"}`}
            >
              {v === "today" ? a.today : a.nextDays(WINDOW_DAYS)}
            </button>
          ))}
        </div>
        <div
          role="group"
          aria-label={a.type}
          className="inline-flex rounded-md border border-ink/25 p-0.5 text-xs"
        >
          {(["all", "arrival", "departure"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={type === v}
              onClick={() => setType(v)}
              className={`min-h-10 rounded-sm px-3 ${type === v ? "bg-ink text-paper" : "text-ink-muted"}`}
            >
              {v === "all" ? a.all : v === "arrival" ? a.arrivalsFilter : a.departuresFilter}
            </button>
          ))}
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {events.map((ev) => (
          <EventRow
            key={ev.enquiry.id + ev.kind}
            event={ev}
            staffId={staffId}
            releasedBerth={
              !!ev.enquiry.assignedBerthId &&
              statuses[`${ev.enquiry.marinaId}|${ev.date}`]?.[ev.enquiry.assignedBerthId]
                ?.status === "released"
            }
          />
        ))}
      </ul>

      {ready && events.length === 0 ? (
        <p className="staff-empty mt-4">
          {when === "today" ? a.emptyToday : a.emptyNext(WINDOW_DAYS)}
        </p>
      ) : null}

      <PreArrivalArrivals />
    </div>
  );
}
