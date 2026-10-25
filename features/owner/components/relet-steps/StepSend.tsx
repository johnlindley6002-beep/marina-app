"use client";

import { creditModelHeadline } from "@/data/marinas";
import { formatLongDate } from "@/lib/dates";
import { eur } from "@/lib/money";
import { copy } from "./shared";
import type { ReletScope } from "./ReletScope";

export default function StepSend({ scope }: { scope: ReletScope }) {
  const { startDate, endDate, nights, headingRef, terms, estimate, berth } = scope;
  return (
    <>
      <h2 ref={headingRef} tabIndex={-1} className="type-heading type-h2 text-ink outline-none">
        {copy.submitTitle}
      </h2>
      <dl className="mt-8 grid max-w-lg gap-x-8 gap-y-4 text-ink sm:grid-cols-[auto_1fr]">
        <dt className="text-ink-muted">Berth</dt>
        <dd>
          {berth.berthId}, {berth.marinaName}
        </dd>
        <dt className="text-ink-muted">Away</dt>
        <dd>
          {formatLongDate(startDate)} to {formatLongDate(endDate)} ({nights} nights)
        </dd>
        <dt className="text-ink-muted">Reletting</dt>
        <dd>The marina may relet it, with its approval</dd>
        <dt className="text-ink-muted">Terms</dt>
        <dd>
          {creditModelHeadline(terms.creditModel)} credit, {terms.processingFeePercent}% fee,{" "}
          {terms.settlement}
        </dd>
        {estimate ? (
          <>
            <dt className="text-ink-muted">Estimate</dt>
            <dd className="tabular">
              About {eur(estimate.netEur)} if every night were relet. The marina may relet only some
              of them.
            </dd>
          </>
        ) : null}
      </dl>
      <p className="measure mt-6 text-sm text-ink-muted">
        Sending this asks for the marina&apos;s consent. Nothing is relet until the marina approves.
      </p>
    </>
  );
}
