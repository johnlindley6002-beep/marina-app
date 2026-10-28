"use client";

import { useState } from "react";
import { lateCheckIn, tonightMovements, useStaffData, type Movement } from "@/lib/data";
import { staffError } from "../../lib/errors";
import SupabaseOnly from "../SupabaseOnly";
import { useStaffText } from "../StaffLanguageProvider";
import { useStaffContext } from "./useDock";

const NONE: Movement[] = [];

function Row({ movement }: { movement: Movement }) {
  const { s } = useStaffText();
  const t = s.tonight;
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <li className="staff-panel text-base">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="tabular text-2xl font-semibold text-ink">{movement.time ?? t.noTime}</p>
        {movement.berthCode ? (
          <span className="staff-badge staff-badge-ink text-sm">
            {s.common.berthCode(movement.berthCode)}
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-lg font-medium text-ink">
        {movement.boatName || s.common.unnamedBoat}
      </p>
      {movement.lengthM !== null ? (
        <p className="tabular text-ink-soft">
          {s.jobs.size(
            String(movement.lengthM),
            movement.beamM === null ? "?" : String(movement.beamM)
          )}
        </p>
      ) : null}
      {movement.kind === "arrival" ? (
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            const result = await lateCheckIn(movement.arrivalId);
            setBusy(false);
            setError(result.ok ? "" : staffError(s, result.error));
          }}
          className="staff-btn staff-btn-primary mt-3 min-h-14 w-full text-lg"
        >
          {t.checkIn}
        </button>
      ) : null}
      {error ? (
        <p role="alert" className="field-error mt-2">
          {error}
        </p>
      ) : null}
    </li>
  );
}

function List() {
  const { s } = useStaffText();
  const t = s.tonight;
  const { marinaId } = useStaffContext();
  const { value, ready } = useStaffData(
    async () => (await tonightMovements(marinaId)) ?? NONE,
    NONE,
    marinaId
  );
  const arrivals = value.filter((m) => m.kind === "arrival");
  const departures = value.filter((m) => m.kind === "departure");

  return (
    <div className="mx-auto max-w-md">
      <h1 className="type-heading type-h2 text-ink">{t.title}</h1>
      {ready && value.length === 0 ? <p className="staff-empty mt-3">{t.none}</p> : null}
      {arrivals.length > 0 ? (
        <>
          <h2 className="type-heading type-h3 mt-4 text-ink">{t.arrivals}</h2>
          <ul className="mt-2 space-y-2">
            {arrivals.map((m) => (
              <Row key={m.arrivalId} movement={m} />
            ))}
          </ul>
        </>
      ) : null}
      {departures.length > 0 ? (
        <>
          <h2 className="type-heading type-h3 mt-6 text-ink">{t.departures}</h2>
          <ul className="mt-2 space-y-2">
            {departures.map((m) => (
              <Row key={m.arrivalId} movement={m} />
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}

// The night watch's list: boats still to arrive (with late check-in) and boats
// leaving early tomorrow. Boat, size and berth only.
export default function Tonight() {
  const { s } = useStaffText();
  return (
    <SupabaseOnly title={s.tonight.title}>
      <List />
    </SupabaseOnly>
  );
}
