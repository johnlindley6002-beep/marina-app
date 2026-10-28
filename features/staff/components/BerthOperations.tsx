"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getAllBerths } from "@/data/berths";
import { getPrimaryMarina } from "@/data/marinas";
import { formatLongDate, todayIso } from "@/lib/dates";
import {
  clearBerthOutOfService,
  getBerthStatuses,
  getEnquiries,
  getMarinaBerthLinks,
  getOutOfServiceBerths,
  reassignEnquiryBerth,
  setBerthOutOfService,
  STAFF_DATA_SOURCE,
  suggestReleasedBerths,
  type BerthOperationalInfo,
  type Enquiry,
  type OutOfServiceMark,
  useStaffData,
} from "@/lib/data";
import { useStaffAction } from "../lib/useStaffAction";
import { useStaffId } from "./StaffSessionProvider";
import BerthAvailabilityMap, {
  type StaffBerthInfo,
} from "@/features/marina/components/BerthAvailabilityMap";
import BerthPicker from "./BerthPicker";
import { useStaffText } from "./StaffLanguageProvider";

const MARINA = getPrimaryMarina();
const NONE: Enquiry[] = [];
const NO_MARKS: OutOfServiceMark[] = [];
const NO_STATUSES: Record<string, BerthOperationalInfo> = {};
const NO_LINKS: Awaited<ReturnType<typeof getMarinaBerthLinks>> = [];

type PanelData = {
  berthId: string;
  sizeClass: string;
  info: StaffBerthInfo;
  enquiry: Enquiry | null;
};

