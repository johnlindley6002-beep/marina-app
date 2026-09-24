"use client";

import {
  getSeason,
  SEASON_LABELS,
  type Marina,
  type Season,
} from "../../../../data/marinas";
import { effectiveDeparture, type StayPlan } from "../../../../lib/stayPlan";
import Link from "next/link";
import BoatSwitcher from "../../../components/BoatSwitcher";
import { useBoats } from "../../../components/BoatProvider";
import LengthInput from "../../../components/LengthInput";
import { useUnits } from "../../../components/UnitsProvider";
import StayDecisionSummary from "./StayDecisionSummary";

const inputClass =
  "mt-2 w-full border border-hairline px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none disabled:bg-paper-deep disabled:text-ink/70";
const labelClass = "text-sm font-medium text-ink/80";
const errorClass = "mt-1 text-xs text-error";

function RequiredMark() {
  return <span className="text-error"> *</span>;
}

function parseIso(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
}

type Props = {
  marina: Marina;
  plan: StayPlan;
  onPlanChange: (patch: Partial<StayPlan>) => void;
};

export default function PlanYourStay({ marina, plan, onPlanChange }: Props) {
  const { label: unit } = useUnits();
  const { boats, activeBoat, saveBoat } = useBoats();

  const arrivalDate = parseIso(plan.arrival);
  const departureDate = parseIso(effectiveDeparture(plan));
  const datesInvalid =
    !plan.openEnded &&
    !!arrivalDate &&
    !!departureDate &&
    departureDate <= arrivalDate;
  const datesValid = !!arrivalDate && !!departureDate && !datesInvalid;

  const nightsBySeason: Record<Season, number> = { low: 0, high: 0 };
  if (datesValid && arrivalDate && departureDate) {
    const cursor = new Date(arrivalDate);
    while (cursor < departureDate) {
      nightsBySeason[getSeason(cursor)] += 1;
      cursor.setDate(cursor.getDate() + 1);
    }
  }
  const nights = nightsBySeason.low + nightsBySeason.high;

  const dim = (v: string) => Number(v);
  const dimError = (v: string) =>
    v !== "" && !(dim(v) > 0) ? "Enter a number greater than 0, for example 12.5." : null;
  const dimsComplete =
    dim(plan.loa) > 0 && dim(plan.beam) > 0 && dim(plan.draft) > 0;
  const boatSizesDiffer =
    !!activeBoat &&
    (plan.loa !== "" || plan.beam !== "" || plan.draft !== "") &&
    (Number(plan.loa) !== Number(activeBoat.loa) ||
      Number(plan.beam) !== Number(activeBoat.beam) ||
      Number(plan.draft) !== Number(activeBoat.draft));
  const stayLine = datesValid
    ? plan.openEnded
      ? "Open-ended stay, priced and searched per night."
      : nights > 0 && nightsBySeason.low > 0 && nightsBySeason.high > 0
        ? `${nights} nights, spanning both seasons (${nightsBySeason.low} low, ${nightsBySeason.high} high).`
        : `${nights} night${nights === 1 ? "" : "s"}, ${
            SEASON_LABELS[nightsBySeason.high > 0 ? "high" : "low"]
          }.`
    : "Enter your arrival and departure dates.";

  return (
    <div className="surface-lift p-6 sm:p-8 md:p-10">
      <h2 className="type-heading type-h3 text-ink">
        Plan your stay
      </h2>
      <p className="mt-2 text-sm text-ink/75">
        Enter your dates and boat size once. They drive the berth map, the
        price estimate and your enquiry below.
      </p>

      <BoatSwitcher
        onSelect={(boat) =>
          onPlanChange({ loa: boat.loa, beam: boat.beam, draft: boat.draft })
        }
      />

      {activeBoat ? (
        boatSizesDiffer ? (
          <p className="mt-3 text-sm text-ink/75">
            These sizes differ from {activeBoat.name}&apos;s saved sizes.{" "}
            {dimsComplete ? (
              <button
                type="button"
                onClick={() =>
                  saveBoat({
                    ...activeBoat,
                    loa: plan.loa,
                    beam: plan.beam,
                    draft: plan.draft,
                  })
                }
                className="inline-flex min-h-11 items-center font-medium text-ink underline underline-offset-4"
              >
                Update saved boat
              </button>
            ) : null}
          </p>
        ) : (
          <p className="mt-3 text-sm text-ink/70">
            Using your saved boat, {activeBoat.name}.{" "}
            <Link href="/my-boat" className="underline underline-offset-4">
              Manage in My boat
            </Link>
          </p>
        )
      ) : boats.length === 0 ? (
        <p className="mt-3 text-sm text-ink/70">
          Save your boat in{" "}
          <Link href="/my-boat" className="underline underline-offset-4">
            My boat
          </Link>{" "}
          and these sizes fill in next time.
        </p>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <label className="block text-sm">
          <span className={labelClass}>
            Arrival date
            <RequiredMark />
          </span>
          <input
            type="date"
            value={plan.arrival}
            onChange={(e) => onPlanChange({ arrival: e.target.value })}
            className={inputClass}
          />
        </label>

        <label className="block text-sm">
          <span className={labelClass}>
            Departure date
            {!plan.openEnded ? <RequiredMark /> : null}
          </span>
          <input
            type="date"
            value={plan.departure}
            disabled={plan.openEnded}
            onChange={(e) => onPlanChange({ departure: e.target.value })}
            aria-invalid={datesInvalid}
            aria-describedby={datesInvalid ? "err-plan-departure" : undefined}
            className={inputClass}
          />
          {datesInvalid ? (
            <p id="err-plan-departure" role="alert" className={errorClass}>
              Departure must be after arrival. Choose a later departure date.
            </p>
          ) : null}
        </label>

        <label className="block text-sm">
          <span className={labelClass}>
            Length overall ({unit})
            <RequiredMark />
          </span>
          <LengthInput
            valueM={plan.loa}
            onChangeM={(v) => onPlanChange({ loa: v })}
            invalid={!!dimError(plan.loa)}
            describedBy={dimError(plan.loa) ? "err-plan-loa" : undefined}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-ink/70">
            Including bowsprit, davits, dinghy
          </p>
          {dimError(plan.loa) ? (
            <p id="err-plan-loa" role="alert" className={errorClass}>
              {dimError(plan.loa)}
            </p>
          ) : null}
        </label>

        <label className="block text-sm">
          <span className={labelClass}>
            Beam ({unit})
            <RequiredMark />
          </span>
          <LengthInput
            valueM={plan.beam}
            onChangeM={(v) => onPlanChange({ beam: v })}
            invalid={!!dimError(plan.beam)}
            describedBy={dimError(plan.beam) ? "err-plan-beam" : undefined}
            className={inputClass}
          />
          {dimError(plan.beam) ? (
            <p id="err-plan-beam" role="alert" className={errorClass}>
              {dimError(plan.beam)}
            </p>
          ) : null}
        </label>

        <label className="block text-sm">
          <span className={labelClass}>
            Draft ({unit})
            <RequiredMark />
          </span>
          <LengthInput
            valueM={plan.draft}
            onChangeM={(v) => onPlanChange({ draft: v })}
            invalid={!!dimError(plan.draft)}
            describedBy={dimError(plan.draft) ? "err-plan-draft" : undefined}
            className={inputClass}
          />
          {dimError(plan.draft) ? (
            <p id="err-plan-draft" role="alert" className={errorClass}>
              {dimError(plan.draft)}
            </p>
          ) : null}
        </label>
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm text-ink/75">
        <input
          type="checkbox"
          checked={plan.openEnded}
          onChange={(e) => onPlanChange({ openEnded: e.target.checked })}
        />
        Open-ended stay (no departure date yet)
      </label>

      <StayDecisionSummary
        marina={marina}
        plan={plan}
        datesValid={datesValid}
        stayLine={stayLine}
      />
    </div>
  );
}
