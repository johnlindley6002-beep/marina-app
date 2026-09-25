"use client";

import { useState } from "react";
import { siteConfig } from "../../data/site";
import { eur, formatLongDate } from "../../lib/formatDate";
import {
  advanceRelettingStatus,
  countNights,
  decideReletting,
  defaultNightsBooked,
  getRelettingQueue,
  RELETTING_PROGRESS,
  RELETTING_STATUS_LABELS,
  type RelettingQueueItem,
} from "../../lib/mockData";
import { useMock } from "../../lib/useMock";
import { useAuth } from "../components/AuthProvider";
import Disclosure from "../components/Disclosure";
import StatusChip from "../components/StatusChip";

const NONE: RelettingQueueItem[] = [];

function Item({ item, staffId }: { item: RelettingQueueItem; staffId: string }) {
  const { request, ownerName, boatName, berthClass, estimate } = item;
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const nights = countNights(request.startDate, request.endDate);
  const [nightsBooked, setNightsBooked] = useState(String(defaultNightsBooked(nights)));
  const lastNote = request.history[request.history.length - 1]?.note;
  const index = RELETTING_PROGRESS.indexOf(request.status);
  const canAdvance =
    request.status !== "declined" && index >= 1 && index < RELETTING_PROGRESS.length - 1;
  const nextLabel = canAdvance
    ? RELETTING_STATUS_LABELS[RELETTING_PROGRESS[index + 1]]
    : "";

  function decide(decision: "approve" | "decline") {
    const result = decideReletting(staffId, request.id, decision, note);
    setError(result.ok ? null : result.error);
  }

  return (
    <li className="hairline-top py-8 first:border-t-0">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
        <div>
          <p className="text-lg font-medium text-ink">
            {ownerName}, berth {request.berthId}
            {berthClass ? ` (Class ${berthClass})` : ""}
          </p>
          <p className="tabular text-sm text-ink/70">
            {formatLongDate(request.startDate)} to {formatLongDate(request.endDate)},{" "}
            {nights} nights{boatName ? `, ${boatName}` : ""}
          </p>
        </div>
        <StatusChip>{RELETTING_STATUS_LABELS[request.status]}</StatusChip>
      </div>

      {lastNote && request.status === "submitted" ? (
        <p className="mt-3 text-sm font-medium text-ink">{lastNote}.</p>
      ) : null}
      {request.bookedNights.length > 0 ? (
        <p className="tabular mt-3 text-sm text-ink">
          {request.bookedNights.length} of {nights} nights booked
          {request.bookedNights.length < nights
            ? `, ${nights - request.bookedNights.length} still open`
            : ""}
        </p>
      ) : null}
      {request.status === "cancelled" ? (
        <p className="mt-3 text-sm text-ink/75">Cancelled by the holder.</p>
      ) : null}

      <ul className="mt-4 space-y-1 text-sm text-ink/75">
        <li>Boat removal confirmed by the holder: {request.boatRemovalConfirmed ? "yes" : "no"}</li>
        <li>Holder asked the marina to relet: {request.reletConsent ? "yes" : "no"}</li>
        <li>Terms accepted: {formatLongDate(request.termsAcceptedAt)}</li>
      </ul>

      {estimate ? (
        <p className="tabular mt-3 text-sm text-ink/70">
          If every night were relet: berth income {eur(estimate.grossEur)}, holder
          share {eur(estimate.ownerShareEur)}, fee {eur(estimate.feeEur)}, net{" "}
          {eur(estimate.netEur)}.
        </p>
      ) : null}

      {request.status === "submitted" ? (
        <div className="mt-6">
          <label className="block max-w-md text-sm">
            <span className="field-label">
              Note to the holder (optional)
            </span>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="field"
            />
          </label>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => decide("approve")}
              className="btn-dark"
            >
              Approve
            </button>
            <button
              type="button"
              onClick={() => decide("decline")}
              className="btn-secondary"
            >
              Decline
            </button>
          </div>
        </div>
      ) : null}

      {canAdvance ? (
        <div className="mt-6">
          {nextLabel === "Booked" ? (
            <label className="mb-3 block max-w-[10rem] text-sm">
              <span className="field-label">Nights booked (mock)</span>
              <input
                type="number"
                min={1}
                max={nights}
                value={nightsBooked}
                onChange={(e) => setNightsBooked(e.target.value)}
                className="field"
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
            className="btn-secondary"
          >
            Mock: mark as {nextLabel}
          </button>
          <p className="mt-2 text-xs text-ink/70">
            Preview only. In the real product these steps come from the
            marina&apos;s system and real bookings.
          </p>
        </div>
      ) : null}

      {request.decisionNote ? (
        <p className="mt-3 text-sm text-ink/75">Note sent: {request.decisionNote}</p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-3 text-sm text-error">
          {error}
        </p>
      ) : null}
    </li>
  );
}

// The marina's consent step for reletting: every request from a berth holder
// lands here as "submitted" and nothing is relet until staff approve it.
export default function RelettingQueue() {
  const { user } = useAuth();
  const { value: items, ready } = useMock(
    () => getRelettingQueue(user?.id ?? null),
    NONE,
    user?.id ?? ""
  );
  const staffId = user?.id ?? "";

  const pending = items.filter((i) => i.request.status === "submitted");
  const active = items.filter((i) =>
    ["approved", "listed", "booked"].includes(i.request.status)
  );
  const closed = items.filter((i) =>
    ["completed", "declined", "cancelled"].includes(i.request.status)
  );

  return (
    <section className="chapter" aria-labelledby="relet-heading">
      <h2 id="relet-heading" className="type-heading type-h2 text-ink">
        Reletting approvals
      </h2>
      <p className="measure mt-2 text-ink/75">{siteConfig.relet.queueIntro}</p>

      <h3 className="type-heading type-h3 mt-10 text-ink">
        Waiting for your decision ({pending.length})
      </h3>
      {ready && pending.length === 0 ? (
        <p className="mt-3 text-ink/75">Nothing is waiting.</p>
      ) : (
        <ul className="mt-2">
          {pending.map((item) => (
            <Item key={item.request.id} item={item} staffId={staffId} />
          ))}
        </ul>
      )}

      {active.length > 0 ? (
        <>
          <h3 className="type-heading type-h3 stack-md text-ink">In progress</h3>
          <ul className="mt-2">
            {active.map((item) => (
              <Item key={item.request.id} item={item} staffId={staffId} />
            ))}
          </ul>
        </>
      ) : null}

      {closed.length > 0 ? (
        <Disclosure
          className="mt-10"
          label={`Closed requests (${closed.length})`}
          openLabel="Hide closed requests"
        >
          <ul>
            {closed.map((item) => (
              <Item key={item.request.id} item={item} staffId={staffId} />
            ))}
          </ul>
        </Disclosure>
      ) : null}
    </section>
  );
}
