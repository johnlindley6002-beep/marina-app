"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/components/providers/LanguageProvider";
import type { RequestBerthCtx } from "./useRequestBerthForm";

export default function SubmitSection({ ctx }: { ctx: RequestBerthCtx }) {
  const { accountMode, errors, marina, needsSignIn, planErrorLabels, sendError, sendState } = ctx;
  const { t } = useLanguage();
  const pathname = usePathname();
  const copy = t.enquiry.submit;
  const request = t.accounts.request;
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
        <p className="mt-4 text-sm text-ink-soft">
          {accountMode ? request.note : t.stay.estimate.requestNote}
        </p>
        <p className="mt-2 text-sm text-ink-muted">
          {accountMode ? request.goesToMarina : copy.goesToMarina}{" "}
          <a href="#privacy" className="underline underline-offset-4">
            {copy.privacyLink}
          </a>
          .
        </p>
        {needsSignIn ? (
          <div role="alert" className="mt-6 border-l-2 border-error pl-3">
            <p className="font-medium text-ink">{request.signInTitle}</p>
            <p className="measure mt-1 text-sm text-ink-soft">{request.signInBody}</p>
            <Link
              href={`/login?next=${encodeURIComponent(`${pathname}#request-berth`)}`}
              className="btn-primary mt-3"
            >
              {request.signInLink}
            </Link>
          </div>
        ) : null}
        {sendError ? (
          <p role="alert" className="mt-4 text-sm text-error">
            {sendError}
          </p>
        ) : null}
        <button type="submit" disabled={sendState === "sending"} className="btn-primary mt-6">
          {accountMode ? (sendState === "sending" ? request.sending : request.send) : copy.send}
        </button>
      </div>
    </>
  );
}
