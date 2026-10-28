"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ACCOUNT_DATA_SOURCE,
  acceptProposedDates,
  bookArrivalHelp,
  listMyArrivals,
  myHelpBookings,
  useAccountData,
  type HelpBooking,
  type HelpReason,
  type MyArrival,
} from "@/lib/data";
import HelpBookings from "@/components/booking/HelpBookings";
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

const NO_BOOKINGS: HelpBooking[] = [];

// Help mooring for a request that has none yet.
function AddHelp({ arrivalId }: { arrivalId: string }) {
  const { t } = useLanguage();
  const copy = t.help;
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<HelpReason>("short_handed");
  const [error, setError] = useState("");
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-quiet mt-3 min-h-11">
        {copy.bookArrival}
      </button>
    );
  }
  return (
    <fieldset className="mt-3">
      <legend className="field-label">{copy.reason}</legend>
      {(["short_handed", "first_time", "other"] as const).map((r) => (
        <label
          key={r}
          className="flex min-h-11 cursor-pointer items-center gap-2 text-base text-ink"
        >
          <input
            type="radio"
            name={`help-${arrivalId}`}
            className="h-5 w-5"
            checked={reason === r}
            onChange={() => setReason(r)}
          />
          {copy.reasons[r]}
        </label>
      ))}
      <button
        type="button"
        onClick={async () => {
          const result = await bookArrivalHelp(arrivalId, reason, "");
          setError(result.ok ? "" : copy.bookFailed);
        }}
        className="btn-quiet mt-2 min-h-11"
      >
        {copy.book}
      </button>
      {error ? (
        <p role="alert" className="mt-1 text-sm text-error">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

function ArrivalCard({ arrival, helped }: { arrival: MyArrival; helped: boolean }) {
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
      {!helped && (arrival.status === "requested" || arrival.status === "confirmed") ? (
        <AddHelp arrivalId={arrival.id} />
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
  const { value: bookings } = useAccountData(
    () => (ACCOUNT_DATA_SOURCE === "mock" ? Promise.resolve(NO_BOOKINGS) : myHelpBookings()),
    NO_BOOKINGS,
    userId
  );
  const helped = new Set(
    bookings
      .filter((b) => b.status !== "cancelled")
      .map((b) => b.arrivalId)
      .filter(Boolean)
  );
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
                <ArrivalCard key={arrival.id} arrival={arrival} helped={helped.has(arrival.id)} />
              ))}
            </ul>
          )}
        </section>
        {ACCOUNT_DATA_SOURCE === "supabase" ? <HelpBookings kind="arrivals" /> : null}
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
