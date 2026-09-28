"use client";

import { getDocumentRequirements } from "../../../../../lib/prearrival/documentRules";
import type { DocumentKey, Documents } from "../../../../../lib/prearrival/schema";
import { useBoats } from "../../../../components/BoatProvider";
import { useLanguage } from "../../../../components/LanguageProvider";
import type { StepProps } from "./PreArrivalWizard";
import { Field } from "./WizardBits";

// What the document wallet (the saved boat's own documents) can prefill for
// each checklist item, when a saved boat was chosen in Step 1. Not every
// item has a wallet equivalent, e.g. IUC proof and Temporary Admission
// evidence, since neither is tracked in the boat profile hub.
function savedValueFor(
  key: DocumentKey,
  boat: ReturnType<typeof useBoats>["boats"][number]
): { number: string; insurer?: string; expiryDate?: string } | null {
  const docs = boat.documents;
  if (!docs) return null;
  switch (key) {
    case "registration":
      return docs.registrationNumber ? { number: docs.registrationNumber } : null;
    case "thirdPartyInsurance":
      return docs.insurancePolicy
        ? { number: docs.insurancePolicy, insurer: docs.insuranceProvider, expiryDate: docs.insuranceExpiry }
        : null;
    case "skipperLicence":
      return docs.competenceCertificate ? { number: docs.competenceCertificate } : null;
    case "radioStationLicence":
      return docs.vhfLicence ? { number: docs.vhfLicence } : null;
    default:
      return null;
  }
}

export default function StepDocuments({ draft, setDraft }: StepProps) {
  const { t } = useLanguage();
  const copy = t.preArrival.documents;
  const requirements = getDocumentRequirements(draft);
  const { boats } = useBoats();
  const savedBoat = boats.find((b) => b.id === draft.boatId) ?? null;

  function updateEntry<K extends DocumentKey>(key: K, patch: Partial<Documents[K]>) {
    setDraft((d) => ({
      ...d,
      documents: { ...d.documents, [key]: { ...d.documents[key], ...patch } },
    }));
  }

  return (
    <div>
      <p className="mt-6 max-w-xl text-sm text-ink/75">{copy.intro}</p>

      <ul className="mt-6">
        {requirements.map((req) => {
          const entry = draft.documents[req.key];
          const saved = savedBoat ? savedValueFor(req.key, savedBoat) : null;
          const showUseSaved = saved && !entry.number.trim();
          return (
            <li key={req.key} className="hairline-top py-6 first:border-t-0">
              <div className="flex flex-wrap items-center gap-3">
                <p className="font-medium text-ink">{copy.items[req.key]}</p>
                <span className={`chip ${req.required ? "border-ink/40" : "text-ink/65"}`}>
                  {req.required ? copy.requiredChip : copy.optionalChip}
                </span>
                {showUseSaved ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (req.key === "thirdPartyInsurance") {
                        updateEntry("thirdPartyInsurance", {
                          number: saved.number,
                          expiryDate: saved.expiryDate || entry.expiryDate,
                          insurer: saved.insurer || "",
                        });
                      } else {
                        updateEntry(req.key, {
                          number: saved.number,
                          expiryDate: saved.expiryDate || entry.expiryDate,
                        });
                      }
                    }}
                    className="text-xs text-ink/65 underline underline-offset-4"
                  >
                    {copy.useSaved}
                  </button>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-ink/65">{req.reason}</p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label={copy.numberLabel} htmlFor={`doc-${req.key}-number`}>
                  <input
                    id={`doc-${req.key}-number`}
                    type="text"
                    value={entry.number}
                    onChange={(e) => updateEntry(req.key, { number: e.target.value })}
                    className="field"
                  />
                </Field>
                <Field label={copy.issuingAuthorityLabel} htmlFor={`doc-${req.key}-authority`}>
                  <input
                    id={`doc-${req.key}-authority`}
                    type="text"
                    value={entry.issuingAuthority}
                    onChange={(e) => updateEntry(req.key, { issuingAuthority: e.target.value })}
                    className="field"
                  />
                </Field>
                <Field label={copy.expiryLabel} htmlFor={`doc-${req.key}-expiry`}>
                  <input
                    id={`doc-${req.key}-expiry`}
                    type="date"
                    value={entry.expiryDate}
                    onChange={(e) => updateEntry(req.key, { expiryDate: e.target.value })}
                    className="field"
                  />
                </Field>
                {req.key === "thirdPartyInsurance" ? (
                  <Field label={copy.insurerLabel} htmlFor="doc-insurer">
                    <input
                      id="doc-insurer"
                      type="text"
                      value={draft.documents.thirdPartyInsurance.insurer}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          documents: {
                            ...d.documents,
                            thirdPartyInsurance: { ...d.documents.thirdPartyInsurance, insurer: e.target.value },
                          },
                        }))
                      }
                      className="field"
                    />
                  </Field>
                ) : null}
              </div>

              <label className="mt-4 flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={entry.uploaded}
                  onChange={(e) =>
                    updateEntry(req.key, {
                      uploaded: e.target.checked,
                      fileName: e.target.checked ? entry.fileName || `${req.key}.pdf` : "",
                    })
                  }
                />
                <span className="text-sm text-ink/75">
                  {copy.uploadTile}
                  {entry.uploaded && entry.fileName ? ` · ${entry.fileName}` : ""}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
