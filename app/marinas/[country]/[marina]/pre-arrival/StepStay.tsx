"use client";

import type { IndicativeQuote } from "../../../../../lib/prearrival/pricing";
import { useLanguage } from "../../../../components/LanguageProvider";
import type { StepProps } from "./PreArrivalWizard";
import { Field } from "./WizardBits";

type Props = StepProps & { quote: IndicativeQuote | null };

const AMP_OPTIONS = [0, 16, 32, 63] as const;

export default function StepStay({ draft, setDraft, errors, quote }: Props) {
  const { t } = useLanguage();
  const copy = t.preArrival.stay;

  function setServices(patch: Partial<typeof draft.stay.servicesWanted>) {
    setDraft((d) => ({
      ...d,
      stay: { ...d.stay, servicesWanted: { ...d.stay.servicesWanted, ...patch } },
    }));
  }

  return (
    <div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label={copy.arrivalLabel} htmlFor="stay-arrival" required error={errors["stay.requestedArrival"]}>
          <input
            id="stay-arrival"
            type="date"
            value={draft.stay.requestedArrival}
            onChange={(e) => setDraft((d) => ({ ...d, stay: { ...d.stay, requestedArrival: e.target.value } }))}
            className="field"
          />
        </Field>
        <Field label={copy.departureLabel} htmlFor="stay-departure" required error={errors["stay.requestedDeparture"]}>
          <input
            id="stay-departure"
            type="date"
            value={draft.stay.requestedDeparture}
            onChange={(e) => setDraft((d) => ({ ...d, stay: { ...d.stay, requestedDeparture: e.target.value } }))}
            className="field"
          />
        </Field>
      </div>
      <p className="mt-2 text-xs text-ink/65">{copy.billingNote}</p>

      <p className="mt-8 text-sm font-medium text-ink/80">{copy.servicesHeading}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label={copy.electricityLabel} htmlFor="stay-amps">
          <select
            id="stay-amps"
            value={draft.stay.servicesWanted.electricityAmps}
            onChange={(e) =>
              setServices({ electricityAmps: Number(e.target.value) as (typeof AMP_OPTIONS)[number] })
            }
            className="field"
          >
            {AMP_OPTIONS.map((amps) => (
              <option key={amps} value={amps}>
                {amps === 0 ? "-" : `${amps}A`}
              </option>
            ))}
          </select>
        </Field>
        <label className="flex items-center gap-2 self-end pb-2 text-sm text-ink/75">
          <input
            type="checkbox"
            checked={draft.stay.servicesWanted.water}
            onChange={(e) => setServices({ water: e.target.checked })}
          />
          {copy.waterLabel}
        </label>
        <label className="flex items-center gap-2 self-end pb-2 text-sm text-ink/75">
          <input
            type="checkbox"
            checked={draft.stay.servicesWanted.pumpOut}
            onChange={(e) => setServices({ pumpOut: e.target.checked })}
          />
          {copy.pumpOutLabel}
        </label>
        <label className="flex items-center gap-2 self-end pb-2 text-sm text-ink/75">
          <input
            type="checkbox"
            checked={draft.stay.servicesWanted.fuelDockSlot}
            onChange={(e) => setServices({ fuelDockSlot: e.target.checked })}
          />
          {copy.fuelDockSlotLabel}
        </label>
        <label className="flex items-center gap-2 self-end pb-2 text-sm text-ink/75">
          <input
            type="checkbox"
            checked={draft.stay.servicesWanted.crane}
            onChange={(e) => setServices({ crane: e.target.checked })}
          />
          {copy.craneLabel}
        </label>
      </div>

      <div className="mt-6 max-w-xl">
        <Field label={copy.specialRequestsLabel} htmlFor="stay-requests">
          <textarea
            id="stay-requests"
            rows={3}
            value={draft.stay.specialRequests}
            onChange={(e) => setDraft((d) => ({ ...d, stay: { ...d.stay, specialRequests: e.target.value } }))}
            className="field"
          />
        </Field>
      </div>

      <div className="surface-lift mt-8 max-w-md p-6">
        <p className="type-label">{copy.priceHeading}</p>
        {quote ? (
          <>
            {quote.lines.map((line) => (
              <p key={line.season} className="tabular mt-2 text-sm text-ink/75">
                {copy.lineLabel(
                  line.nights,
                  line.season === "low" ? copy.seasonLow : copy.seasonHigh,
                  `€${line.rateEur.toFixed(2)}`
                )}
              </p>
            ))}
            {quote.multihull ? <p className="mt-1 text-xs text-ink/65">{copy.multihullNote}</p> : null}
            <p className="tabular mt-3 text-sm text-ink/75">
              {copy.subtotalLine(`€${quote.subtotalExVatEur.toFixed(2)}`, `€${quote.vatEur.toFixed(2)}`)}
            </p>
            <p className="tabular mt-1 text-2xl font-medium text-ink">
              €{quote.totalIncVatEur.toFixed(2)}
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm text-ink/70">{copy.askMarina}</p>
        )}
        <p className="mt-3 text-xs text-ink/65">{copy.indicativeNote}</p>
      </div>

      <label className="mt-4 flex items-start gap-3 text-sm text-ink/80">
        <input
          type="checkbox"
          checked={draft.stay.depositAcknowledged}
          onChange={(e) => setDraft((d) => ({ ...d, stay: { ...d.stay, depositAcknowledged: e.target.checked } }))}
          className="mt-1"
        />
        {copy.depositNote}
      </label>
    </div>
  );
}
