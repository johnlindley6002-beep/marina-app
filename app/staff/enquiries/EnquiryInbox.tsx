"use client";

import { useState } from "react";
import { formatLongDate } from "../../../lib/formatDate";
import {
  decideEnquiry,
  getEnquiries,
  type Enquiry,
  type EnquiryStatus,
} from "../../../lib/mockData";
import { formatLength } from "../../../lib/units";
import { useMock } from "../../../lib/useMock";
import { useAuth } from "../../components/AuthProvider";
import { Collapse } from "../../components/Disclosure";
import { useUnits } from "../../components/UnitsProvider";
import BerthPicker from "../BerthPicker";

const NONE: Enquiry[] = [];

function isCommercialUseValue(vesselUse: string): boolean {
  return vesselUse !== "" && vesselUse !== "private";
}

const STATUS_TABS: { value: EnquiryStatus | "all"; label: string }[] = [
  { value: "new", label: "New" },
  { value: "approved", label: "Approved" },
  { value: "declined", label: "Declined" },
  { value: "all", label: "All" },
];

function EuFlag({ enquiry }: { enquiry: Enquiry }) {
  if (!enquiry.euStatus) return null;
  return (
    <span className="staff-chip">
      {enquiry.euStatus === "yes" ? "EU-flagged, EU crew" : "Non-EU"}
    </span>
  );
}

function Row({ enquiry, staffId }: { enquiry: Enquiry; staffId: string | null }) {
  const { units } = useUnits();
  const [open, setOpen] = useState(false);
  const [berthId, setBerthId] = useState(enquiry.assignedBerthId ?? "");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const rowId = `enquiry-${enquiry.id}`;

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
            {enquiry.boatName || "Unnamed boat"}
            <span
              className={`staff-badge ${
                enquiry.status === "new"
                  ? "staff-badge-accent"
                  : enquiry.status === "approved"
                    ? "staff-badge-ink"
                    : "staff-badge-warn"
              }`}
            >
              {enquiry.status}
            </span>
            {isCommercialUseValue(enquiry.vesselUse) ? (
              <span className="staff-chip">{enquiry.vesselUse}</span>
            ) : null}
            <EuFlag enquiry={enquiry} />
          </p>
          <p className="tabular mt-1 text-xs text-ink/70">
            {formatLength(Number(enquiry.loa), units)} LOA · {enquiry.arrival} to{" "}
            {enquiry.openEnded ? "open-ended" : enquiry.departure} ·{" "}
            {enquiry.skipperName || "No name given"}
          </p>
        </div>
        <p className="text-xs text-ink/60">Sent {formatLongDate(enquiry.createdAt)}</p>
      </button>

      <Collapse open={open} id={rowId}>
        <div className="mt-3 border-t border-hairline pt-3 text-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="staff-label">Boat</p>
              <p className="text-ink">
                {enquiry.vesselType}, {formatLength(Number(enquiry.loa), units)} LOA,{" "}
                {formatLength(Number(enquiry.beam), units)} beam,{" "}
                {formatLength(Number(enquiry.draft), units)} draft, {enquiry.flagCountry}
              </p>
            </div>
            <div>
              <p className="staff-label">Contact</p>
              <p className="text-ink">{enquiry.skipperName}</p>
              <p className="text-ink/70">
                {enquiry.phone} · {enquiry.email}
              </p>
            </div>
          </div>

          {isCommercialUseValue(enquiry.vesselUse) ? (
            <div className="mt-3">
              <p className="staff-label">Commercial / charter details</p>
              <p className="text-ink/80">
                {enquiry.operatingEntity || "Operating entity not given"}
                {enquiry.companyRegistration ? `, reg. ${enquiry.companyRegistration}` : ""}
              </p>
            </div>
          ) : null}

          {enquiry.crew.length > 0 ? (
            <div className="mt-3">
              <p className="staff-label">Crew and guests ({enquiry.crew.length})</p>
              <ul className="text-ink/80">
                {enquiry.crew.map((c, i) => (
                  <li key={i}>
                    {c.fullName || "Unnamed"}, {c.role || c.personType}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {enquiry.status === "new" ? (
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <label className="block text-sm">
                <span className="staff-label" id={`${rowId}-berth`}>
                  Assign berth
                </span>
                <BerthPicker
                  id={`${rowId}-berth`}
                  marinaId={enquiry.marinaId}
                  loa={enquiry.loa}
                  dateIso={enquiry.arrival}
                  value={berthId}
                  onChange={setBerthId}
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  const result = decideEnquiry(staffId, enquiry.id, "approve", { berthId });
                  setError(result.ok ? null : result.error);
                }}
                className="staff-btn staff-btn-primary"
              >
                Approve
              </button>
              <label className="block flex-1 text-sm">
                <span className="staff-label">Reason to decline (optional)</span>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="staff-field"
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  const result = decideEnquiry(staffId, enquiry.id, "decline", { reason });
                  setError(result.ok ? null : result.error);
                }}
                className="staff-btn staff-btn-danger"
              >
                Decline
              </button>
            </div>
          ) : (
            <p className="mt-4 text-ink/75">
              {enquiry.status === "approved"
                ? `Approved, berth ${enquiry.assignedBerthId}.`
                : `Declined${enquiry.decisionNote ? `: ${enquiry.decisionNote}` : "."}`}
            </p>
          )}
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

export default function EnquiryInbox() {
  const { user } = useAuth();
  const staffId = user?.id ?? null;
  const { value: enquiries, ready } = useMock(
    () => getEnquiries(staffId),
    NONE,
    staffId ?? ""
  );
  const [tab, setTab] = useState<EnquiryStatus | "all">("new");

  const filtered = tab === "all" ? enquiries : enquiries.filter((e) => e.status === tab);
  const counts = {
    new: enquiries.filter((e) => e.status === "new").length,
    approved: enquiries.filter((e) => e.status === "approved").length,
    declined: enquiries.filter((e) => e.status === "declined").length,
  };

  return (
    <div>
      <h1 className="type-heading type-h2 text-ink">Enquiries</h1>

      <div role="group" aria-label="Status" className="mt-3 inline-flex rounded-[3px] border border-ink/25 p-0.5 text-xs">
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            aria-pressed={tab === t.value}
            onClick={() => setTab(t.value)}
            className={`min-h-10 rounded-[2px] px-3 ${tab === t.value ? "bg-ink text-paper" : "text-ink/70"}`}
          >
            {t.label}
            {t.value !== "all" ? ` (${counts[t.value]})` : ""}
          </button>
        ))}
      </div>

      <ul className="mt-4 space-y-2">
        {filtered.map((e) => (
          <Row key={e.id} enquiry={e} staffId={staffId} />
        ))}
      </ul>

      {ready && filtered.length === 0 ? (
        <p className="staff-empty mt-4">
          {tab === "new" ? "No enquiries waiting for a decision." : "Nothing here yet."}
        </p>
      ) : null}
    </div>
  );
}
