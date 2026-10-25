"use client";

import Link from "next/link";
import Disclosure from "@/components/ui/Disclosure";
import { creditModelCaption, creditModelHeadline } from "@/data/marinas";
import { eur } from "@/lib/money";
import { siteConfig } from "@/data/site";
import { copy, Check } from "./shared";
import type { ReletScope } from "./ReletScope";

export default function StepTerms({ scope }: { scope: ReletScope }) {
  const { termsAccepted, setTermsAccepted, error, headingRef, terms, estimate } = scope;
  return (
    <>
      <h2 ref={headingRef} tabIndex={-1} className="type-heading type-h2 text-ink outline-none">
        {copy.termsTitle}
      </h2>
      <dl className="mt-8 grid max-w-md gap-6 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-ink-muted">Your credit</dt>
          <dd className="tabular mt-1 text-2xl font-medium text-ink">
            {creditModelHeadline(terms.creditModel)}
          </dd>
          <dd className="mt-1 text-sm text-ink-muted">{creditModelCaption(terms.creditModel)}</dd>
        </div>
        <div>
          <dt className="text-sm text-ink-muted">Marina processing fee</dt>
          <dd className="tabular mt-1 text-2xl font-medium text-ink">
            {terms.processingFeePercent}%
          </dd>
          <dd className="mt-1 text-sm text-ink-muted">taken from your share</dd>
        </div>
      </dl>
      <p className="measure mt-6 text-ink-soft">
        {terms.settlement === "credit"
          ? "This is a credit against your berth fees, not a payment to you."
          : "This is paid to you after the marina has processed it."}
      </p>
      {estimate ? (
        <p className="measure tabular mt-4 text-ink-soft">
          <span className="chip mr-2">Estimate</span> If every one of your {estimate.nights} nights
          were relet, about {eur(estimate.netEur)} would be{" "}
          {terms.settlement === "credit" ? "credited" : "paid"} after the fee. {copy.estimateNote}
        </p>
      ) : null}
      {siteConfig.mockMode ? (
        <p className="mt-3 text-sm text-ink-muted">{copy.placeholderNote}</p>
      ) : null}
      <Disclosure className="mt-2" label={copy.taxLabel} openLabel={copy.taxLabel}>
        <p className="measure pb-2 text-ink-soft">{terms.taxNote}</p>
      </Disclosure>
      {terms.mooringLetFeeSchedule.length > 0 ? (
        <Disclosure
          className="mt-2"
          label="If you arrange a paid let yourself"
          openLabel="If you arrange a paid let yourself"
        >
          <p className="measure pb-2 text-ink-soft">
            Letting your berth for payment outside the marina still needs its prior written
            authorisation, and is a different path from the one on this page. If authorised, the
            marina&apos;s own processing fee is{" "}
            {terms.mooringLetFeeSchedule
              .map((tier) => `€${tier.feeEur} up to ${tier.maxDays} days`)
              .join(", ")}{" "}
            (excl. VAT).
          </p>
        </Disclosure>
      ) : null}
      <div className="mt-6">
        <Check
          checked={termsAccepted}
          onChange={setTermsAccepted}
          invalid={!!error && !termsAccepted}
        >
          {copy.termsAccept}.{" "}
          <Link href={terms.termsHref} target="_blank" className="underline underline-offset-4">
            Read the full terms
            <span className="sr-only"> (opens in a new tab)</span>
          </Link>
        </Check>
      </div>
    </>
  );
}
