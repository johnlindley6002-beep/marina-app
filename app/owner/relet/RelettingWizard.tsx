"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { marinas } from "../../../data/marinas";
import { siteConfig } from "../../../data/site";
import { eur, formatLongDate } from "../../../lib/formatDate";
import {
  countNights,
  estimateReletting,
  getOwnedBerths,
  submitRelettingRequest,
  type RelettingRequest,
} from "../../../lib/mockData";
import { useAuth } from "../../components/AuthProvider";
import Disclosure from "../../components/Disclosure";
import RoleGate from "../../components/RoleGate";

const copy = siteConfig.relet;
const TOTAL = copy.steps.length;

const inputClass =
  "mt-2 w-full border border-hairline px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none";
const labelClass = "text-sm font-medium text-ink/80";
const errorClass = "mt-2 text-sm text-error";
const primaryClass =
  "inline-flex min-h-12 items-center justify-center rounded-[3px] bg-brass px-8 text-base font-medium text-ink transition-[filter] hover:brightness-105";
const quietClass =
  "inline-flex min-h-11 items-center px-2 text-ink underline decoration-current/50 decoration-1 underline-offset-[6px]";

function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function Check({
  checked,
  onChange,
  children,
  invalid,
  describedBy,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  children: React.ReactNode;
  invalid?: boolean;
  describedBy?: string;
}) {
  return (
    <label className="flex items-start gap-3 text-ink">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        className="mt-1"
      />
      <span>{children}</span>
    </label>
  );
}

