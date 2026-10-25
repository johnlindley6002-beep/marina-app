"use client";

import { copy, inputClass, labelClass, Check } from "./shared";
import type { ReletScope } from "./ReletScope";

export default function StepAbsence({ scope }: { scope: ReletScope }) {
  const {
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    nights,
    today,
    boatRemoval,
    setBoatRemoval,
    headingRef,
  } = scope;
  return (
    <>
      <h2 ref={headingRef} tabIndex={-1} className="type-heading type-h2 text-ink outline-none">
        {copy.absenceTitle}
      </h2>
      <p className="measure mt-3 text-ink/75">{copy.absenceBody}</p>
      <div className="mt-8 grid max-w-md gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className={labelClass}>I leave on</span>
          <input
            type="date"
            value={startDate}
            min={today}
            onChange={(e) => setStartDate(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block text-sm">
          <span className={labelClass}>I return on</span>
          <input
            type="date"
            value={endDate}
            min={startDate || today}
            onChange={(e) => setEndDate(e.target.value)}
            className={inputClass}
          />
        </label>
      </div>
      <p className="mt-3 min-h-6 text-sm text-ink/75" aria-live="polite">
        {nights > 0 ? `${nights} night${nights === 1 ? "" : "s"} away.` : ""}
      </p>
      <div className="mt-4">
        <Check checked={boatRemoval} onChange={setBoatRemoval}>
          {copy.absenceConfirm}
        </Check>
      </div>
    </>
  );
}
