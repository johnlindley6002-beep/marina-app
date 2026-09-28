"use client";

import { COUNTRIES } from "../../../../../lib/countries";
import { isEU } from "../../../../../lib/prearrival/countries";
import { getVoyageFlags } from "../../../../../lib/prearrival/schema";
import { useLanguage } from "../../../../components/LanguageProvider";
import type { StepProps } from "./PreArrivalWizard";
import { Field, InfoPanel } from "./WizardBits";

export default function StepVoyage({ draft, setDraft, errors }: StepProps) {
  const { t } = useLanguage();
  const copy = t.preArrival.voyage;
  const flags = getVoyageFlags(draft.voyage);
  const flagIsNonEU = !!draft.boatIdentity.flagCountry && !isEU(draft.boatIdentity.flagCountry);
  const ownerIsEUResident = !!draft.owner.countryOfResidence && isEU(draft.owner.countryOfResidence);

  return (
    <div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label={copy.lastPortLabel} htmlFor="voy-lastport" required error={errors["voyage.lastPortName"]}>
          <input
            id="voy-lastport"
            type="text"
            value={draft.voyage.lastPortName}
            onChange={(e) => setDraft((d) => ({ ...d, voyage: { ...d.voyage, lastPortName: e.target.value } }))}
            className="field"
          />
        </Field>
        <Field label={copy.lastPortCountryLabel} htmlFor="voy-lastcountry" required error={errors["voyage.lastPortCountry"]}>
          <select
            id="voy-lastcountry"
            value={draft.voyage.lastPortCountry}
            onChange={(e) => setDraft((d) => ({ ...d, voyage: { ...d.voyage, lastPortCountry: e.target.value } }))}
            className="field"
          >
            <option value="">Select…</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label={copy.nextPortLabel} htmlFor="voy-nextport" required error={errors["voyage.nextPortName"]}>
          <input
            id="voy-nextport"
            type="text"
            value={draft.voyage.nextPortName}
            onChange={(e) => setDraft((d) => ({ ...d, voyage: { ...d.voyage, nextPortName: e.target.value } }))}
            className="field"
          />
        </Field>
        <Field label={copy.nextPortCountryLabel} htmlFor="voy-nextcountry" required error={errors["voyage.nextPortCountry"]}>
          <select
            id="voy-nextcountry"
            value={draft.voyage.nextPortCountry}
            onChange={(e) => setDraft((d) => ({ ...d, voyage: { ...d.voyage, nextPortCountry: e.target.value } }))}
            className="field"
          >
            <option value="">Select…</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label={copy.arrivalLabel} htmlFor="voy-arrival" required error={errors["voyage.arrivalDateTime"]}>
          <input
            id="voy-arrival"
            type="datetime-local"
            value={draft.voyage.arrivalDateTime}
            onChange={(e) => setDraft((d) => ({ ...d, voyage: { ...d.voyage, arrivalDateTime: e.target.value } }))}
            className="field"
          />
        </Field>
        <Field label={copy.departureLabel} htmlFor="voy-departure" error={errors["voyage.departureDateTime"]}>
          <input
            id="voy-departure"
            type="datetime-local"
            value={draft.voyage.departureDateTime}
            onChange={(e) => setDraft((d) => ({ ...d, voyage: { ...d.voyage, departureDateTime: e.target.value } }))}
            className="field"
          />
        </Field>
      </div>

      {flags.arrivingFromOutsideSchengen ? (
        <InfoPanel title={copy.infoOutsideSchengenTitle}>{copy.infoOutsideSchengenBody}</InfoPanel>
      ) : null}

      {flagIsNonEU ? (
        <InfoPanel title={copy.infoNonEUFlagTitle}>
          {copy.infoNonEUFlagBody}
          {ownerIsEUResident ? (
            <span className="mt-2 block text-error">{copy.infoNonEUFlagResidentWarning}</span>
          ) : null}
        </InfoPanel>
      ) : null}

      {flags.fromOrToNonEU ? (
        <InfoPanel title={copy.infoNonEUMovementTitle}>{copy.infoNonEUMovementBody}</InfoPanel>
      ) : null}
    </div>
  );
}
