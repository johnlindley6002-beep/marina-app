"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Marina } from "../../../../../data/marinas";
import {
  clearPreArrivalDraft,
  getPreArrivalDraft,
  savePreArrivalDraft,
  submitPreArrivalCheckIn,
  type PreArrivalCheckIn,
} from "../../../../../lib/mockData";
import {
  draftSchema,
  emptyDraft,
  flattenIssues,
  type FieldErrors,
  type PreArrivalDraft,
} from "../../../../../lib/prearrival/schema";
import { getMissingRequiredDocuments } from "../../../../../lib/prearrival/documentRules";
import { getExtraErrors, getWarnings } from "../../../../../lib/prearrival/warnings";
import { calculateIndicativeQuote } from "../../../../../lib/prearrival/pricing";
import { useLanguage } from "../../../../components/LanguageProvider";
import Confirmation from "./Confirmation";
import StepBoat from "./StepBoat";
import StepCrew from "./StepCrew";
import StepDocuments from "./StepDocuments";
import StepReview from "./StepReview";
import StepStay from "./StepStay";
import StepVoyage from "./StepVoyage";

const TOTAL_STEPS = 6;

export type StepProps = {
  marina: Marina;
  draft: PreArrivalDraft;
  setDraft: (updater: (d: PreArrivalDraft) => PreArrivalDraft) => void;
  errors: FieldErrors;
};

