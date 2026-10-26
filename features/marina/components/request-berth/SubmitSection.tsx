"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";
import type { RequestBerthCtx } from "./useRequestBerthForm";

export default function SubmitSection({ ctx }: { ctx: RequestBerthCtx }) {
  const { errors, marina, planErrorLabels } = ctx;
  const { t } = useLanguage();
  const copy = t.enquiry.submit;
  return (
    <>
      {planErrorLabels.length > 0 ? (
        <p role="alert" tabIndex={-1} className="text-sm text-error">
          {copy.completePlan(planErrorLabels.join(copy.and))}{" "}
          <a href="#plan-your-stay" className="underline underline-offset-4">
            {copy.planLink}
          </a>
          .
        </p>
      ) : null}
      {errors.amperage ? (
        <p role="alert" className="text-sm text-error">
          {copy.chooseAmperage}{" "}
          <a href="#price-estimate" className="underline underline-offset-4">
            {copy.estimateLink}
          </a>
          .
        </p>
      ) : null}

      <div>
        <p className="field-label">{copy.cancellation}</p>
        <p className="mt-2 text-sm text-ink-soft">
          {marina.cancellationPolicy ?? copy.cancellationFallback}
        </p>
        <p className="mt-4 text-sm text-ink-soft">{t.stay.estimate.requestNote}</p>
        <p className="mt-2 text-sm text-ink-muted">
          {copy.goesToMarina}{" "}
          <a href="#privacy" className="underline underline-offset-4">
            {copy.privacyLink}
          </a>
          .
        </p>
        <button type="submit" className="btn-primary mt-6">
          {copy.send}
        </button>
      </div>
    </>
  );
}
