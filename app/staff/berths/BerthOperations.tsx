"use client";

import { useMemo, useState } from "react";
import { getAllBerths } from "../../../data/berths";
import { marinas } from "../../../data/marinas";
import { formatLongDate, todayIso } from "../../../lib/formatDate";
import {
  clearBerthOutOfService,
  getBerthStatuses,
  getEnquiries,
  getMarinaBerthLinks,
  getOutOfServiceBerths,
  reassignEnquiryBerth,
  setBerthOutOfService,
  type Enquiry,
} from "../../../lib/mockData";
import { useMock } from "../../../lib/useMock";
import { useAuth } from "../../components/AuthProvider";
import BerthAvailabilityMap, {
  type StaffBerthInfo,
} from "../../marinas/[country]/[marina]/BerthAvailabilityMap";
import BerthPicker from "../BerthPicker";

const MARINA = marinas[0];
const NONE: Enquiry[] = [];

type PanelData = {
  berthId: string;
  sizeClass: string;
  info: StaffBerthInfo;
  enquiry: Enquiry | null;
};

export default function BerthOperations() {
  const { user } = useAuth();
  const staffId = user?.id ?? null;
  const [dateIso, setDateIso] = useState(todayIso());
  const [selectedBerthId, setSelectedBerthId] = useState<string | null>(null);
  const [oosReason, setOosReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [reassignTo, setReassignTo] = useState("");

  const { value: statuses } = useMock(
    () => getBerthStatuses(MARINA.id, dateIso),
    {},
    dateIso
  );
  const { value: enquiries } = useMock(
    () => getEnquiries(staffId),
    NONE,
    staffId ?? ""
  );
  const { value: oosMarks } = useMock(
    () => getOutOfServiceBerths(MARINA.id),
    [],
    ""
  );

  const allBerths = useMemo(() => getAllBerths(), []);
  const berthLinks = useMemo(() => getMarinaBerthLinks(MARINA.id), []);

  const panel: PanelData | null = useMemo(() => {
    if (!selectedBerthId) return null;
    const berth = allBerths.find((b) => b.id === selectedBerthId);
    if (!berth) return null;
    const info = statuses[selectedBerthId] ?? { status: "free" as const };
    const enquiry =
      info.enquiryId != null ? enquiries.find((e) => e.id === info.enquiryId) ?? null : null;
    return { berthId: berth.id, sizeClass: berth.sizeClass, info, enquiry };
  }, [selectedBerthId, allBerths, statuses, enquiries]);

  const link = panel ? berthLinks.find((l) => l.berthId === panel.berthId) : undefined;
  const isOos = panel ? oosMarks.some((m) => m.berthId === panel.berthId) : false;

  function selectBerth(berthId: string) {
    setSelectedBerthId(berthId);
    setError(null);
    setOosReason("");
    const info = statuses[berthId];
    setReassignTo(info?.enquiryId ? berthId : "");
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="type-heading type-h2 text-ink">Berth map</h1>
        <label className="flex items-center gap-2 text-sm">
          <span className="staff-label mb-0">Date</span>
          <input
            type="date"
            value={dateIso}
            onChange={(e) => {
              setDateIso(e.target.value);
              setSelectedBerthId(null);
            }}
            className="staff-field max-w-[10rem]"
          />
        </label>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="staff-panel">
          <BerthAvailabilityMap
            marinaName={MARINA.name}
            marinaEmail={MARINA.email}
            transientRates={MARINA.transientRates}
            vatRate={MARINA.vatRate}
            staffMode={{
              statuses,
              selectedBerthId,
              onBerthClick: selectBerth,
            }}
          />
        </div>

        <div className="staff-panel">
          {!panel ? (
            <p className="text-sm text-ink/70">Tap a berth on the map for its detail.</p>
          ) : (
            <div>
              <h2 className="type-heading type-h3 text-ink">Berth {panel.berthId}</h2>
              <p className="mt-1 text-sm text-ink/70">
                Class {panel.sizeClass} · {panel.info.detail}
              </p>

              {link ? (
                <div className="mt-3 text-sm">
                  <p className="staff-label">Held by</p>
                  <p className="text-ink">
                    {link.ownerName}, {link.boatOnFile.name}
                  </p>
                  <p className="text-xs text-ink/70">Linked {formatLongDate(link.linkedAt)}</p>
                </div>
              ) : null}

              {panel.enquiry ? (
                <div className="mt-3 text-sm">
                  <p className="staff-label">Visiting boat</p>
                  <p className="text-ink">{panel.enquiry.boatName}</p>
                  <p className="text-ink/70">
                    {panel.enquiry.arrival} to{" "}
                    {panel.enquiry.openEnded ? "open-ended" : panel.enquiry.departure}
                  </p>
                  <div className="mt-2">
                    <p className="staff-label">Reassign to</p>
                    <BerthPicker
                      marinaId={MARINA.id}
                      loa={panel.enquiry.loa}
                      dateIso={panel.enquiry.arrival}
                      value={reassignTo}
                      onChange={(id) => {
                        setReassignTo(id);
                        const result = reassignEnquiryBerth(staffId, panel.enquiry!.id, id);
                        if (result.ok) selectBerth(id);
                        setError(result.ok ? null : result.error);
                      }}
                    />
                  </div>
                </div>
              ) : null}

              <div className="mt-4 border-t border-hairline pt-3">
                {isOos ? (
                  <button
                    type="button"
                    onClick={() => {
                      const result = clearBerthOutOfService(staffId, MARINA.id, panel.berthId);
                      setError(result.ok ? null : result.error);
                    }}
                    className="staff-btn staff-btn-primary"
                  >
                    Return to service
                  </button>
                ) : panel.info.status === "free" || panel.info.status === "owner-away" ? (
                  <div>
                    <label className="block text-sm">
                      <span className="staff-label">Reason</span>
                      <input
                        type="text"
                        value={oosReason}
                        onChange={(e) => setOosReason(e.target.value)}
                        placeholder="e.g. pontoon repair"
                        className="staff-field"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const result = setBerthOutOfService(
                          staffId,
                          MARINA.id,
                          panel.berthId,
                          oosReason
                        );
                        setError(result.ok ? null : result.error);
                      }}
                      className="staff-btn staff-btn-danger mt-2"
                    >
                      Mark out of service
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-ink/70">
                    A berth in use cannot be marked out of service.
                  </p>
                )}
                {error ? (
                  <p role="alert" className="field-error mt-2">
                    {error}
                  </p>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
