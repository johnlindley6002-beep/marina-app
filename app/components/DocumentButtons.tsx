"use client";

import { useState } from "react";
import type { Marina } from "../../data/marinas";
import { buildAuthorityReportCsv, buildAuthorityReportJson } from "../../lib/documents/authorityReport";
import { generateArrivalDeclarationPdf } from "../../lib/documents/arrivalDeclaration";
import { generateCrewListPdf } from "../../lib/documents/crewList";
import { downloadBytes, downloadText } from "../../lib/documents/download";
import type { PreArrivalCheckIn } from "../../lib/mockData";
import { getVoyageFlags } from "../../lib/prearrival/schema";
import { useLanguage } from "./LanguageProvider";

type Props = {
  checkIn: PreArrivalCheckIn;
  marina: Marina;
  className?: string;
};

// The three generated documents, offered wherever a submitted check-in is
// shown: the confirmation screen, the boat's booking detail in My boat, and
// the staff arrivals board. Each button generates the file client-side, on
// click, from the mock data already on the check-in: nothing is uploaded.
export default function DocumentButtons({ checkIn, marina, className }: Props) {
  const { t } = useLanguage();
  const copy = t.preArrival.generatedDocs;
  const [busy, setBusy] = useState<string | null>(null);
  const flags = getVoyageFlags(checkIn.draft.voyage);
  const nonEUMovement = flags.fromOrToNonEU;

  async function downloadDeclaration() {
    setBusy("declaration");
    try {
      const bytes = await generateArrivalDeclarationPdf(checkIn, marina);
      downloadBytes(bytes, `arrival-declaration-${checkIn.referenceCode}.pdf`, "application/pdf");
    } finally {
      setBusy(null);
    }
  }

  async function downloadCrewList() {
    setBusy("crew");
    try {
      const bytes = await generateCrewListPdf(checkIn, marina);
      downloadBytes(bytes, `crew-list-${checkIn.referenceCode}.pdf`, "application/pdf");
    } finally {
      setBusy(null);
    }
  }

  function downloadAuthorityJson() {
    downloadText(
      buildAuthorityReportJson(checkIn),
      `authority-report-${checkIn.referenceCode}.json`,
      "application/json"
    );
  }

  function downloadAuthorityCsv() {
    downloadText(
      buildAuthorityReportCsv(checkIn),
      `authority-report-${checkIn.referenceCode}.csv`,
      "text/csv"
    );
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={downloadDeclaration} disabled={busy === "declaration"} className="btn-secondary">
          {busy === "declaration" ? copy.preparing : copy.declarationBtn}
        </button>
        <button type="button" onClick={downloadCrewList} disabled={busy === "crew"} className="btn-secondary">
          {busy === "crew" ? copy.preparing : copy.crewListBtn}
        </button>
      </div>
      {nonEUMovement ? (
        <div className="mt-4">
          <p className="text-sm text-ink/70">{copy.authorityNote}</p>
          <div className="mt-2 flex flex-wrap gap-3">
            <button type="button" onClick={downloadAuthorityJson} className="btn-quiet text-sm">
              {copy.authorityJsonBtn}
            </button>
            <button type="button" onClick={downloadAuthorityCsv} className="btn-quiet text-sm">
              {copy.authorityCsvBtn}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
