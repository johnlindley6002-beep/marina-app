"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { marinas } from "../../data/marinas";
import { siteConfig } from "../../data/site";
import { eur, formatLongDate } from "../../lib/formatDate";
import {
  cancelRelettingRequest,
  countNights,
  getRelettingRequests,
  isRelettingEditable,
  nightDates,
  RELETTING_PROGRESS,
  RELETTING_STATUS_LABELS,
  startRelettingDraftFrom,
  type RelettingRequest,
} from "../../lib/mockData";
import { useMock } from "../../lib/useMock";
import { useAuth } from "../components/AuthProvider";
import Disclosure from "../components/Disclosure";
import StatusChip from "../components/StatusChip";

const NONE: RelettingRequest[] = [];
const copy = siteConfig.relet;

function Trail({ request }: { request: RelettingRequest }) {
  if (request.status === "declined" || request.status === "cancelled") {
    return null;
  }
  const current = RELETTING_PROGRESS.indexOf(request.status);
  return (
    <ol
      aria-label="Progress"
      className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm"
    >
      {RELETTING_PROGRESS.map((status, i) => {
        const reached = i <= current;
        return (
          <li
            key={status}
            aria-current={i === current ? "step" : undefined}
            className={`flex items-center gap-2 ${
              reached ? "text-ink" : "text-ink/60"
            } ${i === current ? "font-medium" : ""}`}
          >
            <span
              aria-hidden="true"
              className={`h-2 w-2 rounded-full border border-ink ${
                reached ? "bg-ink" : ""
              }`}
            />
            {RELETTING_STATUS_LABELS[status]}
          </li>
        );
      })}
    </ol>
  );
}

