"use client";

import { useMemo, type ReactNode } from "react";
import { calculateQuote, checkBoatFit, type Marina } from "@/data/marinas";
import { getSimulatedAvailability } from "@/features/marina/lib/simulatedAvailability";
import { effectiveDeparture, isPlanReady, type StayPlan } from "@/features/marina/lib/stayPlan";
import { formatLength } from "@/lib/units";
import { Collapse } from "@/components/ui/Disclosure";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useFormat } from "@/components/providers/useFormat";
import { useUnits } from "@/components/providers/UnitsProvider";

type Tone = "yes" | "no" | "wait";

type Row = {
  label: string;
  tone: Tone;
  headline: string;
  detail: ReactNode;
};

function StatusIcon({ tone }: { tone: Tone }) {
  const path =
    tone === "yes" ? "M4 10.5l4 4 8-9" : tone === "no" ? "M5 5l10 10M15 5L5 15" : "M5 10h10";
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      className="mt-1 h-4 w-4 shrink-0 text-ink"
      aria-hidden="true"
    >
      <path d={path} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type Props = {
  marina: Marina;
  plan: StayPlan;
  stayLine: string;
  datesValid: boolean;
};

// The three answers a boater wants together: does it fit, is there space,
// and roughly what does it cost. Availability is the simulated pattern and the
// estimate is the same calculation as Your estimate below.
export default function StayDecisionSummary({ marina, plan, stayLine, datesValid }: Props) {
  const { units } = useUnits();
  const { t } = useLanguage();
  const { money } = useFormat();
  const d = t.stay.decision;
  const loa = Number(plan.loa);
  const beam = Number(plan.beam);
  const draft = Number(plan.draft);
  const haveLoa = loa > 0;
  const haveAllDims = haveLoa && beam > 0 && draft > 0;

  const fit = haveAllDims ? checkBoatFit(marina, { loa, beam, draft }) : null;
  const availability = useMemo(
    () => (haveLoa ? getSimulatedAvailability(loa, beam) : null),
    [haveLoa, loa, beam]
  );
  const quote = useMemo(() => {
    if (!haveLoa || !datesValid) return null;
    return calculateQuote(
      marina,
      { loa, beam, arrival: plan.arrival, departure: effectiveDeparture(plan) },
      {
        shorePower: plan.shorePower,
        water: plan.water,
        pumpOut: plan.pumpOut,
        fuel: plan.fuel,
        laundry: plan.laundry,
      }
    );
  }, [marina, haveLoa, datesValid, loa, beam, plan]);

  const doesNotFit = fit !== null && !fit.fits;

  // ---- Does my boat fit? ----
  let fitRow: Row;
  if (fit === null) {
    fitRow = {
      label: d.fitQuestion,
      tone: "wait",
      headline: d.notCheckedYet,
      detail: d.enterDimensions,
    };
  } else if (fit.fits) {
    fitRow = {
      label: d.fitQuestion,
      tone: "yes",
      headline: d.fitYes,
      detail: `${d.fitDetail(fit.marinaClass, formatLength(loa, units))}${
        fit.marinaClass === "IX" ? ` ${d.fitMegaYacht}` : ""
      }`,
    };
  } else {
    const reason =
      fit.reason === "length"
        ? d.reasonLength
        : fit.reason === "beam"
          ? d.reasonBeam(formatLength(beam, units))
          : d.reasonDraft(
              formatLength(draft, units, 1),
              formatLength(marina.berths.maxDraftM, units, 1)
            );
    fitRow = { label: d.fitQuestion, tone: "no", headline: d.fitNo, detail: reason };
  }

  // ---- Is there space? ----
  let spaceRow: Row;
  if (doesNotFit) {
    spaceRow = {
      label: d.spaceQuestion,
      tone: "wait",
      headline: d.notChecked,
      detail: d.spaceNoFit,
    };
  } else if (!haveLoa || !datesValid) {
    spaceRow = {
      label: d.spaceQuestion,
      tone: "wait",
      headline: d.notCheckedYet,
      detail: d.enterDatesAndLength,
    };
  } else if (!availability || !availability.marinaClass) {
    spaceRow = {
      label: d.spaceQuestion,
      tone: "wait",
      headline: d.askMarina,
      detail: d.outsideClasses,
    };
  } else if (availability.total === 0) {
    spaceRow = {
      label: d.spaceQuestion,
      tone: "wait",
      headline: d.askMarina,
      detail: d.noPlan(availability.marinaClass),
    };
  } else if (availability.available > 0) {
    spaceRow = {
      label: d.spaceQuestion,
      tone: "yes",
      headline: d.spaceYes,
      detail: d.availabilityNote,
    };
  } else {
    spaceRow = {
      label: d.spaceQuestion,
      tone: "no",
      headline: d.spaceNone,
      detail: d.availabilityNote,
    };
  }

  // ---- What will it cost? ----
  let costRow: Row;
  if (doesNotFit) {
    costRow = { label: d.costQuestion, tone: "wait", headline: d.askMarina, detail: d.costContact };
  } else if (quote) {
    costRow = {
      label: d.costQuestion,
      tone: "yes",
      headline: plan.openEnded
        ? d.costAboutFirstNight(money(quote.estimatedTotalEur))
        : d.costAbout(money(quote.estimatedTotalEur)),
      detail: (
        <>
          {d.costDetail(
            plan.openEnded ? d.nightlyRate : d.nightsCount(quote.nights),
            quote.marinaClass,
            Math.round(marina.vatRate * 100)
          )}{" "}
          <a
            href="#price-estimate"
            className="inline-flex min-h-11 items-center text-ink underline underline-offset-4"
          >
            {d.seeBreakdown}
          </a>
        </>
      ),
    };
  } else if (haveLoa && !availability?.marinaClass) {
    costRow = {
      label: d.costQuestion,
      tone: "wait",
      headline: d.askMarina,
      detail: d.costOutsideClasses,
    };
  } else {
    costRow = {
      label: d.costQuestion,
      tone: "wait",
      headline: d.notEstimatedYet,
      detail: d.enterDatesAndLength,
    };
  }

  const rows = [fitRow, spaceRow, costRow];

  const ready = isPlanReady(plan);
  const prompt =
    !plan.arrival || !(plan.openEnded || plan.departure)
      ? haveLoa
        ? d.promptDates
        : d.promptDatesAndLength
      : d.promptLength;

  return (
    <div className="mt-6 border-t border-hairline pt-6" aria-live="polite">
      {!ready ? <p className="text-sm text-ink-soft">{prompt}</p> : null}
      <Collapse open={ready}>
        <p className="text-sm text-ink-soft">
          <span className="field-label">{t.stay.plan.stayLabel}</span>
          {stayLine}
        </p>
        <ul className="mt-4 grid gap-x-8 gap-y-5 md:grid-cols-3">
          {rows.map((row) => (
            <li key={row.label} className="flex gap-3 md:min-h-[7.5rem]">
              <StatusIcon tone={row.tone} />
              <div className="min-w-0">
                <p className="field-label">{row.label}</p>
                <p className="mt-1 font-medium text-ink">{row.headline}</p>
                <p className="mt-1 text-sm text-ink-soft">{row.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </Collapse>
    </div>
  );
}
