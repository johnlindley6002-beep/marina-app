"use client";

import { useMemo, useState } from "react";
import { getAllBerths } from "../../../data/berths";
import { marinas } from "../../../data/marinas";
import { todayIso } from "../../../lib/formatDate";
import {
  getBerthStatuses,
  getEnquiries,
  getMarinaBerthLinks,
  type Enquiry,
} from "../../../lib/mockData";
import { formatLength } from "../../../lib/units";
import { useMock } from "../../../lib/useMock";
import { useAuth } from "../../components/AuthProvider";
import { STAFF_STATUS_LABEL } from "../../marinas/[country]/[marina]/BerthAvailabilityMap";
import { useUnits } from "../../components/UnitsProvider";

const MARINA = marinas[0];
const NONE: Enquiry[] = [];
const TABS = ["Boats", "Berths", "Customers"] as const;
type Tab = (typeof TABS)[number];

export default function RecordsBrowser() {
  const { user } = useAuth();
  const staffId = user?.id ?? null;
  const { units } = useUnits();
  const [tab, setTab] = useState<Tab>("Boats");
  const [q, setQ] = useState("");

  const { value: enquiries } = useMock(() => getEnquiries(staffId), NONE, staffId ?? "");
  const links = useMemo(() => getMarinaBerthLinks(MARINA.id), []);
  const { value: statuses } = useMock(
    () => getBerthStatuses(MARINA.id, todayIso()),
    {},
    ""
  );
  const berths = useMemo(() => getAllBerths(), []);

  const query = q.trim().toLowerCase();
  const matches = (...values: string[]) =>
    query === "" || values.some((v) => v.toLowerCase().includes(query));

  const boatRows = useMemo(() => {
    const owned = links.map((l) => ({
      key: `owned-${l.berthId}`,
      name: l.boatOnFile.name,
      type: l.boatOnFile.type,
      loa: l.boatOnFile.loa,
      flag: l.boatOnFile.flag,
      person: l.ownerName,
      berthId: l.berthId,
      kind: "Berth holder",
    }));
    const transient = enquiries
      .filter((e) => e.status === "approved")
      .map((e) => ({
        key: `enq-${e.id}`,
        name: e.boatName,
        type: e.vesselType,
        loa: e.loa,
        flag: e.flagCountry,
        person: e.skipperName,
        berthId: e.assignedBerthId ?? "unassigned",
        kind: "Visiting",
      }));
    return [...owned, ...transient].filter((r) =>
      matches(r.name, r.person, r.berthId)
    );
  }, [links, enquiries, query]);

  const berthRows = useMemo(
    () =>
      berths
        .map((b) => ({
          id: b.id,
          sizeClass: b.sizeClass,
          status: statuses[b.id]?.status ?? "free",
          detail: statuses[b.id]?.detail ?? "",
        }))
        .filter((r) => matches(r.id, r.sizeClass)),
    [berths, statuses, query]
  );

  const customerRows = useMemo(() => {
    const owners = links.map((l) => ({
      key: `owner-${l.berthId}`,
      name: l.ownerName,
      contact: "",
      boat: l.boatOnFile.name,
      kind: "Berth holder",
    }));
    const skippers = enquiries
      .filter((e) => e.skipperName)
      .map((e) => ({
        key: `skipper-${e.id}`,
        name: e.skipperName,
        contact: [e.phone, e.email].filter(Boolean).join(" · "),
        boat: e.boatName,
        kind: "Enquiry contact",
      }));
    return [...owners, ...skippers].filter((r) => matches(r.name, r.boat));
  }, [links, enquiries, query]);

  return (
    <div>
      <h1 className="type-heading type-h2 text-ink">Records</h1>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Records type" className="inline-flex rounded-[3px] border border-ink/25 p-0.5 text-xs">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={tab === t}
              onClick={() => setTab(t)}
              className={`min-h-10 rounded-[2px] px-3 ${tab === t ? "bg-ink text-paper" : "text-ink/70"}`}
            >
              {t}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Search ${tab.toLowerCase()}…`}
          className="staff-field max-w-xs"
          aria-label={`Search ${tab.toLowerCase()}`}
        />
      </div>

      <div className="staff-table-wrap mt-4">
        {tab === "Boats" ? (
          <table className="staff-table">
            <thead>
              <tr>
                <th scope="col">Boat</th>
                <th scope="col">Type</th>
                <th scope="col">LOA</th>
                <th scope="col">Flag</th>
                <th scope="col">Person</th>
                <th scope="col">Berth</th>
                <th scope="col">Kind</th>
              </tr>
            </thead>
            <tbody>
              {boatRows.map((r) => (
                <tr key={r.key}>
                  <td className="font-medium text-ink">{r.name || "Unnamed"}</td>
                  <td>{r.type}</td>
                  <td className="tabular">{formatLength(Number(r.loa) || 0, units)}</td>
                  <td>{r.flag}</td>
                  <td>{r.person}</td>
                  <td className="tabular">{r.berthId}</td>
                  <td>{r.kind}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}

        {tab === "Berths" ? (
          <table className="staff-table">
            <thead>
              <tr>
                <th scope="col">Berth</th>
                <th scope="col">Class</th>
                <th scope="col">Status</th>
                <th scope="col">Detail</th>
              </tr>
            </thead>
            <tbody>
              {berthRows.map((r) => (
                <tr key={r.id}>
                  <td className="tabular font-medium text-ink">{r.id}</td>
                  <td>{r.sizeClass}</td>
                  <td>{STAFF_STATUS_LABEL[r.status]}</td>
                  <td className="text-ink/70">{r.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}

        {tab === "Customers" ? (
          <table className="staff-table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Contact</th>
                <th scope="col">Boat</th>
                <th scope="col">Kind</th>
              </tr>
            </thead>
            <tbody>
              {customerRows.map((r) => (
                <tr key={r.key}>
                  <td className="font-medium text-ink">{r.name}</td>
                  <td className="text-ink/70">{r.contact}</td>
                  <td>{r.boat}</td>
                  <td>{r.kind}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>

      {(tab === "Boats" && boatRows.length === 0) ||
      (tab === "Berths" && berthRows.length === 0) ||
      (tab === "Customers" && customerRows.length === 0) ? (
        <p className="staff-empty mt-4">No {tab.toLowerCase()} match.</p>
      ) : null}
    </div>
  );
}
