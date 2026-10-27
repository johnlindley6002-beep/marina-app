"use client";

import { useState } from "react";
import { formatLongDate, countNights, nightDates } from "@/lib/dates";
import { marinas } from "@/data/marinas";
import { nightsOfferedToVisitors } from "@/features/owner/lib/relet";
import { eur } from "@/lib/money";
import {
  advanceRelettingStatus,
  decideReletting,
  defaultNightsBooked,
  getRelettingQueue,
  RELETTING_PROGRESS,
  type RelettingQueueItem,
  useStaffData,
} from "@/lib/data";
import { useStaffAction } from "../lib/useStaffAction";
import { useStaffId } from "./StaffSessionProvider";
import { Collapse } from "@/components/ui/Disclosure";
import { useStaffText } from "./StaffLanguageProvider";

const NONE: RelettingQueueItem[] = [];

function NightChips({
  nights,
  selected,
  onToggle,
}: {
  nights: string[];
  selected: Set<string>;
  onToggle: (night: string) => void;
}) {
  const { s, dateLocale } = useStaffText();
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label={s.reletting.nightsToClear}>
      {nights.map((night) => {
        const on = selected.has(night);
        return (
          <li key={night}>
            <button
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(night)}
              className={`tabular min-h-10 rounded-md border px-2 text-xs ${
                on ? "border-ink bg-ink text-paper" : "border-ink/30 text-ink-muted"
              }`}
            >
              {formatLongDate(night, dateLocale).replace(/\s(de\s)?\d{4}$/, "")}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function Item({ item, staffId }: { item: RelettingQueueItem; staffId: string | null }) {
  const { request, ownerName, boatName, berthClass, estimate } = item;
  const { s, dateLocale } = useStaffText();
  const r = s.reletting;
  const day = (iso: string) => formatLongDate(iso, dateLocale);
  const [note, setNote] = useState("");
  const { busy, error, run } = useStaffAction();
  const [open, setOpen] = useState(false);
  const offered = nightDates(request.startDate, request.endDate);
  const nights = countNights(request.startDate, request.endDate);
  // The last nights before the holder returns start unticked (the marina's return
  // buffer), and staff can still tick them.
  const returnBuffer =
    marinas.find((m) => m.id === request.marinaId)?.reletting?.returnBufferDays ?? 0;
  const [approvedSet, setApprovedSet] = useState<Set<string>>(
    new Set(nightsOfferedToVisitors(request.startDate, request.endDate, returnBuffer))
  );
  const [nightsBooked, setNightsBooked] = useState(String(defaultNightsBooked(nights)));
  const [maxLengthM, setMaxLengthM] = useState("");
  const [maxBeamM, setMaxBeamM] = useState("");
  const [earliestReletDate, setEarliestReletDate] = useState("");
  const [bufferDays, setBufferDays] = useState("2");
  const lastNote = request.history[request.history.length - 1]?.note;
  const index = RELETTING_PROGRESS.indexOf(request.status);
  const canAdvance =
    request.status !== "declined" &&
    request.status !== "cancelled" &&
    index >= 1 &&
    index < RELETTING_PROGRESS.length - 1;
  const nextStatus = canAdvance ? RELETTING_PROGRESS[index + 1] : undefined;
  const nextLabel = nextStatus ? r.statuses[nextStatus] : "";
  const rowId = `relet-${request.id}`;

  function decide(decision: "approve" | "decline") {
    return run(() =>
      decideReletting(
        staffId,
        request.id,
        decision,
        note,
        decision === "approve" ? [...approvedSet] : undefined,
        decision === "approve"
          ? {
              maxLengthM: maxLengthM ? Number(maxLengthM) : null,
              maxBeamM: maxBeamM ? Number(maxBeamM) : null,
              earliestReletDate: earliestReletDate || null,
              bufferDays: Number(bufferDays) || 0,
            }
          : undefined
      )
    );
  }

  return (
    <li className="staff-panel">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={rowId}
        className="flex w-full flex-wrap items-start justify-between gap-x-6 gap-y-2 text-left"
      >
        <div>
          <p className="font-medium text-ink">
            {r.holderBerth(ownerName, request.berthId)}
            {berthClass ? ` (${s.common.classLabel(berthClass)})` : ""}
          </p>
          <p className="tabular text-xs text-ink-muted">
            {s.common.range(day(request.startDate), day(request.endDate))},{" "}
            {s.common.nights(nights)}
            {boatName ? `, ${boatName}` : ""}
          </p>
        </div>
        <span className="staff-badge staff-badge-outline">{r.statuses[request.status]}</span>
      </button>

      <Collapse open={open} id={rowId}>
        <div className="mt-3 border-t border-hairline pt-3 text-sm">
          {lastNote && request.status === "submitted" ? (
            <p className="font-medium text-ink">{lastNote}.</p>
          ) : null}
          {request.bookedNights.length > 0 ? (
            <p className="tabular text-ink">
              {r.bookedOf(request.bookedNights.length, (request.approvedNights ?? offered).length)}
            </p>
          ) : null}
          {request.status === "cancelled" ? (
            <p className="text-ink-soft">{r.cancelledByHolder}</p>
          ) : null}

          <ul className="mt-2 space-y-0.5 text-ink-soft">
            <li>{r.boatRemoval(request.boatRemovalConfirmed ? s.common.yes : s.common.no)}</li>
            <li>{r.termsAccepted(day(request.termsAcceptedAt))}</li>
          </ul>

          {estimate ? (
            <p className="tabular mt-2 text-ink-muted">
              {r.estimate(
                eur(estimate.grossEur),
                eur(estimate.ownerShareEur),
                eur(estimate.feeEur),
                eur(estimate.netEur)
              )}
            </p>
          ) : null}

          {request.status === "submitted" ? (
            <div className="mt-4">
              <p className="staff-label">{r.nightsToClear}</p>
              <NightChips
                nights={offered}
                selected={approvedSet}
                onToggle={(night) =>
                  setApprovedSet((prev) => {
                    const next = new Set(prev);
                    if (next.has(night)) next.delete(night);
                    else next.add(night);
                    return next;
                  })
                }
              />
              <p className="mt-1 text-xs text-ink-muted">
                {r.selected(approvedSet.size, offered.length)}
              </p>

              <p className="staff-label mt-3">{r.conditionsTitle}</p>
              <div className="mt-1 grid max-w-lg grid-cols-2 gap-2 sm:grid-cols-4">
                <label className="text-sm">
                  <span className="staff-label">{r.maxLength}</span>
                  <input
                    type="number"
                    min={0}
                    value={maxLengthM}
                    onChange={(e) => setMaxLengthM(e.target.value)}
                    className="staff-field"
                  />
                </label>
                <label className="text-sm">
                  <span className="staff-label">{r.maxBeam}</span>
                  <input
                    type="number"
                    min={0}
                    value={maxBeamM}
                    onChange={(e) => setMaxBeamM(e.target.value)}
                    className="staff-field"
                  />
                </label>
                <label className="text-sm">
                  <span className="staff-label">{r.earliest}</span>
                  <input
                    type="date"
                    value={earliestReletDate}
                    onChange={(e) => setEarliestReletDate(e.target.value)}
                    className="staff-field"
                  />
                </label>
                <label className="text-sm">
                  <span className="staff-label">{r.buffer}</span>
                  <input
                    type="number"
                    min={0}
                    value={bufferDays}
                    onChange={(e) => setBufferDays(e.target.value)}
                    className="staff-field"
                  />
                </label>
              </div>

              <label className="mt-3 block max-w-md text-sm">
                <span className="staff-label">{r.noteToHolder}</span>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="staff-field"
                />
              </label>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void decide("approve")}
                  disabled={busy || approvedSet.size === 0}
                  className="staff-btn staff-btn-primary"
                >
                  {approvedSet.size < offered.length
                    ? r.approvePartial(approvedSet.size)
                    : r.approve}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void decide("decline")}
                  className="staff-btn staff-btn-danger"
                >
                  {r.notApproved}
                </button>
              </div>
            </div>
          ) : null}

          {request.conditions &&
          (request.conditions.maxLengthM ||
            request.conditions.maxBeamM ||
            request.conditions.earliestReletDate ||
            request.conditions.bufferDays) ? (
            <p className="tabular mt-2 text-ink-muted">
              {r.conditions}{" "}
              {[
                request.conditions.maxLengthM
                  ? r.condMaxLength(request.conditions.maxLengthM)
                  : null,
                request.conditions.maxBeamM ? r.condMaxBeam(request.conditions.maxBeamM) : null,
                request.conditions.earliestReletDate
                  ? r.condNotBefore(day(request.conditions.earliestReletDate))
                  : null,
                request.conditions.bufferDays ? r.condBuffer(request.conditions.bufferDays) : null,
              ]
                .filter(Boolean)
                .join(", ")}
            </p>
          ) : null}

          {request.earlyReturnRequestedAt ? (
            <p className="mt-2 font-medium text-ink">{r.earlyReturn}</p>
          ) : null}

          {canAdvance ? (
            <div className="mt-4">
              {nextStatus === "booked" ? (
                <label className="mb-2 block max-w-[10rem] text-sm">
                  <span className="staff-label">{r.nightsBooked}</span>
                  <input
                    type="number"
                    min={1}
                    max={(request.approvedNights ?? offered).length}
                    value={nightsBooked}
                    onChange={(e) => setNightsBooked(e.target.value)}
                    className="staff-field"
                  />
                </label>
              ) : null}
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  void run(() =>
                    advanceRelettingStatus(staffId, request.id, {
                      nightsBooked: Number(nightsBooked) || undefined,
                    })
                  )
                }
                className="staff-btn"
              >
                {r.advance(nextLabel)}
              </button>
              <p className="mt-1 text-xs text-ink-muted">{r.previewOnly}</p>
            </div>
          ) : null}

          {request.decisionNote ? (
            <p className="mt-2 text-ink-soft">{r.noteSent(request.decisionNote)}</p>
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

// A simple per-holder ledger: nights let, what the visitor paid, what the
// holder was credited and what the marina kept, from every settled request.
function Ledger({ items }: { items: RelettingQueueItem[] }) {
  const rows = new Map<
    string,
    { ownerName: string; nights: number; grossEur: number; ownerShareEur: number; feeEur: number }
  >();
  for (const { request, ownerName } of items) {
    if (request.netEur === null) continue;
    const row = rows.get(request.userId) ?? {
      ownerName,
      nights: 0,
      grossEur: 0,
      ownerShareEur: 0,
      feeEur: 0,
    };
    row.nights += request.nightsRelet ?? 0;
    row.grossEur += request.grossEur ?? 0;
    row.ownerShareEur += request.ownerShareEur ?? 0;
    row.feeEur += request.feeEur ?? 0;
    rows.set(request.userId, row);
  }
  const list = Array.from(rows.values());
  const { s } = useStaffText();
  const r = s.reletting;
  if (list.length === 0) return null;

  return (
    <div className="mt-8 overflow-x-auto" tabIndex={0} role="region" aria-label={r.ledgerRegion}>
      <table className="staff-table w-full text-left text-sm">
        <thead>
          <tr>
            <th scope="col">{r.ledgerHolder}</th>
            <th scope="col">{r.ledgerNights}</th>
            <th scope="col">{r.ledgerRevenue}</th>
            <th scope="col">{r.ledgerCredit}</th>
            <th scope="col">{r.ledgerMarina}</th>
          </tr>
        </thead>
        <tbody>
          {list.map((row) => (
            <tr key={row.ownerName}>
              <td>{row.ownerName}</td>
              <td className="tabular">{row.nights}</td>
              <td className="tabular">{eur(row.grossEur)}</td>
              <td className="tabular">{eur(row.ownerShareEur)}</td>
              <td className="tabular">{eur(row.feeEur)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// The marina's consent step for reletting: every request from a berth holder
// lands here as "submitted" and nothing is relet until staff decide it.
export default function RelettingQueue() {
  const staffId = useStaffId();
  const { s } = useStaffText();
  const r = s.reletting;
  const { value: items, ready } = useStaffData(
    () => getRelettingQueue(staffId),
    NONE,
    staffId ?? ""
  );

  const pending = items.filter((i) => i.request.status === "submitted");
  const active = items.filter((i) => ["approved", "listed", "booked"].includes(i.request.status));
  const closed = items.filter((i) =>
    ["completed", "declined", "cancelled"].includes(i.request.status)
  );

  return (
    <div>
      <h1 className="type-heading type-h2 text-ink">{r.title}</h1>
      <p className="mt-1 max-w-2xl text-sm text-ink-muted">{r.intro}</p>

      <h2 className="type-heading type-h3 mt-6 text-ink">{r.waiting(pending.length)}</h2>
      {ready && pending.length === 0 ? (
        <p className="staff-empty mt-2">{r.nothingWaiting}</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {pending.map((item) => (
            <Item key={item.request.id} item={item} staffId={staffId} />
          ))}
        </ul>
      )}

      {active.length > 0 ? (
        <>
          <h2 className="type-heading type-h3 mt-6 text-ink">{r.inProgress}</h2>
          <ul className="mt-2 space-y-2">
            {active.map((item) => (
              <Item key={item.request.id} item={item} staffId={staffId} />
            ))}
          </ul>
        </>
      ) : null}

      {closed.length > 0 ? (
        <>
          <h2 className="type-heading type-h3 mt-6 text-ink">{r.closed(closed.length)}</h2>
          <ul className="mt-2 space-y-2">
            {closed.map((item) => (
              <Item key={item.request.id} item={item} staffId={staffId} />
            ))}
          </ul>
        </>
      ) : null}

      <h2 className="type-heading type-h3 mt-8 text-ink">{r.ledger}</h2>
      <Ledger items={items} />
    </div>
  );
}
