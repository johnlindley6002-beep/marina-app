"use client";

import { useState } from "react";
import { siteConfig } from "../../../data/site";
import { eur, formatLongDate } from "../../../lib/formatDate";
import {
  advanceRelettingStatus,
  countNights,
  decideReletting,
  defaultNightsBooked,
  getRelettingQueue,
  nightDates,
  RELETTING_PROGRESS,
  RELETTING_STATUS_LABELS,
  type RelettingQueueItem,
} from "../../../lib/mockData";
import { useMock } from "../../../lib/useMock";
import { useAuth } from "../../components/AuthProvider";
import { Collapse } from "../../components/Disclosure";

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
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Nights to clear for reletting">
      {nights.map((night) => {
        const on = selected.has(night);
        return (
          <li key={night}>
            <button
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(night)}
              className={`min-h-10 rounded-[3px] border px-2 text-xs tabular ${
                on ? "border-ink bg-ink text-paper" : "border-ink/30 text-ink/70"
              }`}
            >
              {formatLongDate(night).replace(/\s\d{4}$/, "")}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function Item({ item, staffId }: { item: RelettingQueueItem; staffId: string }) {
  const { request, ownerName, boatName, berthClass, estimate } = item;
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const offered = nightDates(request.startDate, request.endDate);
  const nights = countNights(request.startDate, request.endDate);
  const [approvedSet, setApprovedSet] = useState<Set<string>>(new Set(offered));
  const [nightsBooked, setNightsBooked] = useState(String(defaultNightsBooked(nights)));
  const [maxLengthM, setMaxLengthM] = useState("");
  const [maxBeamM, setMaxBeamM] = useState("");
  const [earliestReletDate, setEarliestReletDate] = useState("");
  const [bufferDays, setBufferDays] = useState("2");
  const lastNote = request.history[request.history.length - 1]?.note;
  const index = RELETTING_PROGRESS.indexOf(request.status);
  const canAdvance =
    request.status !== "declined" && request.status !== "cancelled" && index >= 1 && index < RELETTING_PROGRESS.length - 1;
  const nextLabel = canAdvance ? RELETTING_STATUS_LABELS[RELETTING_PROGRESS[index + 1]] : "";
  const rowId = `relet-${request.id}`;

  function decide(decision: "approve" | "decline") {
    const result = decideReletting(
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
    );
    setError(result.ok ? null : result.error);
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
            {ownerName}, berth {request.berthId}
            {berthClass ? ` (Class ${berthClass})` : ""}
          </p>
          <p className="tabular text-xs text-ink/70">
            {formatLongDate(request.startDate)} to {formatLongDate(request.endDate)}, {nights}{" "}
            nights{boatName ? `, ${boatName}` : ""}
          </p>
        </div>
        <span className="staff-badge staff-badge-outline">
          {RELETTING_STATUS_LABELS[request.status]}
        </span>
      </button>

      <Collapse open={open} id={rowId}>
        <div className="mt-3 border-t border-hairline pt-3 text-sm">
          {lastNote && request.status === "submitted" ? (
            <p className="font-medium text-ink">{lastNote}.</p>
          ) : null}
          {request.bookedNights.length > 0 ? (
            <p className="tabular text-ink">
              {request.bookedNights.length} of {(request.approvedNights ?? offered).length} approved
              nights booked
            </p>
          ) : null}
          {request.status === "cancelled" ? (
            <p className="text-ink/75">Cancelled by the holder.</p>
          ) : null}

          <ul className="mt-2 space-y-0.5 text-ink/75">
            <li>Boat removal confirmed: {request.boatRemovalConfirmed ? "yes" : "no"}</li>
            <li>Terms accepted: {formatLongDate(request.termsAcceptedAt)}</li>
          </ul>

          {estimate ? (
            <p className="tabular mt-2 text-ink/70">
              If every night were relet: income {eur(estimate.grossEur)}, holder share{" "}
              {eur(estimate.ownerShareEur)}, fee {eur(estimate.feeEur)}, net {eur(estimate.netEur)}.
            </p>
          ) : null}

          {request.status === "submitted" ? (
            <div className="mt-4">
              <p className="staff-label">Nights to clear for reletting</p>
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
              <p className="mt-1 text-xs text-ink/70">
                {approvedSet.size} of {offered.length} nights selected. Fewer than all is a
                partial approval.
              </p>

              <p className="staff-label mt-3">Conditions for a released berth (optional)</p>
              <div className="mt-1 grid max-w-lg grid-cols-2 gap-2 sm:grid-cols-4">
                <label className="text-sm">
                  <span className="staff-label">Max length (m)</span>
                  <input
                    type="number"
                    min={0}
                    value={maxLengthM}
                    onChange={(e) => setMaxLengthM(e.target.value)}
                    className="staff-field"
                  />
                </label>
                <label className="text-sm">
                  <span className="staff-label">Max beam (m)</span>
                  <input
                    type="number"
                    min={0}
                    value={maxBeamM}
                    onChange={(e) => setMaxBeamM(e.target.value)}
                    className="staff-field"
                  />
                </label>
                <label className="text-sm">
                  <span className="staff-label">Earliest relet date</span>
                  <input
                    type="date"
                    value={earliestReletDate}
                    onChange={(e) => setEarliestReletDate(e.target.value)}
                    className="staff-field"
                  />
                </label>
                <label className="text-sm">
                  <span className="staff-label">Buffer before return (days)</span>
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
                <span className="staff-label">Note to the holder (optional)</span>
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
                  onClick={() => decide("approve")}
                  disabled={approvedSet.size === 0}
                  className="staff-btn staff-btn-primary"
                >
                  Approve{approvedSet.size < offered.length ? ` (${approvedSet.size} nights)` : ""}
                </button>
                <button type="button" onClick={() => decide("decline")} className="staff-btn staff-btn-danger">
                  Not approved
                </button>
              </div>
            </div>
          ) : null}

          {request.conditions &&
          (request.conditions.maxLengthM ||
            request.conditions.maxBeamM ||
            request.conditions.earliestReletDate ||
            request.conditions.bufferDays) ? (
            <p className="tabular mt-2 text-ink/70">
              Conditions:{" "}
              {[
                request.conditions.maxLengthM ? `max ${request.conditions.maxLengthM} m length` : null,
                request.conditions.maxBeamM ? `max ${request.conditions.maxBeamM} m beam` : null,
                request.conditions.earliestReletDate
                  ? `not before ${formatLongDate(request.conditions.earliestReletDate)}`
                  : null,
                request.conditions.bufferDays ? `${request.conditions.bufferDays} day buffer before return` : null,
              ]
                .filter(Boolean)
                .join(", ")}
            </p>
          ) : null}

          {request.earlyReturnRequestedAt ? (
            <p className="mt-2 font-medium text-ink">The holder asked to return early.</p>
          ) : null}

          {canAdvance ? (
            <div className="mt-4">
              {nextLabel === "Booked" ? (
                <label className="mb-2 block max-w-[10rem] text-sm">
                  <span className="staff-label">Nights booked (mock)</span>
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
                onClick={() => {
                  const result = advanceRelettingStatus(staffId, request.id, {
                    nightsBooked: Number(nightsBooked) || undefined,
                  });
                  setError(result.ok ? null : result.error);
                }}
                className="staff-btn"
              >
                Mock: mark as {nextLabel}
              </button>
              <p className="mt-1 text-xs text-ink/70">
                Preview only. In the real product this comes from real visitor bookings.
              </p>
            </div>
          ) : null}

          {request.decisionNote ? (
            <p className="mt-2 text-ink/75">Note sent: {request.decisionNote}</p>
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
  if (list.length === 0) return null;

  return (
    <div className="mt-8 overflow-x-auto">
      <table className="staff-table w-full text-left text-sm">
        <thead>
          <tr>
            <th scope="col">Holder</th>
            <th scope="col">Nights let</th>
            <th scope="col">Visitor revenue</th>
            <th scope="col">Holder credit</th>
            <th scope="col">Marina share</th>
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
  const { user } = useAuth();
  const staffId = user?.id ?? "";
  const { value: items, ready } = useMock(
    () => getRelettingQueue(user?.id ?? null),
    NONE,
    user?.id ?? ""
  );

  const pending = items.filter((i) => i.request.status === "submitted");
  const active = items.filter((i) => ["approved", "listed", "booked"].includes(i.request.status));
  const closed = items.filter((i) =>
    ["completed", "declined", "cancelled"].includes(i.request.status)
  );

  return (
    <div>
      <h1 className="type-heading type-h2 text-ink">Reletting approvals</h1>
      <p className="mt-1 max-w-2xl text-sm text-ink/70">{siteConfig.relet.queueIntro}</p>

      <h2 className="type-heading type-h3 mt-6 text-ink">
        Waiting for your decision ({pending.length})
      </h2>
      {ready && pending.length === 0 ? (
        <p className="staff-empty mt-2">Nothing is waiting.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {pending.map((item) => (
            <Item key={item.request.id} item={item} staffId={staffId} />
          ))}
        </ul>
      )}

      {active.length > 0 ? (
        <>
          <h2 className="type-heading type-h3 mt-6 text-ink">In progress</h2>
          <ul className="mt-2 space-y-2">
            {active.map((item) => (
              <Item key={item.request.id} item={item} staffId={staffId} />
            ))}
          </ul>
        </>
      ) : null}

      {closed.length > 0 ? (
        <>
          <h2 className="type-heading type-h3 mt-6 text-ink">Closed ({closed.length})</h2>
          <ul className="mt-2 space-y-2">
            {closed.map((item) => (
              <Item key={item.request.id} item={item} staffId={staffId} />
            ))}
          </ul>
        </>
      ) : null}

      <h2 className="type-heading type-h3 mt-8 text-ink">Ledger</h2>
      <Ledger items={items} />
    </div>
  );
}
