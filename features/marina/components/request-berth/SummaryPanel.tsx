"use client";
import type { RequestBerthCtx } from "./useRequestBerthForm";

export default function SummaryPanel({ ctx }: { ctx: RequestBerthCtx }) {
  const { copied, handleCopy, summary } = ctx;
  return (
    <>
      {summary ? (
        <div className="mt-10 border-t border-hairline pt-8">
          <h3 className="type-heading type-h3 text-ink">Enquiry summary</h3>
          <p className="mt-2 text-xs text-ink/70">
            Your email app should have opened with this pre-filled. If it didn&apos;t, copy the text
            below and send it manually.
          </p>
          <pre className="mt-4 max-h-96 overflow-auto border border-hairline bg-paper-deep p-4 text-xs whitespace-pre-wrap text-ink/75">
            {summary}
          </pre>
          <button type="button" onClick={handleCopy} className="btn-dark mt-4">
            {copied ? "Copied" : "Copy to clipboard"}
          </button>
        </div>
      ) : null}
    </>
  );
}
