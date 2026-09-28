"use client";

import { getDocumentRequirements } from "../../../../../lib/prearrival/documentRules";
import type { IndicativeQuote } from "../../../../../lib/prearrival/pricing";
import type { Flag } from "../../../../../lib/prearrival/warnings";
import { useLanguage } from "../../../../components/LanguageProvider";
import type { StepProps } from "./PreArrivalWizard";
import { WarningPanel } from "./WizardBits";

type Props = StepProps & {
  quote: IndicativeQuote | null;
  warnings: Flag[];
  onEdit: (step: number) => void;
  onSubmit: () => void;
};

function SectionHeading({
  title,
  editLabel,
  onEdit,
}: {
  title: string;
  editLabel: string;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="type-heading type-h3 text-ink">{title}</p>
      <button type="button" onClick={onEdit} className="text-sm text-ink/70 underline underline-offset-4">
        {editLabel}
      </button>
    </div>
  );
}

export default function StepReview({ draft, setDraft, errors, quote, warnings, onEdit, onSubmit }: Props) {
  const { t } = useLanguage();
  const copy = t.preArrival.review;
  const steps = t.preArrival.steps;
  const documentItems = t.preArrival.documents.items;
  const requirements = getDocumentRequirements(draft);

  function setConsent(key: keyof typeof draft.consents, value: boolean) {
    setDraft((d) => ({ ...d, consents: { ...d.consents, [key]: value } }));
  }

  return (
    <div>
      <div className="mt-6">
        <SectionHeading title={steps.boat} editLabel={copy.edit} onEdit={() => onEdit(1)} />
        <p className="mt-2 text-sm text-ink/75">
          {draft.boatIdentity.name || "-"} · {draft.boatIdentity.flagCountry || "-"} ·{" "}
          {draft.boatSpecs.lengthOverall || "-"} m
        </p>
        <p className="mt-1 text-sm text-ink/75">{draft.owner.fullName || "-"}</p>
      </div>

      <div className="hairline-top mt-6 pt-6">
        <SectionHeading title={steps.voyage} editLabel={copy.edit} onEdit={() => onEdit(2)} />
        <p className="mt-2 text-sm text-ink/75">
          {draft.voyage.lastPortName || "-"} ({draft.voyage.lastPortCountry || "-"}) →{" "}
          {draft.voyage.nextPortName || "-"} ({draft.voyage.nextPortCountry || "-"})
        </p>
        <p className="mt-1 text-sm text-ink/75">
          {draft.voyage.arrivalDateTime || "-"} → {draft.voyage.departureDateTime || "-"}
        </p>
      </div>

      <div className="hairline-top mt-6 pt-6">
        <SectionHeading title={steps.crew} editLabel={copy.edit} onEdit={() => onEdit(3)} />
        <p className="mt-2 text-sm text-ink/75">
          {copy.peopleCount(draft.people.length)}:{" "}
          {draft.people.map((p) => [p.givenNames, p.familyName].filter(Boolean).join(" ") || "-").join(", ")}
        </p>
      </div>

      <div className="hairline-top mt-6 pt-6">
        <SectionHeading title={steps.documents} editLabel={copy.edit} onEdit={() => onEdit(4)} />
        <ul className="mt-2 space-y-1 text-sm text-ink/75">
          {requirements.map((req) => {
            const entry = draft.documents[req.key];
            const has = entry.uploaded || !!entry.number.trim();
            return (
              <li key={req.key}>
                {documentItems[req.key]}:{" "}
                {has ? entry.number || entry.fileName : req.required ? copy.documentMissing : copy.documentNotProvided}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="hairline-top mt-6 pt-6">
        <SectionHeading title={steps.stay} editLabel={copy.edit} onEdit={() => onEdit(5)} />
        <p className="mt-2 text-sm text-ink/75">
          {draft.stay.requestedArrival || "-"} → {draft.stay.requestedDeparture || "-"}
        </p>
        {quote ? (
          <p className="tabular mt-1 text-sm text-ink/75">€{quote.totalIncVatEur.toFixed(2)}</p>
        ) : null}
      </div>

      {warnings.length > 0 ? (
        <div className="hairline-top mt-6 pt-6">
          {warnings.map((w, i) => (
            <WarningPanel key={i}>{w.message}</WarningPanel>
          ))}
        </div>
      ) : null}

      <div className="hairline-top mt-6 pt-6">
        <p className="type-heading type-h3 text-ink">{copy.consentsHeading}</p>
        <p className="mt-2 max-w-xl text-xs text-ink/65">{t.preArrival.privacyNote}</p>
        <div className="mt-4 space-y-3">
          <label className="flex items-start gap-3 text-sm text-ink/80">
            <input
              type="checkbox"
              checked={draft.consents.gdprConsent}
              onChange={(e) => setConsent("gdprConsent", e.target.checked)}
              className="mt-1"
            />
            {copy.gdprLabel}
          </label>
          {errors["consents.gdprConsent"] ? <p className="field-error">{errors["consents.gdprConsent"]}</p> : null}

          <label className="flex items-start gap-3 text-sm text-ink/80">
            <input
              type="checkbox"
              checked={draft.consents.termsAccepted}
              onChange={(e) => setConsent("termsAccepted", e.target.checked)}
              className="mt-1"
            />
            {copy.termsLabel}
          </label>
          {errors["consents.termsAccepted"] ? <p className="field-error">{errors["consents.termsAccepted"]}</p> : null}

          <label className="flex items-start gap-3 text-sm text-ink/80">
            <input
              type="checkbox"
              checked={draft.consents.declarationTrue}
              onChange={(e) => setConsent("declarationTrue", e.target.checked)}
              className="mt-1"
            />
            {copy.declarationLabel}
          </label>
          {errors["consents.declarationTrue"] ? (
            <p className="field-error">{errors["consents.declarationTrue"]}</p>
          ) : null}
        </div>
      </div>

      <button type="button" onClick={onSubmit} className="btn-primary mt-8">
        {copy.submit}
      </button>
    </div>
  );
}
