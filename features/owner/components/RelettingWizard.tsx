"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { marinas } from "@/data/marinas";
import { formatLongDate, todayIso, countNights } from "@/lib/dates";
import {
  clearRelettingDraft,
  estimateReletting,
  getOwnedBerths,
  getRelettingDraft,
  saveRelettingDraft,
  submitRelettingRequest,
  updateRelettingRequest,
  type RelettingDraft,
  type RelettingRequest,
} from "@/lib/data";
import { useAuth } from "@/components/providers/AuthProvider";
import RoleGate from "@/components/layout/RoleGate";
import ProgressSteps from "@/components/ui/ProgressSteps";
import { copy } from "./relet-steps/shared";
import type { ReletScope } from "./relet-steps/ReletScope";
import StepAbsence from "./relet-steps/StepAbsence";
import StepAuthorize from "./relet-steps/StepAuthorize";
import StepTerms from "./relet-steps/StepTerms";
import StepReadiness from "./relet-steps/StepReadiness";
import StepSend from "./relet-steps/StepSend";

const TOTAL = copy.steps.length;
const errorClass = "field-error";
const primaryClass = "btn-primary";
const quietClass = "btn-quiet";

function Wizard() {
  const { user } = useAuth();
  // One held berth today. With several, a picker would go here.
  const berth = useMemo(() => getOwnedBerths(user?.id ?? null)[0], [user?.id]);
  const marina = marinas.find((m) => m.id === berth?.marinaId);
  const terms = marina?.reletting ?? null;
  const mediated = terms?.reletAllowed === "marina_mediated";

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [boatRemoval, setBoatRemoval] = useState(false);
  const [consent, setConsent] = useState(false);
  const [outsideArrangementConfirmed, setOutsideArrangementConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [boatReady, setBoatReady] = useState(false);
  const [berthReady, setBerthReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<RelettingRequest | null>(null);
  const [mode, setMode] = useState<RelettingDraft["mode"]>("new");
  const [requestId, setRequestId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [resumed, setResumed] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step, submitted]);

  // Resume a saved offer, or an edit or resubmit started from My berth.
  const userId = user?.id ?? null;
  useEffect(() => {
    const draft = getRelettingDraft(userId);
    if (draft) {
      setMode(draft.mode);
      setRequestId(draft.requestId);
      setStep(Math.min(Math.max(draft.step, 1), TOTAL));
      setStartDate(draft.startDate);
      setEndDate(draft.endDate);
      setBoatRemoval(draft.boatRemoval);
      setConsent(draft.consent);
      setOutsideArrangementConfirmed(draft.outsideArrangementConfirmed);
      setTermsAccepted(draft.termsAccepted);
      setBoatReady(draft.boatReady);
      setBerthReady(draft.berthReady);
      setResumed(draft.mode === "new" && draft.step > 1);
    }
    setHydrated(true);
  }, [userId]);

  // Save progress to the mock layer as the holder goes, so it can be resumed.
  useEffect(() => {
    if (!hydrated || submitted) return;
    const untouched =
      mode === "new" &&
      step === 1 &&
      !startDate &&
      !endDate &&
      !boatRemoval &&
      !consent &&
      !outsideArrangementConfirmed &&
      !termsAccepted &&
      !boatReady &&
      !berthReady;
    if (untouched) return;
    const timer = setTimeout(() => {
      saveRelettingDraft(userId, {
        mode,
        requestId,
        step,
        startDate,
        endDate,
        boatRemoval,
        consent,
        outsideArrangementConfirmed,
        termsAccepted,
        boatReady,
        berthReady,
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [
    hydrated,
    submitted,
    userId,
    mode,
    requestId,
    step,
    startDate,
    endDate,
    boatRemoval,
    consent,
    outsideArrangementConfirmed,
    termsAccepted,
    boatReady,
    berthReady,
  ]);

  if (!berth || !marina || !terms || terms.reletAllowed === "none") {
    return <p className="measure text-ink-soft">Reletting is not available for this berth.</p>;
  }

  if (!mediated) {
    return (
      <div>
        <p className="measure text-ink-soft">
          This marina does not mediate a paid relet of your berth. You may lend it for free with
          written notice to the marina.
        </p>
      </div>
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
    if (step === 2 && !outsideArrangementConfirmed) {
      return "Confirm you will not arrange any paid use of your berth outside the marina.";
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

  function startOver() {
    clearRelettingDraft(userId);
    setMode("new");
    setRequestId(null);
    setStep(1);
    setDirection("back");
    setStartDate("");
    setEndDate("");
    setBoatRemoval(false);
    setConsent(false);
    setOutsideArrangementConfirmed(false);
    setTermsAccepted(false);
    setBoatReady(false);
    setBerthReady(false);
    setResumed(false);
    setError(null);
  }

  function onSubmit() {
    if (!berth) return;
    const result =
      mode === "edit" && requestId
        ? updateRelettingRequest(userId, requestId, { startDate, endDate })
        : submitRelettingRequest(userId, {
            berthId: berth.berthId,
            startDate,
            endDate,
            boatRemovalConfirmed: boatRemoval,
            reletConsent: consent,
            outsideArrangementConfirmed,
            termsAccepted,
            readinessConfirmed: boatReady && berthReady,
            resubmitOf: mode === "resubmit" && requestId ? requestId : undefined,
          });
    if (result.ok) {
      setError(null);
      clearRelettingDraft(userId);
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
        <h2 ref={headingRef} tabIndex={-1} className="type-heading type-h2 text-ink outline-none">
          {copy.pendingTitle}
        </h2>
        <p role="status" className="measure mt-4 text-lg text-ink-soft">
          {copy.pendingBody}
        </p>
        <p className="tabular mt-6 text-ink-soft">
          Berth {berth.berthId}, {formatLongDate(submitted.startDate)} to{" "}
          {formatLongDate(submitted.endDate)} ({nights} nights)
        </p>
        <Link href="/owner" className={`${primaryClass} mt-8`}>
          Back to My berth
        </Link>
      </div>
    );
  }

  const scope: ReletScope = {
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    nights,
    today,
    boatRemoval,
    setBoatRemoval,
    consent,
    setConsent,
    outsideArrangementConfirmed,
    setOutsideArrangementConfirmed,
    termsAccepted,
    setTermsAccepted,
    boatReady,
    setBoatReady,
    berthReady,
    setBerthReady,
    error,
    headingRef,
    terms,
    estimate,
    berth,
    marina,
  };

  return (
    <div>
      {mode !== "new" ? (
        <p className="measure mb-6 text-ink-soft">
          {mode === "edit" ? copy.editTitle : copy.resubmitTitle}. The marina
          {mode === "edit" ? " will need to consent to the new dates." : " will look at it again."}
        </p>
      ) : null}
      {resumed ? (
        <p role="status" className="mb-6 text-sm text-ink-soft">
          {copy.resumeBanner}{" "}
          <button type="button" onClick={startOver} className="link text-ink">
            Start over
          </button>
        </p>
      ) : null}
      <ProgressSteps
        total={TOTAL}
        current={step}
        label={`Step ${step} of ${TOTAL}: ${copy.steps[step - 1]}`}
      />

      <div key={step} className={`${stepClass} mt-10`}>
        {step === 1 ? <StepAbsence scope={scope} /> : null}
        {step === 2 ? <StepAuthorize scope={scope} /> : null}
        {step === 3 ? <StepTerms scope={scope} /> : null}
        {step === 4 ? <StepReadiness scope={scope} /> : null}
        {step === 5 ? <StepSend scope={scope} /> : null}
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
      <div className="section">
        <div className="page-column page-reading">
          <Link
            href="/owner"
            className="inline-flex min-h-11 items-center text-sm text-ink-muted underline underline-offset-4"
          >
            My berth
          </Link>
          <h1 className="type-title mt-6 text-ink">{copy.primaryAction}</h1>
          <div className="stack-md">
            <Wizard />
          </div>
        </div>
      </div>
    </RoleGate>
  );
}
