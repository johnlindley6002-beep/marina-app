"use client";

import Link from "next/link";
import { useLanguage } from "@/components/providers/LanguageProvider";
import type { RequestBerthCtx } from "./useRequestBerthForm";

export default function SummaryPanel({ ctx }: { ctx: RequestBerthCtx }) {
  const { accountMode, copied, handleCopy, mailtoHref, marina, sendState, summary } = ctx;
  const { t } = useLanguage();
  const copy = t.enquiry.summary;
  const request = t.accounts.request;
  return (
    <>
      {accountMode && sendState === "sent" ? (
        <div role="status" className="mt-10 border-t border-hairline pt-8">
          <h3 className="type-heading type-h3 text-ink">{request.sentTitle}</h3>
          <p className="measure mt-2 text-ink-soft">{request.sentBody(marina.name)}</p>
          <Link href="/my-arrivals" className="btn-primary mt-4">
            {request.viewArrivals}
          </Link>
        </div>
      ) : null}
      {summary ? (
        <div className="mt-10 border-t border-hairline pt-8">
          <h3 className="type-heading type-h3 text-ink">{copy.heading}</h3>
          <p className="mt-2 text-xs text-ink-muted">
            {accountMode ? request.summaryNote : copy.note}
          </p>
          <pre className="mt-4 max-h-96 overflow-auto border border-hairline bg-paper-deep p-4 text-xs whitespace-pre-wrap text-ink-soft">
            {summary}
          </pre>
          <button type="button" onClick={handleCopy} className="btn-dark mt-4">
            {copied ? copy.copied : copy.copy}
          </button>
          {accountMode && mailtoHref ? (
            <>
              <a href={mailtoHref} className="btn-quiet mt-4 ml-4">
                {request.emailToo}
              </a>
              <p className="mt-1 text-xs text-ink-muted">{request.emailTooNote}</p>
            </>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
