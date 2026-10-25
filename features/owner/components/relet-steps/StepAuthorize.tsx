"use client";

import Disclosure from "@/components/ui/Disclosure";
import { copy, Check } from "./shared";
import type { ReletScope } from "./ReletScope";

export default function StepAuthorize({ scope }: { scope: ReletScope }) {
  const {
    consent,
    setConsent,
    outsideArrangementConfirmed,
    setOutsideArrangementConfirmed,
    headingRef,
    terms,
  } = scope;
  return (
    <>
      <h2 ref={headingRef} tabIndex={-1} className="type-heading type-h2 text-ink outline-none">
        {copy.authorizeTitle}
      </h2>
      <div className="mt-6 flex items-start gap-4">
        <button
          type="button"
          role="switch"
          aria-checked={consent}
          aria-labelledby="consent-label"
          onClick={() => setConsent((c) => !c)}
          className="flex h-11 w-14 shrink-0 items-center"
        >
          <span
            aria-hidden="true"
            className={`relative block h-8 w-14 rounded-full border transition-colors motion-reduce:transition-none ${
              consent ? "border-ink bg-ink" : "border-ink/40 bg-paper-deep"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full transition-transform motion-reduce:transition-none ${
                consent ? "translate-x-6 bg-paper" : "bg-white shadow-sm"
              }`}
            />
          </span>
        </button>
        <p id="consent-label" className="text-lg text-ink">
          {copy.authorizeToggle}
        </p>
      </div>
      <p className="measure mt-4 text-ink/75">{copy.authorizeLine}</p>
      <Disclosure
        className="mt-2"
        label={copy.authorizeWhyLabel}
        openLabel={copy.authorizeWhyLabel}
      >
        <p className="measure pb-2 text-ink/75">{copy.authorizeWhy}</p>
      </Disclosure>
      <div className="mt-6">
        <Check checked={outsideArrangementConfirmed} onChange={setOutsideArrangementConfirmed}>
          I will not arrange any paid use of my berth outside the marina.
        </Check>
      </div>
      <p className="measure mt-4 text-sm text-ink/70">{terms.noticeRuleNote}</p>
    </>
  );
}
