"use client";

import Disclosure from "@/components/ui/Disclosure";
import { useLanguage } from "@/components/providers/LanguageProvider";
import type { BoatDocuments } from "@/features/my-boat/lib/boatProfile";

const inputClass = "field";
const labelClass = "field-label";

type Props = {
  documents: BoatDocuments;
  onChange: (documents: BoatDocuments) => void;
  insuranceMinimumLabel: string;
  arrival?: string;
  // Omit both to use the wallet on its own (the My boat page).
  includeInEnquiry?: boolean;
  onIncludeChange?: (include: boolean) => void;
};

export default function DocumentWallet({
  documents,
  onChange,
  insuranceMinimumLabel,
  arrival = "",
  includeInEnquiry = false,
  onIncludeChange,
}: Props) {
  const { t } = useLanguage();
  const copy = t.stay.wallet;

  function set<K extends keyof BoatDocuments>(key: K, value: string) {
    onChange({ ...documents, [key]: value });
  }

  const expiresBeforeArrival =
    !!documents.insuranceExpiry && !!arrival && documents.insuranceExpiry < arrival;

  return (
    <div>
      <p className="mt-4 text-sm leading-relaxed text-ink-soft">{copy.optional}</p>
      <Disclosure label={copy.moreAbout} openLabel={copy.hide}>
        <p className="pb-2 text-sm leading-relaxed text-ink-soft">{copy.moreAboutBody}</p>
      </Disclosure>
      <p className="mt-2 text-xs text-ink-muted">{copy.bring(insuranceMinimumLabel)}</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block text-sm">
          <span className={labelClass}>{copy.registrationNumber}</span>
          <input
            type="text"
            value={documents.registrationNumber}
            onChange={(e) => set("registrationNumber", e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block text-sm">
          <span className={labelClass}>{copy.insuranceProvider}</span>
          <input
            type="text"
            value={documents.insuranceProvider}
            onChange={(e) => set("insuranceProvider", e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block text-sm">
          <span className={labelClass}>{copy.insurancePolicy}</span>
          <input
            type="text"
            value={documents.insurancePolicy}
            onChange={(e) => set("insurancePolicy", e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block text-sm">
          <span className={labelClass}>{copy.insuranceExpiry}</span>
          <input
            type="date"
            value={documents.insuranceExpiry}
            onChange={(e) => set("insuranceExpiry", e.target.value)}
            className={inputClass}
          />
          {expiresBeforeArrival ? <p className="field-error">{copy.expiresBefore}</p> : null}
        </label>
        <label className="block text-sm">
          <span className={labelClass}>{copy.competence}</span>
          <input
            type="text"
            value={documents.competenceCertificate}
            onChange={(e) => set("competenceCertificate", e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block text-sm">
          <span className={labelClass}>{copy.vhfLicence}</span>
          <input
            type="text"
            value={documents.vhfLicence}
            onChange={(e) => set("vhfLicence", e.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      {onIncludeChange ? (
        <label className="mt-4 flex items-center gap-2 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={includeInEnquiry}
            onChange={(e) => onIncludeChange(e.target.checked)}
          />
          {copy.includeInEnquiry}
        </label>
      ) : null}
    </div>
  );
}
