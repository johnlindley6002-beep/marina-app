"use client";

import { useMemo, useState } from "react";
import { marinas } from "../../../data/marinas";
import {
  getPreArrivalCheckInsForStaff,
  markPreArrivalCheckedIn,
  type PreArrivalCheckIn,
} from "../../../lib/mockData";
import { maskIdNumber } from "../../../lib/prearrival/mask";
import { getVoyageFlags, isMinor } from "../../../lib/prearrival/schema";
import { getExtraErrors, getWarnings } from "../../../lib/prearrival/warnings";
import { getMissingRequiredDocuments } from "../../../lib/prearrival/documentRules";
import { useMock } from "../../../lib/useMock";
import { useAuth } from "../../components/AuthProvider";
import { Collapse } from "../../components/Disclosure";
import DocumentButtons from "../../components/DocumentButtons";

const NONE: PreArrivalCheckIn[] = [];

type PreArrivalStatus = "ready" | "missing" | "border";

function statusFor(checkIn: PreArrivalCheckIn): PreArrivalStatus {
  const { draft } = checkIn;
  const missing = getMissingRequiredDocuments(draft).length > 0 || getExtraErrors(draft).length > 0;
  if (missing) return "missing";
  if (getVoyageFlags(draft.voyage).crossesExternalBorder) return "border";
  return "ready";
}

const STATUS_LABEL: Record<PreArrivalStatus, string> = {
  ready: "Ready",
  missing: "Missing info",
  border: "Needs border check",
};

const STATUS_CLASS: Record<PreArrivalStatus, string> = {
  ready: "staff-badge-ink",
  missing: "staff-badge-warn",
  border: "staff-badge-accent",
};

function Row({ checkIn, staffId }: { checkIn: PreArrivalCheckIn; staffId: string | null }) {
  const { draft } = checkIn;
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const marina = marinas.find((m) => m.id === checkIn.marinaId);
  const status = statusFor(checkIn);
  const flags = getVoyageFlags(draft.voyage);
  const warnings = [...getExtraErrors(draft), ...getWarnings(draft)];
  const arrivalDate = draft.voyage.arrivalDateTime.slice(0, 10) || draft.stay.requestedArrival;
  const minorOnBoard = draft.people.some((p) => isMinor(p, arrivalDate));
  const nonEUFlagged = !!draft.boatIdentity.flagCountry && marina && draft.boatIdentity.flagCountry !== "Portugal";
  const insurance = draft.documents.thirdPartyInsurance;
  const insuranceExpired = !!insurance.expiryDate && insurance.expiryDate < draft.stay.requestedDeparture;
  const rowId = `prearrival-${checkIn.id}`;

  if (!marina) return null;

  return (
    <li className="staff-panel">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={rowId}
        className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2 text-left"
      >
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 font-medium text-ink">
            {draft.boatIdentity.name || "Unnamed boat"}
            <span className={`staff-badge ${STATUS_CLASS[status]}`}>{STATUS_LABEL[status]}</span>
            <span className="staff-badge staff-badge-outline">
              {flags.fromOrToNonEU ? "Non-EU route" : "EU route"}
            </span>
            {nonEUFlagged ? <span className="staff-badge staff-badge-warn">Non-EU flag</span> : null}
            {minorOnBoard ? <span className="staff-badge staff-badge-warn">Minor on board</span> : null}
            {insuranceExpired ? <span className="staff-badge staff-badge-warn">Insurance expired</span> : null}
          </p>
          <p className="tabular mt-1 text-xs text-ink/70">
            {draft.stay.requestedArrival || draft.voyage.arrivalDateTime} · {draft.people.length} on board ·
            ref. {checkIn.referenceCode}
          </p>
        </div>
      </button>

      <Collapse open={open} id={rowId}>
        <div className="mt-3 border-t border-hairline pt-3 text-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="staff-label">Skipper / owner</p>
              <p className="text-ink">{draft.owner.fullName || "Not given"}</p>
              <p className="text-ink/70">{draft.owner.phone}</p>
              <p className="text-ink/70">{draft.owner.email}</p>
            </div>
            <div>
              <p className="staff-label">Voyage</p>
              <p className="text-ink">
                {draft.voyage.lastPortName}, {draft.voyage.lastPortCountry} &rarr;{" "}
                {draft.voyage.nextPortName}, {draft.voyage.nextPortCountry}
              </p>
            </div>
          </div>

          {draft.people.length > 0 ? (
            <div className="mt-3">
              <p className="staff-label">Crew and guests ({draft.people.length})</p>
              <ul className="text-ink/80">
                {draft.people.map((p, i) => (
                  <li key={i}>
                    {[p.givenNames, p.familyName].filter(Boolean).join(" ") || "Unnamed"}, {p.role},{" "}
                    {p.nationality || "nationality not given"}, ID {maskIdNumber(p.idNumber)}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {warnings.length > 0 ? (
            <div className="mt-3">
              <p className="staff-label">Flags</p>
              <ul className="text-ink/80">
                {warnings.map((w, i) => (
                  <li key={i}>{w.message}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <DocumentButtons checkIn={checkIn} marina={marina} className="mt-4" />

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {checkIn.checkedInAt ? (
              <span className="staff-badge staff-badge-ink">Berthed</span>
            ) : (
              <button
                type="button"
                onClick={() => {
                  const result = markPreArrivalCheckedIn(checkIn.id);
                  setError(result.ok ? null : result.error);
                }}
                className="staff-btn staff-btn-primary"
              >
                Mark checked in
              </button>
            )}
          </div>
          {error ? (
            <p role="alert" className="field-error mt-2">
              {error}
            </p>
          ) : null}
        </div>
      </Collapse>
    </li>
  );
}

export default function PreArrivalArrivals() {
  const { user } = useAuth();
  const staffId = user?.id ?? null;
  const { value: checkIns, ready } = useMock(
    () => getPreArrivalCheckInsForStaff(staffId),
    NONE,
    staffId ?? ""
  );
  const [needsAuthorityOnly, setNeedsAuthorityOnly] = useState(false);
  const [hideBerthed, setHideBerthed] = useState(true);

  const filtered = useMemo(() => {
    return checkIns
      .filter((c) => !hideBerthed || !c.checkedInAt)
      .filter((c) => !needsAuthorityOnly || getVoyageFlags(c.draft.voyage).fromOrToNonEU);
  }, [checkIns, hideBerthed, needsAuthorityOnly]);

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="type-heading type-h3 text-ink">Pre-arrival check-ins</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={needsAuthorityOnly}
            onClick={() => setNeedsAuthorityOnly((v) => !v)}
            className={`staff-btn ${needsAuthorityOnly ? "staff-btn-primary" : ""}`}
          >
            Needs authority report
          </button>
          <button
            type="button"
            aria-pressed={hideBerthed}
            onClick={() => setHideBerthed((v) => !v)}
            className={`staff-btn ${hideBerthed ? "staff-btn-primary" : ""}`}
          >
            Hide berthed
          </button>
        </div>
      </div>

      <ul className="mt-3 space-y-2">
        {filtered.map((checkIn) => (
          <Row key={checkIn.id} checkIn={checkIn} staffId={staffId} />
        ))}
      </ul>

      {ready && filtered.length === 0 ? (
        <p className="staff-empty mt-4">No pre-arrival check-ins to show.</p>
      ) : null}
    </div>
  );
}
