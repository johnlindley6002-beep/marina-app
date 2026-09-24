import {
  REVIEW_CATEGORY_LABELS,
  type Marina,
  type ReviewCategory,
} from "../../../../data/marinas";
import WriteReviewButton from "./WriteReviewButton";

function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span className="inline-flex items-center gap-1">
      <span aria-hidden="true" className="text-amber-600">
        {"★".repeat(full)}
        <span className="text-ink/70">{"★".repeat(5 - full)}</span>
      </span>
      <span className="sr-only">Rated {rating} out of 5</span>
    </span>
  );
}

export default function TrustSection({ marina }: { marina: Marina }) {
  const { reviews, badges, nearby } = marina;
  const categories = Object.keys(reviews.categories) as ReviewCategory[];

  return (
    <>
      <section className="bg-paper-deep px-6 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="type-heading type-h2 text-ink">
            Ratings &amp; reviews
          </h2>
          {reviews.isSample ? (
            <p
              role="note"
              className="mt-3 inline-block border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800"
            >
              Sample ratings and reviews: illustrative examples, not from real boaters yet.
            </p>
          ) : null}

          {badges.length > 0 ? (
            <ul className="mt-6 flex flex-wrap gap-3" aria-label="Awards and badges">
              {badges.map((badge) => (
                <li
                  key={badge.label}
                  className="rounded-full border border-ink/20 bg-white px-4 py-2 text-sm font-medium text-ink"
                >
                  {badge.label}
                  {badge.year ? ` ${badge.year}` : ""}
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-8 grid gap-8 md:grid-cols-[220px_1fr]">
            <div>
              <p className="text-4xl font-medium text-ink">
                {reviews.overall.toFixed(1)}
                <span className="text-lg text-ink/70"> / 5</span>
              </p>
              <p className="mt-1 text-lg">
                <Stars rating={reviews.overall} />
              </p>
              <p className="mt-1 text-sm text-ink/70">
                {reviews.count} review{reviews.count === 1 ? "" : "s"}
              </p>
            </div>

            <dl className="space-y-3">
              {categories.map((category) => (
                <div key={category}>
                  <div className="flex items-baseline justify-between text-sm">
                    <dt className="text-ink/75">
                      {REVIEW_CATEGORY_LABELS[category]}
                    </dt>
                    <dd className="font-medium text-ink">
                      {reviews.categories[category].toFixed(1)}
                    </dd>
                  </div>
                  <div
                    className="mt-1 h-1.5 w-full bg-hairline"
                    aria-hidden="true"
                  >
                    <div
                      className="h-full bg-ink-2"
                      style={{
                        width: `${(reviews.categories[category] / 5) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </dl>
          </div>

          <ul className="mt-10 grid gap-x-12 gap-y-8 md:grid-cols-2">
            {reviews.items.map((review) => (
              <li
                key={`${review.author}-${review.date}`}
                className="hairline-top pt-6"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-ink">
                    {review.author}
                  </p>
                  <p className="text-xs text-ink/70">
                    <time dateTime={review.date}>{review.date}</time>
                  </p>
                </div>
                <p className="mt-1">
                  <Stars rating={review.rating} />
                </p>
                <p className="mt-3 text-sm leading-relaxed text-ink/75">
                  {review.text}
                </p>
                {review.response ? (
                  <p className="mt-4 border-l-2 border-ink/20 pl-3 text-sm text-ink/75">
                    <span className="font-medium text-ink">
                      Marina response:
                    </span>{" "}
                    {review.response}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <WriteReviewButton marina={marina} />
          </div>
        </div>
      </section>

      <section className="px-6 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="type-heading type-h2 text-ink">
            What&apos;s nearby
          </h2>
          <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {nearby.map((place) => (
              <li key={place.name}>
                <h3 className="text-base font-medium text-ink">
                  {place.name}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-ink/75">
                  {place.description}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
