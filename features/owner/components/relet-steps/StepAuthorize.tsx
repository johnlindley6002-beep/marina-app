"use client";

import Disclosure from "@/components/ui/Disclosure";
import { copy, Check } from "./shared";
import Toggle from "@/components/ui/Toggle";
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
        <Toggle checked={consent} onChange={setConsent} labelledBy="consent-label" />
        <p id="consent-label" className="text-lg text-ink">
          {copy.authorizeToggle}
        </p>
      </div>
      <p className="measure mt-4 text-ink-soft">{copy.authorizeLine}</p>
      <Disclosure
        className="mt-2"
        label={copy.authorizeWhyLabel}
        openLabel={copy.authorizeWhyLabel}
      >
        <p className="measure pb-2 text-ink-soft">{copy.authorizeWhy}</p>
      </Disclosure>
      <div className="mt-6">
        <Check checked={outsideArrangementConfirmed} onChange={setOutsideArrangementConfirmed}>
          I will not arrange any paid use of my berth outside the marina.
        </Check>
      </div>
      <p className="measure mt-4 text-sm text-ink-muted">{terms.noticeRuleNote}</p>
    </>
  );
}
