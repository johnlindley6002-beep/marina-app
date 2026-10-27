"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatLongDate, todayIso } from "@/lib/dates";
import { listCustomers, type Customer, useStaffData } from "@/lib/data";
import { countExpiries } from "../../lib/expiry";
import SupabaseOnly from "../SupabaseOnly";
import { useStaffText } from "../StaffLanguageProvider";

const NONE: Customer[] = [];
type Tab = "holders" | "guests";

// Every date that can run out for a customer: documents and rights of use.
export function expiryDates(customer: Customer): (string | null)[] {
  return [
    ...customer.documents.map((d) => d.expiresOn),
    ...customer.contracts.map((c) => c.endsOn),
  ];
}

export function DocumentFlag({ customer }: { customer: Customer }) {
  const { s } = useStaffText();
  const c = s.customers;
  const { expired, soon } = countExpiries(expiryDates(customer), todayIso());
  if (expired === 0 && soon === 0) return <span className="text-ink-muted">{c.upToDate}</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {expired > 0 ? (
        <span className="staff-badge staff-badge-warn">{c.expiredCount(expired)}</span>
      ) : null}
      {soon > 0 ? (
        <span className="staff-badge staff-badge-accent">{c.expiringCount(soon)}</span>
      ) : null}
    </span>
  );
}

function Customers() {
  const { s, dateLocale } = useStaffText();
  const c = s.customers;
  const { value: customers, ready } = useStaffData(listCustomers, NONE);
  const [tab, setTab] = useState<Tab>("holders");
  const [q, setQ] = useState("");

  const shown = useMemo(() => {
    const query = q.trim().toLowerCase();
    return customers
      .filter((x) => (tab === "holders" ? x.kind === "berth_holder" : x.kind === "guest"))
      .filter(
        (x) =>
          query === "" ||
          [x.fullName, x.email, ...x.boats.map((b) => b.name)].some((v) =>
            v.toLowerCase().includes(query)
          )
      );
  }, [customers, tab, q]);

  return (
    <div>
      <h1 className="type-heading type-h2 text-ink">{c.title}</h1>

      <div className="mt-3 flex flex-wrap items-end gap-3">
        <div
          role="group"
          aria-label={c.tabsLabel}
          className="inline-flex rounded-md border border-ink/25 p-0.5 text-xs"
        >
          {(["holders", "guests"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={tab === value}
              onClick={() => setTab(value)}
              className={`min-h-10 rounded-sm px-3 ${tab === value ? "bg-ink text-paper" : "text-ink-muted"}`}
            >
              {c.tabs[value]}
            </button>
          ))}
        </div>
        <label className="w-full max-w-sm text-sm">
          <span className="staff-label">{c.search}</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="staff-field"
          />
        </label>
      </div>

      <div className="staff-table-wrap mt-4" tabIndex={0} role="region" aria-label={c.tabs[tab]}>
        <table className="staff-table w-full text-left text-sm">
          <thead>
            <tr>
              <th scope="col">{c.name}</th>
              <th scope="col">{c.boats}</th>
              <th scope="col">{tab === "holders" ? c.berth : c.lastVisit}</th>
              {tab === "holders" ? <th scope="col">{c.contractUntil}</th> : null}
              <th scope="col">{c.documents}</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((x) => {
              const contract = x.contracts[0];
              const stay = x.stays[0];
              return (
                <tr key={x.id}>
                  <td>
                    <Link
                      href={`/staff/customers/${x.id}`}
                      className="font-medium text-ink underline"
                    >
                      {x.fullName}
                    </Link>
                    {x.email ? (
                      <span className="block text-xs text-ink-muted">{x.email}</span>
                    ) : null}
                  </td>
                  <td>{x.boats.map((b) => b.name).join(", ")}</td>
                  {tab === "holders" ? (
                    <>
                      <td className="tabular">{contract?.berthCode ?? ""}</td>
                      <td className="tabular">
                        {contract ? formatLongDate(contract.endsOn, dateLocale) : ""}
                      </td>
                    </>
                  ) : (
                    <td className="tabular">
                      {stay ? formatLongDate(stay.arrival, dateLocale) : ""}
                    </td>
                  )}
                  <td>
                    <DocumentFlag customer={x} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {ready && shown.length === 0 ? <p className="staff-empty mt-4">{c.none}</p> : null}
    </div>
  );
}

// Berth holders and guests, with their boats, right of use and whether any
// document runs out within 30 days.
export default function CustomerList() {
  const { s } = useStaffText();
  return (
    <SupabaseOnly title={s.customers.title}>
      <Customers />
    </SupabaseOnly>
  );
}
