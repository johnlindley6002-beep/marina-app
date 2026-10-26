"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";
import type { RequestBerthCtx } from "./useRequestBerthForm";

export default function SummaryPanel({ ctx }: { ctx: RequestBerthCtx }) {
  const { copied, handleCopy, summary } = ctx;
  const { t } = useLanguage();
  const copy = t.enquiry.summary;
  return (
    <>
      {summary ? (
        <div className="mt-10 border-t border-hairline pt-8">
          <h3 className="type-heading type-h3 text-ink">{copy.heading}</h3>
          <p className="mt-2 text-xs text-ink-muted">{copy.note}</p>
          <pre className="mt-4 max-h-96 overflow-auto border border-hairline bg-paper-deep p-4 text-xs whitespace-pre-wrap text-ink-soft">
            {summary}
          </pre>
          <button type="button" onClick={handleCopy} className="btn-dark mt-4">
            {copied ? copy.copied : copy.copy}
          </button>
        </div>
      ) : null}
    </>
  );
}