export default function BerthOperations() {
  const staffId = useStaffId();
  const { s, dateLocale } = useStaffText();
  const b = s.berthMap;
  const [dateIso, setDateIso] = useState(todayIso());
  const [selectedBerthId, setSelectedBerthId] = useState<string | null>(null);
  const [oosReason, setOosReason] = useState("");
  const { busy, error, setError, run } = useStaffAction();
  const [reassignTo, setReassignTo] = useState("");

  const { value: statuses } = useStaffData(
    () => getBerthStatuses(MARINA.id, dateIso),
    NO_STATUSES,
    dateIso
  );
  const { value: enquiries } = useStaffData(() => getEnquiries(staffId), NONE, staffId ?? "");
  const { value: oosMarks } = useStaffData(() => getOutOfServiceBerths(MARINA.id), NO_MARKS);

  const allBerths = useMemo(() => getAllBerths(), []);
  const { value: berthLinks } = useStaffData(() => getMarinaBerthLinks(MARINA.id), NO_LINKS);

  const panel: PanelData | null = useMemo(() => {
    if (!selectedBerthId) return null;
    const berth = allBerths.find((b) => b.id === selectedBerthId);
    if (!berth) return null;
    const info: BerthOperationalInfo = statuses[selectedBerthId] ?? { status: "free", detail: "" };
    const enquiry =
      info.enquiryId != null ? (enquiries.find((e) => e.id === info.enquiryId) ?? null) : null;
    return { berthId: berth.id, sizeClass: berth.sizeClass, info, enquiry };
  }, [selectedBerthId, allBerths, statuses, enquiries]);

  const link = panel ? berthLinks.find((l) => l.berthId === panel.berthId) : undefined;
  const isOos = panel ? oosMarks.some((m) => m.berthId === panel.berthId) : false;

  // Released holder berths that would take the selected guest boat.
  const guest = panel?.enquiry ?? null;
  const { value: suggestions } = useStaffData(
    () =>
      guest
        ? suggestReleasedBerths(
            MARINA.id,
            { loa: Number(guest.loa) || 0, beam: 0 },
            {
              arrival: guest.arrival,
              departure: guest.openEnded ? guest.arrival : guest.departure,
            }
          )
        : Promise.resolve([]),
    [],
    guest ? `${guest.id}|${guest.arrival}|${guest.departure}` : ""
  );

  async function reassign(enquiryId: string, berthId: string) {
    setReassignTo(berthId);
    if (await run(() => reassignEnquiryBerth(staffId, enquiryId, berthId))) selectBerth(berthId);
  }

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
        <h1 className="type-heading type-h2 text-ink">{b.title}</h1>
        <label className="flex items-center gap-2 text-sm">
          <span className="staff-label mb-0">{b.date}</span>
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
            <p className="text-sm text-ink-muted">{b.tapBerth}</p>
          ) : (
            <div>
              <h2 className="type-heading type-h3 text-ink">{s.common.berthCode(panel.berthId)}</h2>
              {STAFF_DATA_SOURCE === "supabase" ? (
                <Link
                  href={`/staff/berths/${encodeURIComponent(panel.berthId)}`}
                  className="mt-1 inline-block text-sm underline underline-offset-4"
                >
                  {s.berthPage.open}
                </Link>
              ) : null}
              <p className="mt-1 text-sm text-ink-muted">
                {s.common.classLabel(panel.sizeClass)} · {s.status[panel.info.status]}
                {panel.info.detail ? ` · ${panel.info.detail}` : ""}
              </p>

              {link ? (
                <div className="mt-3 text-sm">
                  <p className="staff-label">{b.heldBy}</p>
                  <p className="text-ink">
                    {link.ownerName}
                    {link.boatOnFile.name ? `, ${link.boatOnFile.name}` : ""}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {b.linked(formatLongDate(link.linkedAt, dateLocale))}
                  </p>
                </div>
              ) : null}

              {panel.enquiry ? (
                <div className="mt-3 text-sm">
                  <p className="staff-label">{b.guestBoat}</p>
                  <p className="text-ink">{panel.enquiry.boatName}</p>
                  <p className="text-ink-muted">
                    {s.common.range(
                      panel.enquiry.arrival,
                      panel.enquiry.openEnded ? s.common.openEnded : panel.enquiry.departure
                    )}
                  </p>
                  {suggestions.length > 0 ? (
                    <div className="mt-2">
                      <p className="staff-label">{b.suggested}</p>
                      <ul className="flex flex-wrap gap-1.5">
                        {suggestions.map((sug) => (
                          <li key={sug.berthId}>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void reassign(panel.enquiry!.id, sug.berthId)}
                              className="staff-btn text-xs"
                            >
                              {b.suggestion(sug.berthId, sug.sizeClass, sug.ownerName)}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  <div className="mt-2">
                    <p className="staff-label">{b.reassignTo}</p>
                    <BerthPicker
                      marinaId={MARINA.id}
                      loa={panel.enquiry.loa}
                      dateIso={panel.enquiry.arrival}
                      value={reassignTo}
                      onChange={(id) => void reassign(panel.enquiry!.id, id)}
                    />
                  </div>
                </div>
              ) : null}

              <div className="mt-4 border-t border-hairline pt-3">
                {isOos ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void run(() => clearBerthOutOfService(staffId, MARINA.id, panel.berthId))
                    }
                    className="staff-btn staff-btn-primary"
                  >
                    {b.returnToService}
                  </button>
                ) : panel.info.status === "free" ||
                  panel.info.status === "owner-away" ||
                  panel.info.status === "released" ? (
                  <div>
                    <label className="block text-sm">
                      <span className="staff-label">{b.reason}</span>
                      <input
                        type="text"
                        value={oosReason}
                        onChange={(e) => setOosReason(e.target.value)}
                        placeholder={b.reasonPlaceholder}
                        className="staff-field"
                      />
                    </label>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        void run(() =>
                          setBerthOutOfService(staffId, MARINA.id, panel.berthId, oosReason)
                        )
                      }
                      className="staff-btn staff-btn-danger mt-2"
                    >
                      {b.markOutOfService}
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-ink-muted">{b.inUse}</p>
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
