"use client";

import { marinas } from "../../data/marinas";
import { eur, formatLongDate } from "../../lib/formatDate";
import {
  countNights,
  getRelettingRequests,
  RELETTING_PROGRESS,
  RELETTING_STATUS_LABELS,
  type RelettingRequest,
} from "../../lib/mockData";
import { useMock } from "../../lib/useMock";
import { useAuth } from "../components/AuthProvider";
import Disclosure from "../components/Disclosure";

const NONE: RelettingRequest[] = [];

function Trail({ request }: { request: RelettingRequest }) {
  if (request.status === "declined") {
    return (
      <p className="mt-4 text-sm text-ink/75">
        Declined by the marina.
        {request.decisionNote ? ` Note: ${request.decisionNote}` : ""}
      </p>
    );
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

// One row per absence: where it stands, and a transparent breakdown of what
// the reletting earned. All figures come from the mock layer.
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
                </p>
              </div>
              <p className="rounded-full border border-ink/30 px-3 py-1 text-sm font-medium text-ink">
                {RELETTING_STATUS_LABELS[request.status]}
              </p>
            </div>

            <Trail request={request} />

            <p className="tabular mt-5 text-ink">
              {settled
                ? `Net ${terms?.settlement === "payment" ? "payment" : "credit"}: ${eur(request.netEur as number)}`
                : request.status === "declined"
                  ? ""
                  : "The credit appears once a stay is booked."}
            </p>

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
          </li>
        );
      })}
    </ul>
  );
}
