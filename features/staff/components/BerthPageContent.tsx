"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { getPrimaryMarina } from "@/data/marinas";
import { formatLongDate, todayIso } from "@/lib/dates";
import {
  endHolding,
  getBerthPageData,
  linkHolder,
  useStaffData,
  type BerthEvent,
  type BerthPage,
  type RequestOutcome,
} from "@/lib/data";
import { formatLength } from "@/lib/units";
import { useUnits } from "@/components/providers/UnitsProvider";
import { staffError } from "../lib/errors";
import { useStaffAction } from "../lib/useStaffAction";
import { useStaffText } from "./StaffLanguageProvider";
import SupabaseOnly from "./SupabaseOnly";

const MARINA = getPrimaryMarina();

type Stamp = (iso: string) => string;

function statusLabel(p: ReturnType<typeof useStaffText>["s"]["berthPage"], event: BerthEvent) {
  const table =
    event.subject === "arrival"
      ? p.arrivalStatus
      : event.subject === "relet_offer"
        ? p.offerStatus
        : p.holdingStatus;
  const label = (key: string) =>
    key === "berth_changed" ? p.berthChanged : ((table as Record<string, string>)[key] ?? key);
  return { from: event.fromStatus ? label(event.fromStatus) : "", to: label(event.toStatus) };
}

function LinkForm({ berthId }: { berthId: string }) {
  const { s } = useStaffText();
  const p = s.berthPage;
  const { busy, error, run, setError } = useStaffAction();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [from, setFrom] = useState(todayIso());
  const [to, setTo] = useState("");
  const [done, setDone] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDone("");
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError(s.requests.errors.invalid_email);
      return;
    }
    if (!from || !to || to < from) {
      setError(s.requests.errors.invalid_dates);
      return;
    }
    const ok = await run(async () => {
      const outcome: RequestOutcome = await linkHolder(
        berthId,
        email.trim(),
        from,
        to,
        name.trim()
      );
      return outcome.ok
        ? outcome
        : { ok: false as const, error: outcome.key ? staffError(s, outcome.key) : outcome.error };
    });
    if (ok) {
      setDone(p.linkedOk(email.trim()));
      setEmail("");
      setName("");
    }
  }

  return (
    <form onSubmit={submit} noValidate className="mt-4 max-w-xl space-y-3">
      <h3 className="staff-label">{p.linkTitle}</h3>
      <p className="text-xs text-ink-muted">{p.linkNote}</p>
      <label className="block text-sm">
        <span className="staff-label">{p.email}</span>
        <input
          type="email"
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="staff-field"
        />
      </label>
      <label className="block text-sm">
        <span className="staff-label">{p.name}</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="staff-field"
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="staff-label">{p.from}</span>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="staff-field"
          />
        </label>
        <label className="block text-sm">
          <span className="staff-label">{p.to}</span>
          <input
            type="date"
            value={to}
            min={from}
            onChange={(e) => setTo(e.target.value)}
            className="staff-field"
          />
        </label>
      </div>
      <button type="submit" disabled={busy} className="staff-btn staff-btn-primary">
        {busy ? p.linking : p.link}
      </button>
      {done ? (
        <p role="status" className="text-sm font-medium text-ink">
          {done}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="field-error">
          {error}
        </p>
      ) : null}
    </form>
  );
}

function HoldingRow({ holding, date }: { holding: BerthPage["holdings"][number]; date: Stamp }) {
  const { s } = useStaffText();
  const p = s.berthPage;
  const { busy, error, run } = useStaffAction();
  const [confirming, setConfirming] = useState(false);
  const current = holding.endsOn >= todayIso();

  return (
    <li className="staff-panel">
      <p className="font-medium text-ink">{p.holder(holding.holderName, holding.holderEmail)}</p>
      <p className="tabular text-sm text-ink-muted">
        {p.period(date(holding.startsOn), date(holding.endsOn))}
      </p>
      <p className="text-sm text-ink-soft">{holding.linked ? p.signedIn : p.notSignedIn}</p>
      {current ? (
        confirming ? (
          <div role="alertdialog" aria-label={p.end} className="mt-2">
            <p className="text-sm text-ink">{p.endConfirm}</p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    const outcome = await endHolding(holding.id);
                    return outcome.ok
                      ? outcome
                      : {
                          ok: false as const,
                          error: outcome.key ? staffError(s, outcome.key) : outcome.error,
                        };
                  })
                }
                className="staff-btn staff-btn-danger"
              >
                {p.endYes}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="staff-btn staff-btn-ghost"
              >
                {p.keep}
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirming(true)} className="staff-btn mt-2">
            {p.end}
          </button>
        )
      ) : null}
      {error ? (
        <p role="alert" className="field-error mt-2">
          {error}
        </p>
      ) : null}
    </li>
  );
}