// Which nights a visitor has booked and which are still open, night by night.
// A filled square is booked and an outlined one is still open, and the words
// beside it say the same.
function NightStrip({ request }: { request: RelettingRequest }) {
  const nights = nightDates(request.startDate, request.endDate);
  const booked = request.bookedNights.length;
  if (booked === 0 || nights.length === 0) return null;
  const open = nights.length - booked;
  const finished = request.status === "completed";
  return (
    <div className="mt-5">
      <p className="text-ink">
        <span className="tabular font-medium">
          {booked} of {nights.length} nights booked
        </span>
        <span className="text-ink/75">
          {open > 0
            ? finished
              ? `, ${open} not booked`
              : `, ${open} still open`
            : ""}
        </span>
      </p>
      <ul className="mt-2 flex flex-wrap gap-1" aria-label="Nights">
        {nights.map((night) => {
          const isBooked = request.bookedNights.includes(night);
          return (
            <li
              key={night}
              className={`h-4 w-4 rounded-[2px] border border-ink ${
                isBooked ? "bg-ink" : ""
              }`}
            >
              <span className="sr-only">
                {formatLongDate(night)}: {isBooked ? "booked" : "open"}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Actions({ request }: { request: RelettingRequest }) {
  const { user } = useAuth();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const marina = marinas.find((m) => m.id === request.marinaId);
  const userId = user?.id ?? null;

  function begin(mode: "edit" | "resubmit") {
    if (startRelettingDraftFrom(userId, request.id, mode)) {
      router.push("/owner/relet");
    } else {
      setError("This request can no longer be changed.");
    }
  }

  if (isRelettingEditable(request)) {
    return (
      <div className="mt-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <button type="button" onClick={() => begin("edit")} className="btn-secondary">
            Change dates
          </button>
          {!confirming ? (
            <button type="button" onClick={() => setConfirming(true)} className="btn-quiet">
              Cancel request
            </button>
          ) : null}
        </div>
        {confirming ? (
          <div role="alertdialog" aria-label="Cancel this request" className="mt-3">
            <p className="text-ink">{copy.cancelConfirm}</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-4">
              <button
                type="button"
                onClick={() => {
                  const result = cancelRelettingRequest(userId, request.id);
                  if (!result.ok) setError(result.error);
                  setConfirming(false);
                }}
                className="btn-quiet font-medium text-error"
              >
                Yes, cancel it
              </button>
              <button type="button" onClick={() => setConfirming(false)} className="btn-quiet">
                Keep it
              </button>
            </div>
          </div>
        ) : null}
        {request.status !== "submitted" ? (
          <p className="mt-2 text-sm text-ink/70">
            Changing the dates sends the request to the marina again, because it
            approved the earlier dates.
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="field-error mt-2">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  if (request.status === "declined") {
    return (
      <div className="mt-5">
        <p className="text-ink/75">
          {copy.notApprovedLead}
          {request.decisionNote ? ` Reason: ${request.decisionNote}` : ""}
        </p>
        <button type="button" onClick={() => begin("resubmit")} className="btn-secondary mt-4">
          Adjust and resubmit
        </button>
        {error ? (
          <p role="alert" className="field-error mt-2">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  if (request.status === "cancelled") {
    return <p className="mt-5 text-ink/75">You cancelled this request.</p>;
  }

  if (request.status === "booked") {
    return (
      <p className="mt-5 max-w-xl text-ink/75">
        {copy.lockedNote}
        {marina ? (
          <>
            {" "}
            <a href={`mailto:${marina.email}`} className="link text-ink">
              {marina.email}
            </a>
          </>
        ) : null}
      </p>
    );
  }
  return null;
}

// One row per absence: where it stands, which nights are booked, what it
// earned, and what the holder can still do. All from the mock layer.
export default function RelettingLedger() {
  const { user } = useAuth();
  const { value: requests, ready } = useMock(
    () => getRelettingRequests(user?.id ?? null),
    NONE,
    user?.id ?? ""
  );

  if (ready && requests.length === 0) {
    return (
      <p className="measure mt-4 text-ink/75">
        No absences yet. When you make your berth available, each one is tracked
        here.
      </p>
    );
  }

  return (
    <ul className="mt-4">
      {requests.map((request) => {
        const terms = marinas.find((m) => m.id === request.marinaId)?.reletting;
        const nights = countNights(request.startDate, request.endDate);
        const settled = request.netEur !== null;
        return (
          <li key={request.id} className="hairline-top py-8 first:border-t-0">
            <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
              <div>
                <p className="text-lg font-medium text-ink">
                  {formatLongDate(request.startDate)} to{" "}
                  {formatLongDate(request.endDate)}
                </p>
                <p className="tabular text-sm text-ink/70">
                  {nights} nights away, berth {request.berthId}
                  {request.resubmitOf ? ", sent again" : ""}
                </p>
              </div>
              <StatusChip>{RELETTING_STATUS_LABELS[request.status]}</StatusChip>
            </div>

            <Trail request={request} />
            <NightStrip request={request} />

            {settled ? (
              <p className="tabular mt-5 text-ink">
                Net {terms?.settlement === "payment" ? "payment" : "credit"}:{" "}
                {eur(request.netEur as number)}
              </p>
            ) : request.status === "submitted" ||
              request.status === "approved" ||
              request.status === "listed" ? (
              <p className="mt-5 text-ink/75">
                The credit appears once a stay is booked.
              </p>
            ) : null}

            {settled ? (
              <Disclosure
                label="See the breakdown"
                openLabel="Hide the breakdown"
                className="mt-1"
              >
                <dl className="tabular grid max-w-md grid-cols-[1fr_auto] gap-x-8 gap-y-2 pb-2 text-ink/75">
                  <dt>Nights relet</dt>
                  <dd className="text-right text-ink">{request.nightsRelet}</dd>
                  <dt>Berth income</dt>
                  <dd className="text-right text-ink">{eur(request.grossEur ?? 0)}</dd>
                  <dt>Your share ({terms?.ownerSharePercent}%)</dt>
                  <dd className="text-right text-ink">
                    {eur(request.ownerShareEur ?? 0)}
                  </dd>
                  <dt>Marina fee ({terms?.processingFeePercent}%)</dt>
                  <dd className="text-right text-ink">
                    -{eur(request.feeEur ?? 0)}
                  </dd>
                  <dt className="font-medium text-ink">Net</dt>
                  <dd className="text-right font-medium text-ink">
                    {eur(request.netEur ?? 0)}
                  </dd>
                </dl>
              </Disclosure>
            ) : null}

            <Actions request={request} />
          </li>
        );
      })}
    </ul>
  );
}
