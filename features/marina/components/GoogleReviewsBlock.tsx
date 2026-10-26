"use client";

import type { Marina } from "@/data/marinas";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { INTL_LOCALES } from "@/lib/i18n/format";
import { getGoogleReviewsSummary } from "@/features/marina/lib/googleReviews";

// Real Google rating information, shown as information only. It renders
// nothing unless the marina has real values and enough reviews (see
// siteConfig.googleReviewsMinCount). No stars, no badges, no urgency.
export default function GoogleReviewsBlock({ marina }: { marina: Marina }) {
  const { t, locale } = useLanguage();
  const copy = t.marinaPage.reviews;
  const summary = getGoogleReviewsSummary(marina);
  if (!summary) return null;

  return (
    <div className="stack-lg">
      <hr className="mb-10 border-hairline" />
      <h3 className="type-heading type-h3 text-ink">{copy.heading}</h3>
      <p className="mt-4 text-ink">
        <span className="type-heading tabular text-3xl">
          {new Intl.NumberFormat(INTL_LOCALES[locale], {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          }).format(summary.rating)}
        </span>{" "}
        <span className="text-ink-soft">{copy.outOf(summary.reviewCount)}</span>
      </p>
      <a
        href={summary.googleUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-quiet mt-4"
      >
        {copy.read}
        <span className="sr-only"> {t.marinaPage.contact.opensInNewTab}</span>
      </a>
      <p className="mt-2 text-sm text-ink-muted">{copy.source}</p>
    </div>
  );
}
