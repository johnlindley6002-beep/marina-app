import type { Marina } from "../../../../data/marinas";
import { getGoogleReviewsSummary } from "../../../../lib/googleReviews";

// Real Google rating information, shown as information only. It renders
// nothing unless the marina has real values and enough reviews (see
// siteConfig.googleReviewsMinCount). No stars, no badges, no urgency.
export default function GoogleReviewsBlock({ marina }: { marina: Marina }) {
  const summary = getGoogleReviewsSummary(marina);
  if (!summary) return null;

  return (
    <div className="hairline-top mt-12 pt-8">
      <h3 className="type-heading type-h3 text-ink">Google reviews</h3>
      <p className="mt-4 text-ink">
        <span className="type-heading tabular text-3xl">
          {summary.rating.toFixed(1)}
        </span>{" "}
        <span className="text-ink/75">
          out of 5, from {summary.reviewCount} Google reviews
        </span>
      </p>
      <a
        href={summary.googleUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex min-h-11 items-center text-ink underline decoration-brass decoration-2 underline-offset-[6px]"
      >
        Read reviews on Google
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
      <p className="mt-2 text-sm text-ink/70">
        Rating and review count from Google.
      </p>
    </div>
  );
}