function Wizard() {
  const { user } = useAuth();
  // One held berth today. With several, a picker would go here.
  const berth = useMemo(() => getOwnedBerths(user?.id ?? null)[0], [user?.id]);
  const marina = marinas.find((m) => m.id === berth?.marinaId);
  const terms = marina?.reletting ?? null;

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [boatRemoval, setBoatRemoval] = useState(false);
  const [consent, setConsent] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [boatReady, setBoatReady] = useState(false);
  const [berthReady, setBerthReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<RelettingRequest | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step, submitted]);

  if (!berth || !marina || !terms) {
    return (
      <p className="measure text-ink/75">
        Reletting is not available for this berth.
      </p>
    );
  }

  const nights = countNights(startDate, endDate);
  const estimate = estimateReletting(berth.marinaId, berth.berthId, startDate, endDate);
  const today = todayIso();

  function validate(): string | null {
    if (step === 1) {
      if (!startDate) return "Choose the day you leave.";
      if (startDate < today) return "The day you leave cannot be in the past.";
      if (!endDate) return "Choose the day you return.";
      if (nights < 1) return "Choose a return day after the day you leave.";
      if (!boatRemoval) return "Confirm that your boat will be removed for these dates.";
    }
    if (step === 2 && !consent) {
      return "Switch this on to let the marina relet your berth.";
    }
    if (step === 3 && !termsAccepted) {
      return "Accept the reletting terms to continue.";
    }
    if (step === 4 && !(boatReady && berthReady)) {
      return "Tick both items to confirm you are ready.";
    }
    return null;
  }

  function go(next: number) {
    setDirection(next > step ? "forward" : "back");
    setError(null);
    setStep(next);
  }

  function onContinue() {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    go(step + 1);
  }

  function onSubmit() {
    const result = submitRelettingRequest(user?.id ?? null, {
      berthId: berth.berthId,
      startDate,
      endDate,
      boatRemovalConfirmed: boatRemoval,
      reletConsent: consent,
      termsAccepted,
      readinessConfirmed: boatReady && berthReady,
    });
    if (result.ok) {
      setError(null);
      setSubmitted(result.request);
    } else {
      setError(result.error);
    }
  }

  const stepClass = direction === "forward" ? "step-forward" : "step-back";

  // ---- Confirmation ----
  if (submitted) {
    return (
      <div className="step-forward">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="type-heading type-h2 text-ink outline-none"
        >
          {copy.pendingTitle}
        </h2>
        <p role="status" className="measure mt-4 text-lg text-ink/75">
          {copy.pendingBody}
        </p>
        <p className="tabular mt-6 text-ink/75">
          Berth {berth.berthId}, {formatLongDate(submitted.startDate)} to{" "}
          {formatLongDate(submitted.endDate)} ({nights} nights)
        </p>
        <Link href="/owner" className={`${primaryClass} mt-8`}>
          Back to My berth
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Progress: one idea per step */}
      <div className="flex items-center gap-2" aria-hidden="true">
        {copy.steps.map((_, i) => (
          <span
            key={i}
            className={`h-px flex-1 ${i < step ? "bg-ink" : "bg-ink/20"}`}
          />
        ))}
      </div>
      <p className="mt-3 text-sm text-ink/70" aria-live="polite">
        Step {step} of {TOTAL}: {copy.steps[step - 1]}
      </p>

      <div key={step} className={`${stepClass} mt-10`}>
        {step === 1 ? (
          <>
            <h2 ref={headingRef} tabIndex={-1} className="type-heading type-h2 text-ink outline-none">
              {copy.absenceTitle}
            </h2>
            <p className="measure mt-3 text-ink/75">{copy.absenceBody}</p>
            <div className="mt-8 grid max-w-md gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className={labelClass}>I leave on</span>
                <input
                  type="date"
                  value={startDate}
                  min={today}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="block text-sm">
                <span className={labelClass}>I return on</span>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || today}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={inputClass}
                />
              </label>
            </div>
            <p className="mt-3 min-h-6 text-sm text-ink/75" aria-live="polite">
              {nights > 0 ? `${nights} night${nights === 1 ? "" : "s"} away.` : ""}
            </p>
            <div className="mt-4">
              <Check checked={boatRemoval} onChange={setBoatRemoval}>
                {copy.absenceConfirm}
              </Check>
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <h2 ref={headingRef} tabIndex={-1} className="type-heading type-h2 text-ink outline-none">
              {copy.authorizeTitle}
            </h2>
            <div className="mt-6 flex items-start gap-4">
              <button
                type="button"
                role="switch"
                aria-checked={consent}
                aria-labelledby="consent-label"
                onClick={() => setConsent((c) => !c)}
                className="flex h-11 w-14 shrink-0 items-center"
              >
                <span
                  aria-hidden="true"
                  className={`relative block h-8 w-14 rounded-full border transition-colors motion-reduce:transition-none ${
                    consent ? "border-ink bg-ink" : "border-ink/40 bg-paper-deep"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full transition-transform motion-reduce:transition-none ${
                      consent ? "translate-x-6 bg-paper" : "bg-white shadow-sm"
                    }`}
                  />
                </span>
              </button>
              <p id="consent-label" className="text-lg text-ink">
                {copy.authorizeToggle}
              </p>
            </div>
            <p className="measure mt-4 text-ink/75">{copy.authorizeLine}</p>
            <Disclosure
              className="mt-2"
              label={copy.authorizeWhyLabel}
              openLabel={copy.authorizeWhyLabel}
            >
              <p className="measure pb-2 text-ink/75">{copy.authorizeWhy}</p>
            </Disclosure>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <h2 ref={headingRef} tabIndex={-1} className="type-heading type-h2 text-ink outline-none">
              {copy.termsTitle}
            </h2>
            <dl className="mt-8 grid max-w-md gap-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-ink/70">Your share</dt>
                <dd className="tabular mt-1 text-2xl font-medium text-ink">
                  {terms.ownerSharePercent}%
                </dd>
                <dd className="mt-1 text-sm text-ink/70">
                  of the berth income for the nights relet
                </dd>
              </div>
              <div>
                <dt className="text-sm text-ink/70">Marina processing fee</dt>
                <dd className="tabular mt-1 text-2xl font-medium text-ink">
                  {terms.processingFeePercent}%
                </dd>
                <dd className="mt-1 text-sm text-ink/70">taken from your share</dd>
              </div>
            </dl>
            <p className="measure mt-6 text-ink/75">
              {terms.settlement === "credit"
                ? "This is a credit against your berth fees, not a payment to you."
                : "This is paid to you after the marina has processed it."}
            </p>
            {estimate ? (
              <p className="measure tabular mt-3 text-sm text-ink/70">
                If every one of your {estimate.nights} nights were relet, about{" "}
                {eur(estimate.netEur)} would be{" "}
                {terms.settlement === "credit" ? "credited" : "paid"} after the
                fee. An illustration, not a promise.
              </p>
            ) : null}
            {siteConfig.mockMode ? (
              <p className="mt-3 text-sm text-ink/70">{copy.placeholderNote}</p>
            ) : null}
            <Disclosure
              className="mt-2"
              label={copy.taxLabel}
              openLabel={copy.taxLabel}
            >
              <p className="measure pb-2 text-ink/75">{terms.taxNote}</p>
            </Disclosure>
            <div className="mt-6">
              <Check
                checked={termsAccepted}
                onChange={setTermsAccepted}
                invalid={!!error && !termsAccepted}
              >
                {copy.termsAccept}.{" "}
                <Link
                  href={terms.termsHref}
                  target="_blank"
                  className="underline underline-offset-4"
                >
                  Read the full terms
                  <span className="sr-only"> (opens in a new tab)</span>
                </Link>
              </Check>
            </div>
          </>
        ) : null}

        {step === 4 ? (
          <>
            <h2 ref={headingRef} tabIndex={-1} className="type-heading type-h2 text-ink outline-none">
              {copy.readinessTitle}
            </h2>
            <div className="mt-8 space-y-4">
              <Check checked={boatReady} onChange={setBoatReady}>
                {copy.readinessBoat.replace(
                  "the start date",
                  formatLongDate(startDate)
                )}
              </Check>
              <Check checked={berthReady} onChange={setBerthReady}>
                {copy.readinessBerth}
              </Check>
            </div>
            <p className="measure mt-8 text-ink/75">{copy.readinessInsurance}</p>
          </>
        ) : null}

        {step === 5 ? (
          <>
            <h2 ref={headingRef} tabIndex={-1} className="type-heading type-h2 text-ink outline-none">
              {copy.submitTitle}
            </h2>
            <dl className="mt-8 grid max-w-lg gap-x-8 gap-y-4 text-ink sm:grid-cols-[auto_1fr]">
              <dt className="text-ink/70">Berth</dt>
              <dd>
                {berth.berthId}, {berth.marinaName}
              </dd>
              <dt className="text-ink/70">Away</dt>
              <dd>
                {formatLongDate(startDate)} to {formatLongDate(endDate)} ({nights}{" "}
                nights)
              </dd>
              <dt className="text-ink/70">Reletting</dt>
              <dd>The marina may relet it, with its approval</dd>
              <dt className="text-ink/70">Terms</dt>
              <dd>
                {terms.ownerSharePercent}% share, {terms.processingFeePercent}%
                fee, {terms.settlement}
              </dd>
            </dl>
            <p className="measure mt-6 text-sm text-ink/70">
              Sending this asks for the marina&apos;s consent. Nothing is relet
              until the marina approves.
            </p>
          </>
        ) : null}

        {error ? (
          <p role="alert" className={errorClass}>
            {error}
          </p>
        ) : null}

        <div className="mt-10 flex flex-wrap items-center gap-4">
          {step < TOTAL ? (
            <button type="button" onClick={onContinue} className={primaryClass}>
              Continue
            </button>
          ) : (
            <button type="button" onClick={onSubmit} className={primaryClass}>
              {copy.submitAction}
            </button>
          )}
          {step > 1 ? (
            <button type="button" onClick={() => go(step - 1)} className={quietClass}>
              Back
            </button>
          ) : (
            <Link href="/owner" className={quietClass}>
              Cancel
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RelettingWizard() {
  return (
    <RoleGate role="owner">
      <div className="section px-5 md:px-8">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/owner"
            className="inline-flex min-h-11 items-center text-sm text-ink/70 underline underline-offset-4"
          >
            My berth
          </Link>
          <h1 className="type-display mt-6 [font-size:clamp(2rem,1.2rem+3vw,3.2rem)] text-ink">
            {copy.primaryAction}
          </h1>
          <div className="mt-12">
            <Wizard />
          </div>
        </div>
      </div>
    </RoleGate>
  );
}
