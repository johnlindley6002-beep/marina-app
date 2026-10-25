import { siteConfig } from "@/data/site";
import type { RequestBerthCtx } from "./useRequestBerthForm";

export default function SubmitSection({ ctx }: { ctx: RequestBerthCtx }) {
  const { errors, marina, planErrorLabels } = ctx;
  return (
    <>
      {planErrorLabels.length > 0 ? (
        <p role="alert" tabIndex={-1} className="text-sm text-error">
          Please complete {planErrorLabels.join(" and ")} in{" "}
          <a href="#plan-your-stay" className="underline underline-offset-4">
            Plan your stay
          </a>
          .
        </p>
      ) : null}
      {errors.amperage ? (
        <p role="alert" className="text-sm text-error">
          Choose a shore power amperage in{" "}
          <a href="#price-estimate" className="underline underline-offset-4">
            Price estimate &amp; extras
          </a>
          .
        </p>
      ) : null}

      <div>
        <p className="field-label">Cancellation policy</p>
        <p className="mt-2 text-sm text-ink-soft">
          {marina.cancellationPolicy ??
            "Cancellation terms are confirmed by the marina. Ask when they reply to your enquiry."}
        </p>
        <p className="mt-4 text-sm text-ink-soft">{siteConfig.decision.requestNote}</p>
        <p className="mt-2 text-sm text-ink-muted">
          Your details go only to the marina, by email.{" "}
          <a href="#privacy" className="underline underline-offset-4">
            Read the privacy note
          </a>
          .
        </p>
        <button type="submit" className="btn-primary mt-6">
          Send enquiry
        </button>
      </div>
    </>
  );
}
