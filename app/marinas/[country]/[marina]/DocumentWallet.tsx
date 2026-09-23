"use client";

import type { BoatDocuments } from "../../../../lib/boatProfile";

const inputClass =
  "mt-2 w-full border border-neutral-200 px-3 py-2 text-sm text-navy focus:border-navy/40 focus:outline-none";
const labelClass = "text-xs font-normal tracking-wide text-navy/60 uppercase";

type Props = {
  documents: BoatDocuments;
  onChange: (documents: BoatDocuments) => void;
  insuranceMinimumLabel: string;
  arrival: string;
  includeInEnquiry: boolean;
  onIncludeChange: (include: boolean) => void;
};

export default function DocumentWallet({
  documents,
  onChange,
  insuranceMinimumLabel,
  arrival,
  includeInEnquiry,
  onIncludeChange,
}: Props) {
  function set<K extends keyof BoatDocuments>(key: K, value: string) {
    onChange({ ...documents, [key]: value });
  }

  const expiresBeforeArrival =
    !!documents.insuranceExpiry &&
    !!arrival &&
    documents.insuranceExpiry < arrival;

  return (
    <div>
      <p className="mt-4 text-sm leading-relaxed font-light text-neutral-600">
        All optional. Save these details with your boat to reuse them next time,
        or leave any blank and give them to the marina staff in person. The
        documents themselves must be shown on arrival — only the text is stored
        here, in this browser.
      </p>
      <p className="mt-2 text-xs font-light text-neutral-400">
        Bring: boat registration (Portugal requires originals, not laminated
        copies), proof of third-party insurance (min {insuranceMinimumLabel},
        certificate in Portuguese if possible), and the skipper&apos;s
        certificate of competence.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block text-sm">
          <span className={labelClass}>Registration number</span>
          <input
            type="text"
            value={documents.registrationNumber}
            onChange={(e) => set("registrationNumber", e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block text-sm">
          <span className={labelClass}>Insurance provider</span>
          <input
            type="text"
            value={documents.insuranceProvider}
            onChange={(e) => set("insuranceProvider", e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block text-sm">
          <span className={labelClass}>Insurance policy number</span>
          <input
            type="text"
            value={documents.insurancePolicy}
            onChange={(e) => set("insurancePolicy", e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block text-sm">
          <span className={labelClass}>Insurance expiry</span>
          <input
            type="date"
            value={documents.insuranceExpiry}
            onChange={(e) => set("insuranceExpiry", e.target.value)}
            className={inputClass}
          />
          {expiresBeforeArrival ? (
            <p className="mt-1 text-xs font-light text-amber-700">
              This expires before your arrival date.
            </p>
          ) : null}
        </label>
        <label className="block text-sm">
          <span className={labelClass}>Skipper&apos;s competence certificate</span>
          <input
            type="text"
            value={documents.competenceCertificate}
            onChange={(e) => set("competenceCertificate", e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block text-sm">
          <span className={labelClass}>VHF licence</span>
          <input
            type="text"
            value={documents.vhfLicence}
            onChange={(e) => set("vhfLicence", e.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm font-light text-neutral-600">
        <input
          type="checkbox"
          checked={includeInEnquiry}
          onChange={(e) => onIncludeChange(e.target.checked)}
        />
        Include these details in my enquiry email
      </label>
    </div>
  );
}
