"use client";

import Link from "next/link";
import type { Marina } from "../../../../../data/marinas";
import { getDocumentRequirements } from "../../../../../lib/prearrival/documentRules";
import type { PreArrivalCheckIn } from "../../../../../lib/mockData";
import { useLanguage } from "../../../../components/LanguageProvider";

export default function Confirmation({
  marina,
  checkIn,
}: {
  marina: Marina;
  checkIn: PreArrivalCheckIn;
}) {
  const { t } = useLanguage();
  const copy = t.preArrival.confirmation;
  const documentItems = t.preArrival.documents.items;
  const requiredDocs = getDocumentRequirements(checkIn.draft).filter((r) => r.required);

  return (
    <div className="section-tight">
      <div className="page-column page-reading">
        <h1 className="type-title text-ink">{copy.heading}</h1>

        <div className="surface-lift mt-8 p-6">
          <p className="type-label">{copy.referenceLabel}</p>
          <p className="tabular mt-1 text-2xl font-medium text-ink">{checkIn.referenceCode}</p>
        </div>

        <div className="mt-8">
          <p className="type-heading type-h3 text-ink">{copy.whatNextHeading}</p>
          <p className="mt-2 text-ink/75">{copy.whatNextBody}</p>
        </div>

        <div className="mt-8">
          <p className="type-heading type-h3 text-ink">{copy.bringHeading}</p>
          <ul className="mt-3 space-y-1 text-sm text-ink/75">
            {requiredDocs.map((req) => (
              <li key={req.key}>{documentItems[req.key]}</li>
            ))}
          </ul>
        </div>

        <Link
          href={`/marinas/${marina.countrySlug}/${marina.id}`}
          className="btn-secondary mt-10 inline-block"
        >
          {copy.backToMarina}
        </Link>
      </div>
    </div>
  );
}
