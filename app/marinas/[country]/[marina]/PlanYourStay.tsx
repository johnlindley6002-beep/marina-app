"use client";

import {
  checkBoatFit,
  getSeason,
  SEASON_LABELS,
  type Marina,
  type Season,
} from "../../../../data/marinas";
import { effectiveDeparture, type StayPlan } from "../../../../lib/stayPlan";
import BoatSwitcher from "../../../components/BoatSwitcher";
import LengthInput from "../../../components/LengthInput";
import { useUnits } from "../../../components/UnitsProvider";

const inputClass =
  "mt-2 w-full border border-neutral-200 px-3 py-2 text-sm text-navy focus:border-navy/40 focus:outline-none disabled:bg-neutral-50 disabled:text-neutral-500";
const labelClass = "text-xs font-normal tracking-wide text-navy/60 uppercase";
const errorClass = "mt-1 text-xs font-light text-red-600";

function RequiredMark() {
  return <span className="text-red-600"> *</span>;
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
    v !== "" && !(dim(v) > 0) ? "Enter a positive number" : null;
  const dimsComplete =
    dim(plan.loa) > 0 && dim(plan.beam) > 0 && dim(plan.draft) > 0;
  const fit = dimsComplete
    ? checkBoatFit(marina, {
        loa: dim(plan.loa),
        beam: dim(plan.beam),
        draft: dim(plan.draft),
      })
    : null;

  return (
    <div className="rounded-sm border border-neutral-200/80 bg-white p-8 md:p-10">
      <h2 className="text-lg font-normal tracking-tight text-navy">
        Plan your stay
      </h2>
      <p className="mt-2 text-sm font-light text-neutral-600">
        Enter your dates and boat size once. They drive the berth map, the
        price estimate and your enquiry below.
      </p>

      <BoatSwitcher
        onSelect={(boat) =>
          onPlanChange({ loa: boat.loa, beam: boat.beam, draft: boat.draft })
        }
      />

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
            className={inputClass}
          />
          {datesInvalid ? (
            <p className={errorClass}>Departure must be after arrival</p>
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
            className={inputClass}
          />
          <p className="mt-1 text-xs font-light text-neutral-500">
            Including bowsprit, davits, dinghy
          </p>
          {dimError(plan.loa) ? (
            <p className={errorClass}>{dimError(plan.loa)}</p>
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
            className={inputClass}
          />
          {dimError(plan.beam) ? (
            <p className={errorClass}>{dimError(plan.beam)}</p>
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
            className={inputClass}
          />
          {dimError(plan.draft) ? (
            <p className={errorClass}>{dimError(plan.draft)}</p>
          ) : null}
        </label>
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm font-light text-neutral-600">
        <input
          type="checkbox"
          checked={plan.openEnded}
          onChange={(e) => onPlanChange({ openEnded: e.target.checked })}
        />
        Open-ended stay (no departure date yet)
      </label>

      <div
        className="mt-6 space-y-2 border-t border-neutral-200 pt-6"
        aria-live="polite"
      >
        <p className="text-sm font-light text-neutral-600">
          <span className={labelClass}>Stay: </span>
          {datesValid
            ? plan.openEnded
              ? "Open-ended — priced and searched per night."
              : nights > 0 && nightsBySeason.low > 0 && nightsBySeason.high > 0
                ? `${nights} nights — spans both seasons (${nightsBySeason.low} low, ${nightsBySeason.high} high).`
                : `${nights} night${nights === 1 ? "" : "s"} — ${
                    SEASON_LABELS[nightsBySeason.high > 0 ? "high" : "low"]
                  }.`
            : "Enter your arrival and departure dates."}
        </p>
        <p className="text-sm font-light text-neutral-600">
          <span className={labelClass}>Will my boat fit? </span>
          {fit === null ? (
            "Enter length, beam and draft to check."
          ) : fit.fits ? (
            <span className="font-normal text-navy">
              Fits — Class {fit.marinaClass} berths available.
              {fit.marinaClass === "IX"
                ? " This is the mega-yacht allocation on the outer pontoon."
                : ""}
            </span>
          ) : (
            <span className="font-normal text-navy">
              {fit.reason === "length"
                ? "Too long for standard berths — contact the marina."
                : fit.reason === "beam"
                  ? "Beam exceeds the standard berth for your length — contact the marina."
                  : "Too deep for standard berths — contact the marina."}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