function PageBody({ code }: { code: string }) {
  const { s, dateLocale } = useStaffText();
  const { units } = useUnits();
  const p = s.berthPage;
  const { value: page, ready } = useStaffData<BerthPage | null>(
    () => getBerthPageData(MARINA.id, code),
    null,
    code
  );
  const date: Stamp = (iso) => formatLongDate(iso, dateLocale);

  const when = (at: string) =>
    new Intl.DateTimeFormat(dateLocale, {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Europe/Lisbon",
    }).format(new Date(at));

  if (!ready) return <div className="min-h-[12rem]" aria-hidden="true" />;
  if (!page) {
    return (
      <div>
        <h1 className="type-heading type-h2 text-ink">{p.title(code)}</h1>
        <p className="mt-2 text-ink-soft">{p.notFound}</p>
        <Link href="/staff/berths" className="staff-btn mt-4">
          {p.back}
        </Link>
      </div>
    );
  }

  const { berth } = page;
  const today = todayIso();
  const hasCurrentHolding = page.holdings.some((h) => h.startsOn <= today && h.endsOn >= today);

  return (
    <div>
      <Link href="/staff/berths" className="text-sm underline underline-offset-4">
        {p.back}
      </Link>
      <h1 className="type-heading type-h2 mt-2 text-ink">{p.title(berth.code)}</h1>
      <p className="tabular mt-1 text-sm text-ink-muted">
        {p.size(
          berth.pontoon,
          berth.sizeClass,
          formatLength(berth.maxLengthM, units),
          formatLength(berth.beamM, units),
          formatLength(berth.draftM, units)
        )}
      </p>

      <section className="mt-6" aria-labelledby="holding-heading">
        <h2 id="holding-heading" className="type-heading type-h3 text-ink">
          {p.holdingTitle}
        </h2>
        {page.holdings.length === 0 ? (
          <p className="staff-empty mt-2">{p.noHolder}</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {page.holdings.map((h) => (
              <HoldingRow key={h.id} holding={h} date={date} />
            ))}
          </ul>
        )}
        {hasCurrentHolding ? null : <LinkForm berthId={berth.id} />}
      </section>

      <section className="mt-8" aria-labelledby="stays-heading">
        <h2 id="stays-heading" className="type-heading type-h3 text-ink">
          {p.stays}
        </h2>
        {page.stays.length === 0 ? (
          <p className="staff-empty mt-2">{p.noStays}</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {page.stays.map((stay) => (
              <li key={stay.id} className="staff-panel text-sm">
                <p className="tabular text-ink">
                  {p.stay(
                    stay.boatName || s.common.unnamedBoat,
                    s.common.range(stay.arrival, stay.departure || s.common.openEnded)
                  )}
                </p>
                <p className="text-ink-muted">
                  {(p.arrivalStatus as Record<string, string>)[
                    stay.arrivalStatus === "pending" ? stay.status : stay.arrivalStatus
                  ] ?? stay.status}
                  {stay.skipperName ? ` · ${stay.skipperName}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8" aria-labelledby="offers-heading">
        <h2 id="offers-heading" className="type-heading type-h3 text-ink">
          {p.offers}
        </h2>
        {page.offers.length === 0 ? (
          <p className="staff-empty mt-2">{p.noOffers}</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {page.offers.map((offer) => (
              <li key={offer.id} className="staff-panel text-sm">
                <p className="tabular text-ink">
                  {p.offer(offer.holderName, s.common.range(offer.from, offer.to))}
                </p>
                <p className="text-ink-muted">
                  {(p.offerStatus as Record<string, string>)[offer.status] ?? offer.status}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8" aria-labelledby="history-heading">
        <h2 id="history-heading" className="type-heading type-h3 text-ink">
          {p.history}
        </h2>
        {page.events.length === 0 ? (
          <p className="staff-empty mt-2">{p.noHistory}</p>
        ) : (
          <ol className="mt-2 space-y-2">
            {page.events.map((event) => {
              const label = statusLabel(p, event);
              return (
                <li key={event.id} className="staff-panel text-sm">
                  <p className="text-ink">
                    {p.eventLine(p.subjects[event.subject], label.from, label.to)}
                  </p>
                  <p className="tabular text-xs text-ink-muted">
                    {when(event.at)} · {p.by(event.actorName, p.roles[event.actorRole])}
                    {event.note ? ` · ${event.note}` : ""}
                  </p>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}

export default function BerthPageContent({ code }: { code: string }) {
  const { s } = useStaffText();
  return (
    <SupabaseOnly title={s.berthPage.title(code)}>
      <PageBody code={code} />
    </SupabaseOnly>
  );
}
