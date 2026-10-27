"use client";

import Link from "next/link";
import { useMemo } from "react";
import { formatLongDate, todayIso } from "@/lib/dates";
import { getEnquiries, type Enquiry, useStaffData } from "@/lib/data";
import { formatLength } from "@/lib/units";
import { useUnits } from "@/components/providers/UnitsProvider";
import SupabaseOnly from "../SupabaseOnly";
import { useStaffId } from "../StaffSessionProvider";
import { useStaffText } from "../StaffLanguageProvider";

const NONE: Enquiry[] = [];

function BoatRow({ enquiry, departing }: { enquiry: Enquiry; departing: boolean }) {
  const { s } = useStaffText();
  const { units } = useUnits();
  const r = s.reception;
  return (
    <li className="staff-panel flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="font-medium text-ink">
          {enquiry.boatName || s.common.unnamedBoat}{" "}
          <span className="tabular text-xs font-normal text-ink-muted">
            {enquiry.assignedBerthId ? s.common.berthCode(enquiry.assignedBerthId) : ""}
          </span>
          {departing ? (
            <span className="staff-badge staff-badge-accent ml-2">{s.arrivals.departing}</span>
          ) : null}
        </p>
        <p className="tabular text-xs text-ink-muted">
          {formatLength(Number(enquiry.loa), units)} {s.common.loa} ·{" "}
          {r.eta(enquiry.eta || s.common.notGiven)} · {r.etd(enquiry.etd || s.common.notGiven)}
        </p>
      </div>
      <Link href={`/staff/reception/${enquiry.id}`} className="staff-btn staff-btn-primary">
        {r.open}
      </Link>
    </li>
  );
}

function Reception() {
  const staffId = useStaffId();
  const { s, dateLocale } = useStaffText();
  const r = s.reception;
  const { value: enquiries, ready } = useStaffData(
    () => getEnquiries(staffId),
    NONE,
    staffId ?? ""
  );
  const today = todayIso();

  const { arriving, onSite, departingCount } = useMemo(() => {
    const approved = enquiries.filter((e) => e.status === "approved");
    const here = approved.filter((e) => e.arrivalStatus === "arrived");
    return {
      arriving: approved.filter((e) => e.arrivalStatus === "pending" && e.arrival <= today),
      onSite: here,
      departingCount: here.filter((e) => !e.openEnded && e.departure <= today).length,
    };
  }, [enquiries, today]);

  return (
    <div>
      <h1 className="type-heading type-h2 text-ink">{r.title}</h1>
      <p className="mt-1 text-sm text-ink-muted">
        {formatLongDate(today, dateLocale)} · {r.intro}
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div className="staff-kpi">
          <p className="staff-kpi-value tabular">{arriving.length}</p>
          <p className="text-xs text-ink-muted">{r.kpiArriving}</p>
        </div>
        <div className="staff-kpi">
          <p className="staff-kpi-value tabular">{onSite.length}</p>
          <p className="text-xs text-ink-muted">{r.kpiOnSite}</p>
        </div>
        <div className="staff-kpi">
          <p className="staff-kpi-value tabular">{departingCount}</p>
          <p className="text-xs text-ink-muted">{r.kpiDeparting}</p>
        </div>
      </div>

      <section className="mt-6">
        <h2 className="type-heading type-h3 text-ink">{r.arriving}</h2>
        {arriving.length > 0 ? (
          <ul className="mt-2 space-y-2">
            {arriving.map((e) => (
              <BoatRow key={e.id} enquiry={e} departing={false} />
            ))}
          </ul>
        ) : (
          <p className="staff-empty mt-2">{ready ? r.noneArriving : ""}</p>
        )}
      </section>

      <section className="mt-6">
        <h2 className="type-heading type-h3 text-ink">{r.onSite}</h2>
        {onSite.length > 0 ? (
          <ul className="mt-2 space-y-2">
            {onSite.map((e) => (
              <BoatRow key={e.id} enquiry={e} departing={!e.openEnded && e.departure <= today} />
            ))}
          </ul>
        ) : (
          <p className="staff-empty mt-2">{ready ? r.noneOnSite : ""}</p>
        )}
      </section>
    </div>
  );
}

// Reception: who is arriving and who is on site today, each opening the
// check-in screen.
export default function ReceptionList() {
  const { s } = useStaffText();
  return (
    <SupabaseOnly title={s.reception.title}>
      <Reception />
    </SupabaseOnly>
  );
}
