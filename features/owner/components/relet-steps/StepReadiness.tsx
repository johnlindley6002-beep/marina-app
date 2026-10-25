"use client";

import { formatLongDate } from "@/lib/dates";
import { copy, Check } from "./shared";
import type { ReletScope } from "./ReletScope";

export default function StepReadiness({ scope }: { scope: ReletScope }) {
  const { startDate, boatReady, setBoatReady, berthReady, setBerthReady, headingRef } = scope;
  return (
    <>
      <h2 ref={headingRef} tabIndex={-1} className="type-heading type-h2 text-ink outline-none">
        {copy.readinessTitle}
      </h2>
      <div className="mt-8 space-y-4">
        <Check checked={boatReady} onChange={setBoatReady}>
          {copy.readinessBoat.replace("the start date", formatLongDate(startDate))}
        </Check>
        <Check checked={berthReady} onChange={setBerthReady}>
          {copy.readinessBerth}
        </Check>
      </div>
      <p className="measure mt-8 text-ink-soft">{copy.readinessInsurance}</p>
    </>
  );
}
