"use client";

import { useState } from "react";
import { formatLongDate } from "@/lib/dates";
import { getEnquiries, type Enquiry, type EnquiryStatus, useStaffData } from "@/lib/data";
import { formatLength } from "@/lib/units";
import { useStaffId } from "./StaffSessionProvider";
import { Collapse } from "@/components/ui/Disclosure";
import { useUnits } from "@/components/providers/UnitsProvider";
import RequestActions from "./RequestActions";
import { useStaffText } from "./StaffLanguageProvider";

const NONE: Enquiry[] = [];

function isCommercialUseValue(vesselUse: string): boolean {
  return vesselUse !== "" && vesselUse !== "private";
}

const STATUS_TABS: (EnquiryStatus | "all")[] = [
  "new",
  "dates_proposed",
  "approved",
  "declined",
  "all",
];

function EuFlag({ enquiry }: { enquiry: Enquiry }) {
  const { s } = useStaffText();
  if (!enquiry.euStatus) return null;
  return (
    <span className="staff-chip">
      {enquiry.euStatus === "yes" ? s.enquiries.euFlagged : s.enquiries.nonEu}
    </span>
  );
}

export function EnquiryRow({ enquiry, staffId }: { enquiry: Enquiry; staffId: string | null }) {
  const { units } = useUnits();
  const { s, dateLocale } = useStaffText();
  const q = s.enquiries;
  const [open, setOpen] = useState(false);
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
            {enquiry.boatName || s.common.unnamedBoat}
            <span
              className={`staff-badge ${
                enquiry.status === "new"
                  ? "staff-badge-accent"
                  : enquiry.status === "approved"
                    ? "staff-badge-ink"
                    : "staff-badge-warn"
              }`}
            >
              {q.tabs[enquiry.status]}
            </span>
            {isCommercialUseValue(enquiry.vesselUse) ? (
              <span className="staff-chip">{enquiry.vesselUse}</span>
            ) : null}
            <EuFlag enquiry={enquiry} />
          </p>
          <p className="tabular mt-1 text-xs text-ink-muted">
            {formatLength(Number(enquiry.loa), units)} {s.common.loa} ·{" "}
            {s.common.range(
              enquiry.arrival,
              enquiry.openEnded ? s.common.openEnded : enquiry.departure
            )}{" "}
            · {enquiry.skipperName || q.noName}
          </p>
        </div>
        <p className="text-xs text-ink-muted">
          {q.sent(formatLongDate(enquiry.createdAt, dateLocale))}
        </p>
      </button>

      <Collapse open={open} id={rowId}>
        <div className="mt-3 border-t border-hairline pt-3 text-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="staff-label">{q.boat}</p>
              <p className="text-ink">
                {enquiry.vesselType}, {formatLength(Number(enquiry.loa), units)} {s.common.loa},{" "}
                {formatLength(Number(enquiry.beam), units)} {s.common.beam},{" "}
                {formatLength(Number(enquiry.draft), units)} {s.common.draft}, {enquiry.flagCountry}
              </p>
            </div>
            <div>
              <p className="staff-label">{q.contact}</p>
              <p className="text-ink">{enquiry.skipperName}</p>
              <p className="text-ink-muted">
                {enquiry.phone} · {enquiry.email}
              </p>
            </div>
          </div>

          {isCommercialUseValue(enquiry.vesselUse) ? (
            <div className="mt-3">
              <p className="staff-label">{q.commercial}</p>
              <p className="text-ink-soft">
                {enquiry.operatingEntity || q.noEntity}
                {enquiry.companyRegistration ? q.registration(enquiry.companyRegistration) : ""}
              </p>
            </div>
          ) : null}

          {enquiry.crew.length > 0 ? (
            <div className="mt-3">
              <p className="staff-label">{s.arrivals.crew(enquiry.crew.length)}</p>
              <ul className="text-ink-soft">
                {enquiry.crew.map((c, i) => (
                  <li key={i}>
                    {c.fullName || s.common.unnamed}, {c.role || c.personType}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {enquiry.status === "new" || enquiry.status === "dates_proposed" ? (
            <RequestActions enquiry={enquiry} staffId={staffId} />
          ) : (
            <p className="mt-4 text-ink-soft">
              {enquiry.status === "approved"
                ? q.approvedOn(enquiry.assignedBerthId ?? "")
                : q.declinedWith(enquiry.decisionNote)}
            </p>
          )}
        </div>
      </Collapse>
    </li>
  );
}

export default function EnquiryInbox() {
  const staffId = useStaffId();
  const { value: enquiries, ready } = useStaffData(
    () => getEnquiries(staffId),
    NONE,
    staffId ?? ""
  );
  const [tab, setTab] = useState<EnquiryStatus | "all">("new");
  const { s } = useStaffText();
  const q = s.enquiries;

  const filtered = tab === "all" ? enquiries : enquiries.filter((e) => e.status === tab);
  const counts = {
    new: enquiries.filter((e) => e.status === "new").length,
    approved: enquiries.filter((e) => e.status === "approved").length,
    declined: enquiries.filter((e) => e.status === "declined").length,
    dates_proposed: enquiries.filter((e) => e.status === "dates_proposed").length,
  };

  return (
    <div>
      <h1 className="type-heading type-h2 text-ink">{q.title}</h1>

      <div
        role="group"
        aria-label={q.statusGroup}
        className="mt-3 inline-flex rounded-md border border-ink/25 p-0.5 text-xs"
      >
        {STATUS_TABS.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={tab === value}
            onClick={() => setTab(value)}
            className={`min-h-10 rounded-sm px-3 ${tab === value ? "bg-ink text-paper" : "text-ink-muted"}`}
          >
            {q.tabs[value]}
            {value !== "all" ? ` (${counts[value]})` : ""}
          </button>
        ))}
      </div>

      <ul className="mt-4 space-y-2">
        {filtered.map((e) => (
          <EnquiryRow key={e.id} enquiry={e} staffId={staffId} />
        ))}
      </ul>

      {ready && filtered.length === 0 ? (
        <p className="staff-empty mt-4">{tab === "new" ? q.emptyNew : q.emptyOther}</p>
      ) : null}
    </div>
  );
}