export default function PreArrivalWizard({ marina }: { marina: Marina }) {
  const { t } = useLanguage();
  const copy = t.preArrival;

  const [draft, setDraftState] = useState<PreArrivalDraft>(() => emptyDraft());
  const [step, setStep] = useState(1);
  const [hydrated, setHydrated] = useState(false);
  const [resumed, setResumed] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitted, setSubmitted] = useState<PreArrivalCheckIn | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    const saved = getPreArrivalDraft(marina.id);
    if (saved) {
      setDraftState(saved);
      setResumed(true);
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marina.id]);

  // Autosave shortly after each change, so nothing typed is lost.
  useEffect(() => {
    if (!hydrated || submitted) return;
    const timer = setTimeout(() => savePreArrivalDraft(marina.id, draft), 300);
    return () => clearTimeout(timer);
  }, [hydrated, submitted, marina.id, draft]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  function setDraft(updater: (d: PreArrivalDraft) => PreArrivalDraft) {
    setDraftState(updater);
  }

  function startOver() {
    clearPreArrivalDraft(marina.id);
    setDraftState(emptyDraft());
    setStep(1);
    setErrors({});
    setResumed(false);
  }

  function goTo(next: number) {
    setErrors({});
    setStep(Math.min(Math.max(next, 1), TOTAL_STEPS));
  }

  // Jumps to a step without clearing errors, unlike goTo: onSubmit sets the
  // errors the boater needs to see on that step right before calling this,
  // and goTo's own reset would otherwise wipe them in the same render.
  function jumpTo(next: number) {
    setStep(Math.min(Math.max(next, 1), TOTAL_STEPS));
  }

  function onSubmit() {
    const structural = draftSchema.safeParse(draft);
    const missingDocs = getMissingRequiredDocuments(draft);
    const extra = getExtraErrors(draft);

    if (!structural.success || missingDocs.length > 0 || extra.length > 0) {
      const fieldErrors = structural.success ? {} : flattenIssues(structural.error);
      for (const e of extra) if (e.path) fieldErrors[e.path] = e.message;
      setErrors(fieldErrors);
      // Send the boater back to the earliest step with a problem.
      if (!structural.success) {
        const firstPath = structural.error.issues[0]?.path[0];
        if (firstPath === "owner" || firstPath === "boatIdentity" || firstPath === "boatSpecs") jumpTo(1);
        else if (firstPath === "voyage") jumpTo(2);
        else if (firstPath === "people") jumpTo(3);
        else if (firstPath === "stay") jumpTo(5);
        else jumpTo(6);
      } else if (missingDocs.length > 0) {
        jumpTo(4);
      } else {
        jumpTo(6);
      }
      return;
    }

    const checkIn = submitPreArrivalCheckIn(marina.id, draft);
    setSubmitted(checkIn);
  }

  const warnings = getWarnings(draft);
  const quote = calculateIndicativeQuote(marina, {
    lengthM: Number(draft.boatSpecs.lengthOverall) || 0,
    beamM: Number(draft.boatSpecs.beam) || 0,
    isMultihull: draft.boatSpecs.isMultihull,
    arrival: draft.stay.requestedArrival,
    departure: draft.stay.requestedDeparture,
  });

  if (submitted) {
    return <Confirmation marina={marina} checkIn={submitted} />;
  }

  const stepLabels = [
    copy.steps.boat,
    copy.steps.voyage,
    copy.steps.crew,
    copy.steps.documents,
    copy.steps.stay,
    copy.steps.review,
  ];

  const stepProps: StepProps = { marina, draft, setDraft, errors };

  return (
    <div className="section-tight pb-20 lg:pb-0">
      <div className="page-column">
        <Link
          href={`/marinas/${marina.countrySlug}/${marina.id}`}
          className="text-sm text-ink/70 underline underline-offset-4"
        >
          {marina.name}
        </Link>
        <h1 className="type-title mt-4 text-ink">{copy.page.title}</h1>
        <p className="measure mt-3 text-ink/75">{copy.page.subtitle}</p>

        {resumed ? (
          <p role="status" className="mt-4 text-sm text-ink/75">
            {copy.page.resumeBanner}{" "}
            <button type="button" onClick={startOver} className="link text-ink">
              {copy.page.startOver}
            </button>
          </p>
        ) : null}

        {/* Progress */}
        <div className="mt-8 flex items-center gap-2" aria-hidden="true">
          {stepLabels.map((_, i) => (
            <span
              key={i}
              className={`h-px flex-1 ${i < step ? "bg-ink" : "bg-ink/20"}`}
            />
          ))}
        </div>
        <p className="mt-3 text-sm text-ink/70" aria-live="polite">
          {copy.page.stepOf(step, TOTAL_STEPS)}: {stepLabels[step - 1]}
        </p>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_20rem]">
          <div key={step} className="step-forward min-w-0">
            <h2 ref={headingRef} tabIndex={-1} className="type-heading type-h2 text-ink outline-none">
              {stepLabels[step - 1]}
            </h2>

            {step === 1 ? <StepBoat {...stepProps} /> : null}
            {step === 2 ? <StepVoyage {...stepProps} /> : null}
            {step === 3 ? <StepCrew {...stepProps} /> : null}
            {step === 4 ? <StepDocuments {...stepProps} /> : null}
            {step === 5 ? <StepStay {...stepProps} quote={quote} /> : null}
            {step === 6 ? (
              <StepReview
                {...stepProps}
                quote={quote}
                warnings={warnings}
                onEdit={goTo}
                onSubmit={onSubmit}
              />
            ) : null}

            <div className="mt-10 flex flex-wrap items-center gap-4">
              {step > 1 ? (
                <button type="button" onClick={() => goTo(step - 1)} className="btn-quiet">
                  {copy.page.back}
                </button>
              ) : null}
              {step < TOTAL_STEPS ? (
                <button type="button" onClick={() => goTo(step + 1)} className="btn-primary">
                  {copy.page.continueBtn}
                </button>
              ) : null}
            </div>
            <p className="mt-4 text-xs text-ink/65">{copy.page.autosaveNote}</p>
          </div>

          {/* Sticky summary on desktop; the same numbers appear inside Step 5
              and Step 6 for a phone, so nothing is lost by not showing this
              column there. */}
          <aside className="hidden lg:block">
            <div className="surface-lift sticky top-24 p-6">
              <p className="type-label">{marina.name}</p>
              <p className="mt-1 text-lg font-medium text-ink">
                {draft.boatIdentity.name || t.preArrival.boat.orNewBoat}
              </p>
              {quote ? (
                <>
                  <p className="tabular mt-3 text-sm text-ink/75">
                    {copy.boat.classLabel(quote.marinaClass)} · {copy.page.nightsCount(quote.nights)}
                  </p>
                  <p className="tabular mt-1 text-2xl font-medium text-ink">
                    €{quote.totalIncVatEur.toFixed(2)}
                  </p>
                  <p className="mt-1 text-xs text-ink/65">{copy.stay.indicativeNote}</p>
                </>
              ) : (
                <p className="mt-3 text-sm text-ink/70">{copy.stay.askMarina}</p>
              )}
              <div className="mt-4 border-t border-hairline pt-4 text-sm text-ink/75">
                <p className="tabular">{copy.page.peopleOnBoard(draft.people.length)}</p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* The same summary, condensed, as a bottom sheet on a phone: the
          brief's sticky card is the aside above; this is its mobile form. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-paper px-5 py-3 lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 truncate text-sm text-ink/75">
            {copy.page.stepOf(step, TOTAL_STEPS)}
          </p>
          <p className="tabular text-right text-sm font-medium text-ink">
            {quote ? `€${quote.totalIncVatEur.toFixed(2)}` : copy.stay.askMarina}
          </p>
        </div>
      </div>
    </div>
  );
}
