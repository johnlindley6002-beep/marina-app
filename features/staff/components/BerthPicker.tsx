"use client";

import { useMemo } from "react";
import { getAllBerths } from "@/data/berths";
import { classifyBoatLength } from "@/data/marinas";
import { getBerthStatuses, useStaffData, type BerthOperationalInfo } from "@/lib/data";
import { useStaffText } from "./StaffLanguageProvider";

// Lists the berths modelled for the boat's class, each showing its status on
// the given date so staff do not pick an obviously bad one; the mock layer's
// own conflict check is still the real guard on submit. Some enquiries are
// larger than any class the schematic models yet (see the marina page's own
// map), so with no matching berths this falls back to a manual berth ID.
const NO_STATUSES: Record<string, BerthOperationalInfo> = {};

export default function BerthPicker({
  marinaId,
  loa,
  dateIso,
  value,
  onChange,
  id,
}: {
  marinaId: string;
  loa: string;
  dateIso: string;
  value: string;
  onChange: (berthId: string) => void;
  id?: string;
}) {
  const { s } = useStaffText();
  const berthClass = classifyBoatLength(Number(loa) || 0);
  const { value: statuses } = useStaffData(
    () => getBerthStatuses(marinaId, dateIso),
    NO_STATUSES,
    `${marinaId}|${dateIso}`
  );

  const options = useMemo(() => {
    if (!berthClass) return [];
    return getAllBerths()
      .filter((b) => b.sizeClass === berthClass)
      .map((b) => ({ id: b.id, status: statuses[b.id]?.status ?? "free" }))
      .sort((a, b) => {
        if (a.id === value) return -1;
        if (b.id === value) return 1;
        if ((a.status === "free") !== (b.status === "free")) {
          return a.status === "free" ? -1 : 1;
        }
        return a.id.localeCompare(b.id);
      });
  }, [statuses, berthClass, value]);

  if (options.length === 0) {
    return (
      <div>
        <p className="text-xs text-ink-muted">
          {berthClass ? s.picker.noClassBerths(berthClass) : s.picker.outsideClasses}{" "}
          {s.picker.manual}
        </p>
        <input
          id={id}
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          placeholder={s.picker.manualPlaceholder}
          className="staff-field mt-1 max-w-[10rem]"
        />
      </div>
    );
  }

  return (
    <select
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="staff-field max-w-[13rem]"
    >
      <option value="">{s.picker.choose}</option>
      {options.map((option) => (
        <option
          key={option.id}
          value={option.id}
          disabled={option.status !== "free" && option.id !== value}
        >
          {option.id}
          {option.status !== "free" ? ` (${s.status[option.status]})` : ""}
        </option>
      ))}
    </select>
  );
}
