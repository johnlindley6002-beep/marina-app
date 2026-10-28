"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ACCOUNT_DATA_SOURCE,
  acceptProposedDates,
  listMyArrivals,
  useAccountData,
  type MyArrival,
} from "@/lib/data";
import { guestError } from "../lib/errors";
import PageHeader from "@/components/layout/PageHeader";
import RoleGate from "@/components/layout/RoleGate";
import StatusChip from "@/components/ui/StatusChip";
import { useAuth } from "@/components/providers/AuthProvider";
import { useFormat } from "@/components/providers/useFormat";
import { useLanguage } from "@/components/providers/LanguageProvider";

type Loaded = MyArrival[] | null;

function ProposedDates({ arrival }: { arrival: MyArrival }) {
  const { t } = useLanguage();
  const { date } = useFormat();
  const copy = t.accounts.arrivals;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    setBusy(true);
    const result = await acceptProposedDates(arrival.id);
    setBusy(false);
    setError(result.ok ? null : guestError(t.accounts, result.error));
  }

  const range = arrival.proposedDeparture
    ? copy.range(date(arrival.proposedArrival), date(arrival.proposedDeparture))
    : copy.openEnded(date(arrival.proposedArrival));

  return (
    <div className="mt-4">
      <p className="type-label">{copy.proposedTitle}</p>
      <p className="tabular mt-1 text-ink">{range}</p>
      <button type="button" onClick={accept} disabled={busy} className="btn-primary mt-3">
        {busy ? copy.accepting : copy.accept}
      </button>
      {error ? (
        <p role="alert" className="field-error mt-2">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function ArrivalCard({ arrival }: { arrival: MyArrival }) {
  const { t } = useLanguage();
  const { date } = useFormat();
  const copy = t.accounts.arrivals;
  const stay = arrival.departure
    ? copy.range(date(arrival.arrival), date(arrival.departure))
    : copy.openEnded(date(arrival.arrival));

  let help: string;
  switch (arrival.status) {
    case "confirmed":
      help = arrival.berthCode
        ? copy.help.confirmed(arrival.berthCode)
        : copy.help.confirmedNoBerth;
      break;
    case "arrived":
      help = copy.help.arrived(arrival.berthCode);
      break;
    default:
      help = copy.help[arrival.status];
  }

  return (
    <li className="hairline-top py-6 first:border-t-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h3 className="type-heading type-h3 text-ink">{arrival.marinaName}</h3>
        <StatusChip>{copy.status[arrival.status]}</StatusChip>
      </div>
      <p className="tabular mt-2 text-ink">
        <span className="text-ink-soft">{copy.stay}: </span>
        {stay}
      </p>
      <p className="mt-1 text-ink">
        <span className="text-ink-soft">{copy.boat}: </span>
        {arrival.boatName}
      </p>
      <p className="measure mt-3 text-ink-soft">{help}</p>
      {arrival.status === "declined" && arrival.note ? (
        <p className="measure mt-1 text-ink-soft">{copy.reason(arrival.note)}</p>
      ) : null}
      {arrival.status === "dates_proposed" ? (
        <>
          {arrival.note ? (
            <p className="measure mt-1 text-ink-soft">{copy.note(arrival.note)}</p>
          ) : null}
          {arrival.proposedArrival ? <ProposedDates arrival={arrival} /> : null}
        </>
      ) : null}
      <p className="mt-3 text-sm text-ink-muted">
        {copy.sent(date(arrival.createdAt.slice(0, 10)))}
      </p>
    </li>
  );
}

function MyArrivalsBody() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const copy = t.accounts.arrivals;
  const userId = user?.id ?? "";
  const { value, ready } = useAccountData<Loaded>(
    () => (ACCOUNT_DATA_SOURCE === "mock" ? Promise.resolve([]) : listMyArrivals()),
    null,
    userId
  );

  const arrivals = value ?? [];
  const failed = ready && value === null;

  return (
    <div className="section">
      <div className="page-column page-reading">
        <PageHeader title={copy.title}>{copy.intro}</PageHeader>

        {ACCOUNT_DATA_SOURCE === "mock" ? (
          <p className="measure mt-6 text-ink-soft">{copy.previewNote}</p>
        ) : null}

        <section className="chapter" aria-labelledby="arrivals-heading">
          <h2 id="arrivals-heading" className="type-heading type-h2 text-ink">
            {copy.list}
          </h2>
          {!ready ? (
            <p role="status" className="mt-4 text-ink-soft">
              {copy.loading}
            </p>
          ) : failed ? (
            <p role="alert" className="mt-4 text-error">
              {copy.loadFailed}
            </p>
          ) : arrivals.length === 0 ? (
            <div className="mt-4">
              <p className="measure text-ink-soft">{copy.empty}</p>
              <Link href="/marinas" className="btn-primary mt-4">
                {copy.findMarina}
              </Link>
            </div>
          ) : (
            <ul className="mt-4">
              {arrivals.map((arrival) => (
                <ArrivalCard key={arrival.id} arrival={arrival} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

export default function MyArrivalsContent() {
  return (
    <RoleGate>
      <MyArrivalsBody />
    </RoleGate>
  );
}
