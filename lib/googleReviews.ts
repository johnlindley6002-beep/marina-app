import { siteConfig } from "../data/site";
import type { Marina } from "../data/marinas";

export type GoogleReviewsSummary = {
  rating: number;
  reviewCount: number;
  googleUrl: string;
};

// Returns the summary only when every value is real and the review count
// meets the configured minimum. Anything less returns null, so no partial
// or padded rating is ever shown.
export function getGoogleReviewsSummary(
  marina: Marina
): GoogleReviewsSummary | null {
  const { rating, reviewCount, googleUrl } = marina.googleReviews;
  if (rating === null || reviewCount === null || !googleUrl) return null;
  if (!(rating > 0 && rating <= 5)) return null;
  if (reviewCount < siteConfig.googleReviewsMinCount) return null;
  return { rating, reviewCount, googleUrl };
}

// TODO (future): live data.
// The Google Places API needs a key, so it must never be called from the
// browser. When live reviews are wanted, add a serverless function (for
// example a Next.js route handler at /api/google-reviews) that:
//   1. reads GOOGLE_PLACES_API_KEY from a server-only environment variable
//      (never a NEXT_PUBLIC_ variable, never committed);
//   2. calls the Places API (Place Details, fields rating and
//      userRatingCount) for the marina's place id;
//   3. caches the response for at least an hour and returns only
//      { rating, reviewCount } to the page;
// then have this file call that endpoint instead of reading marina data.
// The "Powered by Google" attribution required for API data must be shown
// with it, using Google's official brand assets.
