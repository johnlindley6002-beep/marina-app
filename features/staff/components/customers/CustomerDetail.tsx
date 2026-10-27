"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { formatLongDate, todayIso } from "@/lib/dates";
import { getCustomer, useStaffData } from "@/lib/data";
import { expiryOf } from "../../lib/expiry";
import SupabaseOnly from "../SupabaseOnly";
import { useStaffText } from "../StaffLanguageProvider";
import { DocumentFlag } from "./CustomerList";

function ExpiryBadge({ date }: { date: string | null }) {
  const { s } = useStaffText();
  const x = s.customers.expiry;
  const e = expiryOf(date, todayIso());
  switch (e.state) {
    case "none":
      return <span className="text-ink-muted">{x.none}</span>;
    case "expired":
      return <span className="staff-badge staff-badge-warn">{x.expired}</span>;
    case "soon":
      return <span className="staff-badge staff-badge-accent">{x.soon(e.days)}</span>;
    case "valid":
      return <span className="text-ink-soft">{x.valid}</span>;
  }
}

function Table({ label, head, children }: { label: string; head: string[]; children: ReactNode }) {
  return (
    <div className="staff-table-wrap mt-2" tabIndex={0} role="region" aria-label={label}>
      <table className="staff-table w-full text-left text-sm">
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} scope="col">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Detail({ id }: { id: string }) {
  const { s, dateLocale } = useStaffText();
  const c = s.customers;
  const { value: customer, ready } = useStaffData(() => getCustomer(id), null, id);
  const day = (iso: string | null) => (iso ? formatLongDate(iso, dateLocale) : "");

  if (!ready) return <div className="min-h-[24rem]" aria-hidden="true" />;
  if (!customer) {
    return (
      <div>
        <Link href="/staff/customers" className="staff-btn staff-btn-ghost">
          {c.backToList}
        </Link>
        <p className="staff-empty mt-4">{c.notFound}</p>
      </div>
    );
  }

  return (
    <div>
      <Link href="/staff/customers" className="staff-btn staff-btn-ghost">
        {c.backToList}
      </Link>
      <h1 className="type-heading type-h2 mt-3 text-ink">{customer.fullName}</h1>
      <p className="mt-1 flex flex-wrap items-center gap-2 text-sm">
        <span className="staff-badge staff-badge-outline">{c.kind[customer.kind]}</span>
        <DocumentFlag customer={customer} />
      </p>

      <section className="staff-panel mt-4 text-sm" aria-labelledby="customer-contact">
        <h2 id="customer-contact" className="type-heading type-h3 text-ink">
          {c.contact}
        </h2>
        <p className="mt-1 text-ink">{customer.email || s.common.notGiven}</p>
        <p className="text-ink">{customer.phone || s.common.notGiven}</p>
        {customer.nationality ? (
          <p className="text-ink-soft">
            {c.nationality}: {customer.nationality}
          </p>
        ) : null}
      </section>

      <section className="mt-6" aria-labelledby="customer-boats">
        <h2 id="customer-boats" className="type-heading type-h3 text-ink">
          {c.boatsTitle}
        </h2>
        {customer.boats.length === 0 ? (
          <p className="staff-empty mt-2">{c.noBoats}</p>
        ) : (
          <Table
            label={c.boatsTitle}
            head={[
              c.name,
              c.boatType,
              c.lengthCol,
              c.beamCol,
              c.draftCol,
              c.flagCol,
              c.registrationCol,
            ]}
          >
            {customer.boats.map((b) => (
              <tr key={b.id}>
                <td className="font-medium">{b.name}</td>
                <td>{b.boatType}</td>
                <td className="tabular">{b.loa ? `${b.loa} m` : ""}</td>
                <td className="tabular">{b.beam ? `${b.beam} m` : ""}</td>
                <td className="tabular">{b.draft ? `${b.draft} m` : ""}</td>
                <td>{b.flagCountry}</td>
                <td className="tabular">{b.registration}</td>
              </tr>
            ))}
          </Table>
        )}
      </section>

      {customer.kind === "berth_holder" ? (
        <section className="mt-6" aria-labelledby="customer-contracts">
          <h2 id="customer-contracts" className="type-heading type-h3 text-ink">
            {c.contractsTitle}
          </h2>
          {customer.contracts.length === 0 ? (
            <p className="staff-empty mt-2">{c.noContracts}</p>
          ) : (
            <Table label={c.contractsTitle} head={[c.berth, c.boatCol, c.from, c.until, c.state]}>
              {customer.contracts.map((k) => (
                <tr key={k.id}>
                  <td className="tabular font-medium">{k.berthCode}</td>
                  <td>{k.boatName}</td>
                  <td className="tabular">{day(k.startsOn)}</td>
                  <td className="tabular">{day(k.endsOn)}</td>
                  <td>
                    <ExpiryBadge date={k.endsOn} />
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </section>
      ) : null}

      <section className="mt-6" aria-labelledby="customer-documents">
        <h2 id="customer-documents" className="type-heading type-h3 text-ink">
          {c.documentsTitle}
        </h2>
        {customer.documents.length === 0 ? (
          <p className="staff-empty mt-2">{c.noDocuments}</p>
        ) : (
          <Table
            label={c.documentsTitle}
            head={[c.docType, c.reference, c.boatCol, c.expires, c.state]}
          >
            {customer.documents.map((d) => (
              <tr key={d.id}>
                <td>{c.docKinds[d.kind as keyof typeof c.docKinds] ?? c.docKinds.other}</td>
                <td className="tabular">{d.reference}</td>
                <td>{d.boatName}</td>
                <td className="tabular">{day(d.expiresOn)}</td>
                <td>
                  <ExpiryBadge date={d.expiresOn} />
                </td>
              </tr>
            ))}
          </Table>
        )}
      </section>

      <section className="mt-6" aria-labelledby="customer-stays">
        <h2 id="customer-stays" className="type-heading type-h3 text-ink">
          {c.staysTitle}
        </h2>
        {customer.stays.length === 0 ? (
          <p className="staff-empty mt-2">{c.noStays}</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {customer.stays.map((st) => (
              <li
                key={st.id}
                className="staff-panel flex flex-wrap items-center justify-between gap-2 text-sm"
              >
                <span className="tabular text-ink">
                  {s.common.range(
                    day(st.arrival),
                    st.departure ? day(st.departure) : s.common.openEnded
                  )}
                  {st.berthCode ? ` · ${s.common.berthCode(st.berthCode)}` : ""}
                </span>
                <span className="flex items-center gap-2">
                  <span className="staff-badge staff-badge-outline">
                    {c.stayStatus[st.arrivalStatus]}
                  </span>
                  <Link href={`/staff/reception/${st.id}`} className="staff-btn">
                    {s.reception.open}
                  </Link>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

// One customer: contact, boats, right of use (for a berth holder), documents
// with their expiry, and their stays.
export default function CustomerDetail({ id }: { id: string }) {
  const { s } = useStaffText();
  return (
    <SupabaseOnly title={s.customers.title}>
      <Detail id={id} />
    </SupabaseOnly>
  );
}
