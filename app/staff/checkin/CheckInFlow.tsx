"use client";

import { useMemo, useState } from "react";
import { formatLongDate, todayIso } from "../../../lib/formatDate";
import {
  getEnquiries,
  markEnquiryArrived,
  markEnquiryDeparted,
  type Enquiry,
} from "../../../lib/mockData";
import { formatLength } from "../../../lib/units";
import { useMock } from "../../../lib/useMock";
import { useAuth } from "../../components/AuthProvider";
import { useUnits } from "../../components/UnitsProvider";

const NONE: Enquiry[] = [];

function DocRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <p className="text-ink/80">
      <span className="staff-label mb-0 inline">{label}: </span>
      {value}
    </p>
  );
}

function BoatCard({
  enquiry,
  action,
}: {
  enquiry: Enquiry;
  action: { label: string; onClick: () => void } | null;
}) {
  const { units } = useUnits();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasDocs =
    enquiry.documents.registrationNumber ||
    enquiry.documents.insuranceProvider ||
    enquiry.documents.competenceCertificate ||
    enquiry.documents.vhfLicence;

  return (
    <li className="staff-panel">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium text-ink">
            {enquiry.boatName || "Unnamed boat"}{" "}
            <span className="tabular text-xs font-normal text-ink/70">
              Berth {enquiry.assignedBerthId}
            </span>
          </p>
          <p className="tabular text-xs text-ink/70">
            {formatLength(Number(enquiry.loa), units)} LOA · ETA {enquiry.eta || "n/a"} · ETD{" "}
            {enquiry.etd || "n/a"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setOpen((o) => !o)} className="staff-btn">
            {open ? "Hide documents" : "View documents"}
          </button>
          {action ? (
            <button
              type="button"
              onClick={() => {
                setError(null);
                action.onClick();
              }}
              className="staff-btn staff-btn-primary"
            >
              {action.label}
            </button>
          ) : null}
        </div>
      </div>

      {open ? (
        <div className="mt-3 border-t border-hairline pt-3 text-sm">
          <p className="staff-label">Skipper</p>
          <p className="text-ink">{enquiry.skipperName || "Not given"}</p>
          <p className="text-ink/70">
            {enquiry.phone} · {enquiry.email}
          </p>

          <p className="staff-label mt-3">Documents (as entered by the boater, read only)</p>
          {hasDocs ? (
            <div className="mt-1 space-y-0.5">
              <DocRow label="Registration" value={enquiry.documents.registrationNumber} />
              <DocRow
                label="Insurance"
                value={
                  enquiry.documents.insuranceProvider
                    ? `${enquiry.documents.insuranceProvider}${
                        enquiry.documents.insurancePolicy ? `, ${enquiry.documents.insurancePolicy}` : ""
                      }`
                    : ""
                }
              />
              <DocRow label="Insurance expiry" value={enquiry.documents.insuranceExpiry} />
              <DocRow label="Competence certificate" value={enquiry.documents.competenceCertificate} />
              <DocRow label="VHF licence" value={enquiry.documents.vhfLicence} />
            </div>
          ) : (
            <p className="text-ink/60">Nothing on file. Check the physical documents on arrival.</p>
          )}

          {enquiry.crew.length > 0 ? (
            <>
              <p className="staff-label mt-3">Crew list ({enquiry.crew.length})</p>
              <ul className="space-y-0.5 text-ink/80">
                {enquiry.crew.map((c, i) => (
                  <li key={i}>
                    {c.fullName || "Unnamed"}, {c.role || c.personType}
                    {c.nationality ? `, ${c.nationality}` : ""}
                    {c.passportNumber ? `, passport ${c.passportNumber}` : ""}
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          {enquiry.vesselUse && enquiry.vesselUse !== "private" ? (
            <>
              <p className="staff-label mt-3">Commercial / charter</p>
              <p className="text-ink/80">
                {enquiry.vesselUse}
                {enquiry.operatingEntity ? `, ${enquiry.operatingEntity}` : ""}
                {enquiry.companyRegistration ? `, reg. ${enquiry.companyRegistration}` : ""}
              </p>
            </>
          ) : null}
        </div>
      ) : null}
      {error ? (
        <p role="alert" className="field-error mt-2">
          {error}
        </p>
      ) : null}
    </li>
  );
}

// A quick daily flow: who is arriving, who is on site, who is departing, with
// their documents and crew list read only, and one tap to move them along.
export default function CheckInFlow() {
  const { user } = useAuth();
  const staffId = user?.id ?? null;
  const { value: enquiries, ready } = useMock(
    () => getEnquiries(staffId),
    NONE,
    staffId ?? ""
  );
  const today = todayIso();

  const { arriving, onSite, departing } = useMemo(() => {
    const approved = enquiries.filter((e) => e.status === "approved");
    return {
      arriving: approved.filter((e) => e.arrivalStatus === "pending" && e.arrival <= today),
      onSite: approved.filter((e) => e.arrivalStatus === "arrived"),
      departing: approved.filter(
        (e) => e.arrivalStatus === "arrived" && !e.openEnded && e.departure <= today
      ),
    };
  }, [enquiries, today]);

  return (
    <div>
      <h1 className="type-heading type-h2 text-ink">Check-in / check-out</h1>
      <p className="mt-1 text-sm text-ink/70">{formatLongDate(today)}</p>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div className="staff-kpi">
          <p className="staff-kpi-value tabular">{arriving.length}</p>
          <p className="text-xs text-ink/70">Arriving, not yet checked in</p>
        </div>
        <div className="staff-kpi">
          <p className="staff-kpi-value tabular">{onSite.length}</p>
          <p className="text-xs text-ink/70">On site</p>
        </div>
        <div className="staff-kpi">
          <p className="staff-kpi-value tabular">{departing.length}</p>
          <p className="text-xs text-ink/70">Departing today</p>
        </div>
      </div>

      <section className="mt-6">
        <h2 className="type-heading type-h3 text-ink">Arriving</h2>
        {arriving.length > 0 ? (
          <ul className="mt-2 space-y-2">
            {arriving.map((e) => (
              <BoatCard
                key={e.id}
                enquiry={e}
                action={{ label: "Check in", onClick: () => markEnquiryArrived(staffId, e.id) }}
              />
            ))}
          </ul>
        ) : (
          <p className="staff-empty mt-2">{ready ? "Nobody due to arrive right now." : ""}</p>
        )}
      </section>

      <section className="mt-6">
        <h2 className="type-heading type-h3 text-ink">On site</h2>
        {onSite.length > 0 ? (
          <ul className="mt-2 space-y-2">
            {onSite.map((e) => (
              <BoatCard
                key={e.id}
                enquiry={e}
                action={
                  !e.openEnded && e.departure <= today
                    ? { label: "Check out", onClick: () => markEnquiryDeparted(staffId, e.id) }
                    : null
                }
              />
            ))}
          </ul>
        ) : (
          <p className="staff-empty mt-2">{ready ? "No boats on site." : ""}</p>
        )}
      </section>
    </div>
  );
}
