"use client";

import { useMemo } from "react";
import {
  calculateQuote,
  classifyBoatLength,
  CLASS_LENGTH_RANGES,
  MARINA_CLASS_ORDER,
  SEASON_LABELS,
  type Marina,
} from "../../../../data/marinas";
import { effectiveDeparture, type StayPlan } from "../../../../lib/stayPlan";
import { toDisplay } from "../../../../lib/units";
import { useLanguage } from "../../../components/LanguageProvider";
import { useUnits } from "../../../components/UnitsProvider";

const inputClass =
  "mt-2 w-full max-w-[160px] border border-hairline px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none";
const labelClass = "text-sm font-medium text-ink/80";
const eur = (n: number) => `€${n.toFixed(2)}`;

type Props = {
  marina: Marina;
  plan: StayPlan;
  onPlanChange: (patch: Partial<StayPlan>) => void;
  selectedBerthId: string | null;
  amperageError?: boolean;
};

export default function PriceEstimate({
  marina,
  plan,
  onPlanChange,
  selectedBerthId,
  amperageError,
}: Props) {
  const { t } = useLanguage();
  const { units, label: unit } = useUnits();

  const loa = Number(plan.loa);
  const quote = useMemo(() => {
    if (!plan.arrival || !(loa > 0)) return null;
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
  }, [marina, loa, plan]);

  function formatLengthRange(minM: number, maxM: number) {
    return minM === 0
      ? t.rates.upTo(toDisplay(maxM, units)).replace(/ m$/, ` ${unit}`)
      : `${toDisplay(minM, units)}–${toDisplay(maxM, units)} ${unit}`;
  }

  const check = (
    label: string,
    key: "water" | "pumpOut" | "fuel" | "laundry"
  ) => (
    <label className="flex items-center gap-2 text-sm text-ink/75">
      <input
        type="checkbox"
        checked={plan[key]}
        onChange={(e) => onPlanChange({ [key]: e.target.checked })}
      />
      {label}
    </label>
  );

  return (
    <div className="mx-auto max-w-5xl">
      <h2 className="type-heading type-h2 text-ink">
        Price estimate &amp; extras
      </h2>

      <fieldset className="mt-6">
        <legend className={labelClass}>Extras</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="flex items-center gap-2 text-sm text-ink/75">
              <input
                type="checkbox"
                checked={plan.shorePower}
                onChange={(e) => onPlanChange({ shorePower: e.target.checked })}
              />
              Shore power
            </label>
            {plan.shorePower ? (
              <div className="mt-2 ml-6">
                <select
                  value={plan.amperage}
                  aria-label="Shore power amperage"
                  onChange={(e) => onPlanChange({ amperage: e.target.value })}
                  className={`${inputClass} mt-0`}
                >
                  <option value="">Amperage…</option>
                  {marina.serviceFees.amperageOptions.map((amps) => (
                    <option key={amps} value={String(amps)}>
                      {amps}A
                    </option>
                  ))}
                </select>
                {amperageError && !plan.amperage ? (
                  <p className="mt-1 text-xs text-red-600">
                    Choose an amperage
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
          {check("Water", "water")}
          {check("Pump-out", "pumpOut")}
          {check("Fuel on arrival", "fuel")}
          {check("Laundry", "laundry")}
        </div>
        <p className="mt-3 text-xs text-ink/70">
          Power and water are metered and charged separately from the berth
          fee.
        </p>
      </fieldset>

      <div className="mt-8" aria-live="polite">
        {quote ? (
          <>
            <p className="text-sm text-ink/75">
              Class {quote.marinaClass} berth ·{" "}
              {plan.openEnded
                ? "nightly rate (open-ended stay)"
                : `${quote.nights} night${quote.nights === 1 ? "" : "s"}`}
              {selectedBerthId ? ` · Berth ${selectedBerthId}` : ""}
            </p>
            <table className="mt-3 w-full max-w-xl border-collapse text-left text-sm">
              <tbody>
                {quote.berthLines.map((line) => (
                  <tr
                    key={line.season}
                    className="border-b border-hairline text-ink/75"
                  >
                    <td className="py-2 pr-4 ">
                      {line.nights} × {eur(line.rateEur)}
                      <span className="block text-xs text-ink/70">
                        {SEASON_LABELS[line.season]}
                      </span>
                    </td>
                    <td className="py-2 text-right font-medium text-ink">
                      {eur(line.subtotalEur)}
                    </td>
                  </tr>
                ))}
                {quote.addOnLines.map((line) => (
                  <tr
                    key={line.label}
                    className="border-b border-hairline text-ink/75"
                  >
                    <td className="py-2 pr-4 ">
                      {line.label}
                      {line.note ? (
                        <span className="block text-xs text-ink/70">
                          {line.note}
                        </span>
                      ) : null}
                    </td>
                    <td className="py-2 text-right font-medium text-ink">
                      {line.amountEur !== null ? eur(line.amountEur) : "-"}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="pt-3 pr-4 font-medium text-ink">
                    {plan.openEnded ? "Estimated first night" : "Estimated total"}
                  </td>
                  <td className="pt-3 text-right text-base font-medium text-ink">
                    {eur(quote.estimatedTotalEur)}
                  </td>
                </tr>
              </tbody>
            </table>
            <p className="mt-3 text-xs text-ink/70">
              Excl. {Math.round(marina.vatRate * 100)}% VAT and utilities (estimate, confirm with the marina).
            </p>
          </>
        ) : (
          <p className="text-sm text-ink/75">
            {loa > 0 && classifyBoatLength(loa) === null
              ? "Your length is outside the standard berth classes, so contact the marina for a quote."
              : "Enter your dates and boat length above to see a price estimate."}
          </p>
        )}
      </div>

      <h3 className="mt-12 text-lg font-medium tracking-tight text-ink">
        {t.rates.heading}
      </h3>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-hairline text-sm font-medium text-ink/80">
              <th className="py-3 pr-4">{t.rates.colClass}</th>
              <th className="py-3 pr-4">{t.rates.colLength}</th>
              <th className="py-3 pr-4">{t.rates.colLow}</th>
              <th className="py-3">{t.rates.colHigh}</th>
            </tr>
          </thead>
          <tbody>
            {MARINA_CLASS_ORDER.map((marinaClass) => {
              const range = CLASS_LENGTH_RANGES[marinaClass];
              const rate = marina.transientRates[marinaClass];
              return (
                <tr
                  key={marinaClass}
                  className="border-b border-hairline text-ink/75"
                >
                  <td className="py-3 pr-4 font-medium text-ink">
                    {marinaClass}
                  </td>
                  <td className="py-3 pr-4 ">
                    {formatLengthRange(range.minM, range.maxM)}
                  </td>
                  <td className="py-3 pr-4 ">€{rate.low.toFixed(2)}</td>
                  <td className="py-3 ">€{rate.high.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-ink/70">
        {t.rates.caption(Math.round(marina.vatRate * 100))}
      </p>
    </div>
  );
}
