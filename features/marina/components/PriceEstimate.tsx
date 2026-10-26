"use client";

import { useMemo, type ReactNode } from "react";
import {
  calculateQuote,
  classifyBoatLength,
  CLASS_LENGTH_RANGES,
  isBusyPeriod,
  MARINA_CLASS_ORDER,
  getFuelUpdated,
  type Marina,
} from "@/data/marinas";
import { addOnText, fuelText } from "@/features/marina/lib/addOnText";
import { effectiveDeparture, isPlanReady, type StayPlan } from "@/features/marina/lib/stayPlan";
import { toDisplay } from "@/lib/units";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useFormat } from "@/components/providers/useFormat";
import Disclosure, { Collapse } from "@/components/ui/Disclosure";
import LastUpdated from "@/components/ui/LastUpdated";
import { useUnits } from "@/components/providers/UnitsProvider";

const inputClass = "field max-w-[160px]";
const labelClass = "field-label";

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
  const { money, moneyPrecise } = useFormat();
  const { units, label: unit } = useUnits();
  const copy = t.stay.estimate;

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

  const ready = isPlanReady(plan);
  const cheapestNightly = Math.min(...MARINA_CLASS_ORDER.map((c) => marina.transientRates[c].low));
  const fees = marina.serviceFees;
  const busy = quote ? isBusyPeriod(marina, plan.arrival, effectiveDeparture(plan)) : false;

  // One modular row per extra: a real checkbox, its price hint, and the fee
  // folds into the breakdown below as soon as it is ticked.
  const extraRow = (
    key: "shorePower" | "water" | "pumpOut" | "fuel" | "laundry",
    label: string,
    hint: ReactNode,
    more?: ReactNode
  ) => (
    <div className="hairline-top pt-3">
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={plan[key]}
          onChange={(e) => onPlanChange({ [key]: e.target.checked })}
          className="mt-1"
        />
        <span>
          <span className="font-medium text-ink">{label}</span>
          <span className="block text-xs text-ink-muted">{hint}</span>
        </span>
      </label>
      {more}
    </div>
  );

  return (
    <div>
      <h2 className="type-heading type-h2 text-ink">{copy.heading}</h2>

      {!ready ? (
        <p className="measure mt-3 text-ink-soft">{copy.fromLine(money(cheapestNightly))}</p>
      ) : null}

      <Collapse open={ready}>
        <fieldset className="mt-6">
          <legend className={labelClass}>{copy.extras}</legend>
          <p className="mt-1 text-xs text-ink-muted">{copy.extrasHint}</p>
          <div className="mt-3 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {extraRow(
              "shorePower",
              copy.shorePower,
              copy.shorePowerHint(fees.maxAmperage),
              plan.shorePower ? (
                <div className="mt-2 ml-7">
                  <select
                    value={plan.amperage}
                    aria-label={copy.amperageLabel}
                    onChange={(e) => onPlanChange({ amperage: e.target.value })}
                    className={`${inputClass} mt-0`}
                  >
                    <option value="">{copy.amperagePlaceholder}</option>
                    {fees.amperageOptions.map((amps) => (
                      <option key={amps} value={String(amps)}>
                        {amps} A
                      </option>
                    ))}
                  </select>
                  {amperageError && !plan.amperage ? (
                    <p className="field-error">{copy.amperageError}</p>
                  ) : null}
                </div>
              ) : null
            )}
            {extraRow("water", copy.water, copy.waterHint)}
            {extraRow("pumpOut", copy.pumpOut, copy.pumpOutHint(money(fees.pumpOutEur)))}
            {extraRow(
              "fuel",
              copy.fuel,
              <>
                {fuelText(copy, marina, moneyPrecise)}
                <LastUpdated date={getFuelUpdated(marina)} className="mt-0.5 block" />
              </>
            )}
            {extraRow(
              "laundry",
              copy.laundry,
              copy.laundryHint(money(fees.laundryWashEur), money(fees.laundryDryEur))
            )}
          </div>
        </fieldset>

        <div className="mt-8" aria-live="polite">
          {quote ? (
            <>
              <p className="text-sm text-ink-soft">
                {[
                  copy.classBerth(quote.marinaClass),
                  plan.openEnded
                    ? copy.nightlyOpenEnded
                    : t.stay.decision.nightsCount(quote.nights),
                  quote.berthLines.length > 1
                    ? t.stay.season.both
                    : quote.berthLines[0]
                      ? t.stay.season[quote.berthLines[0].season]
                      : "",
                  selectedBerthId ? copy.berthId(selectedBerthId) : "",
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {busy ? (
                <p className="mt-2 max-w-xl border-l-2 border-ink/40 pl-3 text-sm text-ink-soft">
                  {copy.busyPeriod}
                </p>
              ) : null}
              <table className="mt-3 w-full max-w-xl border-collapse text-left text-sm">
                <tbody>
                  {quote.berthLines.map((line) => (
                    <tr key={line.season} className="border-b border-hairline text-ink-soft">
                      <td className="py-2 pr-4">
                        {copy.nightsAtRate(line.nights, money(line.rateEur))}
                        <span className="block text-xs text-ink-muted">
                          {t.stay.season[line.season]}
                        </span>
                      </td>
                      <td className="py-2 text-right font-medium text-ink">
                        {money(line.subtotalEur)}
                      </td>
                    </tr>
                  ))}
                  {quote.berthLines.length > 1 || quote.addOnLines.length > 0 ? (
                    <tr className="border-b border-hairline text-ink-soft">
                      <td className="py-2 pr-4">{copy.berthSubtotal}</td>
                      <td className="py-2 text-right font-medium text-ink">
                        {money(quote.berthSubtotalEur)}
                      </td>
                    </tr>
                  ) : null}
                  {quote.addOnLines.map((line) => {
                    const text = addOnText(copy, line.kind, marina, money, moneyPrecise);
                    return (
                      <tr key={line.kind} className="border-b border-hairline text-ink-soft">
                        <td className="py-2 pr-4">
                          {text.label}
                          <span className="block text-xs text-ink-muted">{text.note}</span>
                        </td>
                        <td className="py-2 text-right font-medium text-ink">
                          {line.amountEur !== null ? money(line.amountEur) : "-"}
                        </td>
                      </tr>
                    );
                  })}
                  <tr>
                    <td className="pt-3 pr-4 font-medium text-ink">
                      {plan.openEnded ? copy.totalFirstNight : copy.total}
                    </td>
                    <td className="pt-3 text-right text-base font-medium text-ink">
                      {money(quote.estimatedTotalEur)}
                    </td>
                  </tr>
                </tbody>
              </table>
              <p className="mt-3 text-xs text-ink-muted">
                {copy.vatNote(Math.round(marina.vatRate * 100))}
              </p>
              <div className="mt-6">
                <a href="#request-berth" className="btn-primary">
                  {copy.requestBerth}
                </a>
                <p className="mt-2 text-sm text-ink-soft">{copy.requestNote}</p>
              </div>
            </>
          ) : (
            <p className="text-sm text-ink-soft">
              {loa > 0 && classifyBoatLength(loa) === null
                ? copy.outsideClasses
                : copy.enterDatesAndLength}
            </p>
          )}
        </div>
      </Collapse>

      <Disclosure label={copy.allRates} openLabel={copy.hideRates} className="mt-8">
        <h3 className="type-heading type-h3 mt-2 text-ink">{t.rates.heading}</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-left text-sm">
            <thead>
              <tr className="type-label border-b border-hairline">
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
                  <tr key={marinaClass} className="border-b border-hairline text-ink-soft">
                    <td className="py-3 pr-4 font-medium text-ink">{marinaClass}</td>
                    <td className="py-3 pr-4">{formatLengthRange(range.minM, range.maxM)}</td>
                    <td className="py-3 pr-4">{money(rate.low)}</td>
                    <td className="py-3">{money(rate.high)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-4 pb-2 text-xs text-ink-muted">
          {t.rates.caption(Math.round(marina.vatRate * 100))}
        </p>
      </Disclosure>
    </div>
  );
}
