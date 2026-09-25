"use client";

import { useMemo, type ReactNode } from "react";
import {
  calculateQuote,
  checkBoatFit,
  type Marina,
} from "../../../../data/marinas";
import { siteConfig } from "../../../../data/site";
import { getSimulatedAvailability } from "../../../../lib/simulatedAvailability";
import {
  effectiveDeparture,
  isPlanReady,
  type StayPlan,
} from "../../../../lib/stayPlan";
import { formatLength } from "../../../../lib/units";
import { Collapse } from "../../../components/Disclosure";
import { useUnits } from "../../../components/UnitsProvider";

type Tone = "yes" | "no" | "wait";

type Row = {
  label: string;
  tone: Tone;
  headline: string;
  detail: ReactNode;
};

const eur = (n: number) => `€${n.toFixed(2)}`;

function StatusIcon({ tone }: { tone: Tone }) {
  const path =
    tone === "yes"
      ? "M4 10.5l4 4 8-9"
      : tone === "no"
        ? "M5 5l10 10M15 5L5 15"
        : "M5 10h10";
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
export default function StayDecisionSummary({
  marina,
  plan,
  stayLine,
  datesValid,
}: Props) {
  const { units } = useUnits();
  const loa = Number(plan.loa);
  const beam = Number(plan.beam);
  const draft = Number(plan.draft);
  const haveLoa = loa > 0;
  const haveAllDims = haveLoa && beam > 0 && draft > 0;

  const fit = haveAllDims ? checkBoatFit(marina, { loa, beam, draft }) : null;
  const availability = useMemo(
    () => (haveLoa ? getSimulatedAvailability(loa) : null),
    [haveLoa, loa]
  );
  const quote = useMemo(() => {
    if (!haveLoa || !datesValid) return null;
    return calculateQuote(
      marina,
      { loa, arrival: plan.arrival, departure: effectiveDeparture(plan) },
      {
        shorePower: plan.shorePower,
        water: plan.water,
        pumpOut: plan.pumpOut,
        fuel: plan.fuel,
        laundry: plan.laundry,
      }
    );
  }, [marina, haveLoa, datesValid, loa, plan]);

  const doesNotFit = fit !== null && !fit.fits;

  // ---- Does my boat fit? ----
  let fitRow: Row;
  if (fit === null) {
    fitRow = {
      label: "Does my boat fit?",
      tone: "wait",
      headline: "Not checked yet",
      detail: "Enter length, beam and draft.",
    };
  } else if (fit.fits) {
    fitRow = {
      label: "Does my boat fit?",
      tone: "yes",
      headline: "Yes, it fits",
      detail: `Class ${fit.marinaClass} berth for ${formatLength(loa, units)}. Beam and draft are within the marina's limits.${
        fit.marinaClass === "IX"
          ? " This is the mega-yacht allocation on the outer pontoon."
          : ""
      }`,
    };
  } else {
    const reason =
      fit.reason === "length"
        ? "Longer than the standard berths, so contact the marina."
        : fit.reason === "beam"
          ? `Your beam of ${formatLength(beam, units)} is wider than the standard berth for your length, so contact the marina.`
          : `Your draft of ${formatLength(draft, units, 1)} is deeper than the marina's ${formatLength(marina.berths.maxDraftM, units, 1)} maximum, so contact the marina.`;
    fitRow = {
      label: "Does my boat fit?",
      tone: "no",
      headline: "No, not on standard berths",
      detail: reason,
    };
  }

  // ---- Is there space? ----
  let spaceRow: Row;
  if (doesNotFit) {
    spaceRow = {
      label: "Is there space?",
      tone: "wait",
      headline: "Not checked",
      detail: "Standard berths do not suit your boat.",
    };
  } else if (!haveLoa || !datesValid) {
    spaceRow = {
      label: "Is there space?",
      tone: "wait",
      headline: "Not checked yet",
      detail: "Enter your dates and length overall.",
    };
  } else if (!availability || !availability.marinaClass) {
    spaceRow = {
      label: "Is there space?",
      tone: "wait",
      headline: "Ask the marina",
      detail: "Your length is outside the standard berth classes.",
    };
  } else if (availability.total === 0) {
    spaceRow = {
      label: "Is there space?",
      tone: "wait",
      headline: "Ask the marina",
      detail: `The illustrative plan does not show Class ${availability.marinaClass} berths yet. The marina confirms availability by email.`,
    };
  } else if (availability.available > 0) {
    spaceRow = {
      label: "Is there space?",
      tone: "yes",
      headline: "Yes, berths show as available",
      detail: siteConfig.decision.availabilityNote,
    };
  } else {
    spaceRow = {
      label: "Is there space?",
      tone: "no",
      headline: "None shown for your size",
      detail: siteConfig.decision.availabilityNote,
    };
  }

  // ---- What will it cost? ----
  let costRow: Row;
  if (doesNotFit) {
    costRow = {
      label: "What will it cost?",
      tone: "wait",
      headline: "Ask the marina",
      detail: "Contact the marina for a quote.",
    };
  } else if (quote) {
    costRow = {
      label: "What will it cost?",
      tone: "yes",
      headline: plan.openEnded
        ? `About ${eur(quote.estimatedTotalEur)} for the first night`
        : `About ${eur(quote.estimatedTotalEur)}`,
      detail: (
        <>
          {plan.openEnded
            ? "Nightly rate"
            : `${quote.nights} night${quote.nights === 1 ? "" : "s"}`}
          , Class {quote.marinaClass}, excluding{" "}
          {Math.round(marina.vatRate * 100)}% VAT and utilities.{" "}
          <a
            href="#price-estimate"
            className="inline-flex min-h-11 items-center text-ink underline underline-offset-4"
          >
            See the breakdown
          </a>
        </>
      ),
    };
  } else if (haveLoa && !availability?.marinaClass) {
    costRow = {
      label: "What will it cost?",
      tone: "wait",
      headline: "Ask the marina",
      detail: "Your length is outside the standard classes, so contact the marina for a quote.",
    };
  } else {
    costRow = {
      label: "What will it cost?",
      tone: "wait",
      headline: "Not estimated yet",
      detail: "Enter your dates and length overall.",
    };
  }

  const rows = [fitRow, spaceRow, costRow];

  const ready = isPlanReady(plan);
  const missing =
    !plan.arrival || !(plan.openEnded || plan.departure)
      ? haveLoa
        ? "your dates"
        : "your dates and length overall"
      : "your length overall";

  return (
    <div className="mt-6 border-t border-hairline pt-6" aria-live="polite">
      {!ready ? (
        <p className="text-sm text-ink/75">
          Add {missing} to see fit, space and price.
        </p>
      ) : null}
      <Collapse open={ready}>
        <p className="text-sm text-ink/75">
          <span className="field-label">Stay: </span>
          {stayLine}
        </p>
        <ul className="mt-4 grid gap-x-8 gap-y-5 md:grid-cols-3">
          {rows.map((row) => (
            <li key={row.label} className="flex gap-3 md:min-h-[7.5rem]">
              <StatusIcon tone={row.tone} />
              <div className="min-w-0">
                <p className="field-label">{row.label}</p>
                <p className="mt-1 font-medium text-ink">{row.headline}</p>
                <p className="mt-1 text-sm text-ink/75">{row.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </Collapse>
    </div>
  );
}
