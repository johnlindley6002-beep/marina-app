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
        <span className="text-neutral-500">{"★".repeat(5 - full)}</span>
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
      <section className="bg-neutral-50 px-6 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-normal tracking-[0.25em] text-navy/60 uppercase">
            Ratings &amp; reviews
          </p>
          {reviews.isSample ? (
            <p
              role="note"
              className="mt-3 inline-block border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-normal text-amber-800"
            >
              Sample ratings and reviews — illustrative examples, not from real
              boaters yet.
            </p>
          ) : null}

          {badges.length > 0 ? (
            <ul className="mt-6 flex flex-wrap gap-3" aria-label="Awards and badges">
              {badges.map((badge) => (
                <li
                  key={badge.label}
                  className="rounded-full border border-navy/20 bg-white px-4 py-2 text-sm font-normal text-navy"
                >
                  {badge.label}
                  {badge.year ? ` ${badge.year}` : ""}
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-8 grid gap-8 md:grid-cols-[220px_1fr]">
            <div>
              <p className="text-4xl font-normal text-navy">
                {reviews.overall.toFixed(1)}
                <span className="text-lg font-light text-neutral-500"> / 5</span>
              </p>
              <p className="mt-1 text-lg">
                <Stars rating={reviews.overall} />
              </p>
              <p className="mt-1 text-sm font-light text-neutral-500">
                {reviews.count} review{reviews.count === 1 ? "" : "s"}
              </p>
            </div>

            <dl className="space-y-3">
              {categories.map((category) => (
                <div key={category}>
                  <div className="flex items-baseline justify-between text-sm">
                    <dt className="font-light text-neutral-600">
                      {REVIEW_CATEGORY_LABELS[category]}
                    </dt>
                    <dd className="font-normal text-navy">
                      {reviews.categories[category].toFixed(1)}
                    </dd>
                  </div>
                  <div
                    className="mt-1 h-1.5 w-full bg-neutral-200"
                    aria-hidden="true"
                  >
                    <div
                      className="h-full bg-navy-accent"
                      style={{
                        width: `${(reviews.categories[category] / 5) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </dl>
          </div>

          <ul className="mt-10 grid gap-4 md:grid-cols-2">
            {reviews.items.map((review) => (
              <li
                key={`${review.author}-${review.date}`}
                className="rounded-sm border border-neutral-200 bg-white p-6"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-normal text-navy">
                    {review.author}
                  </p>
                  <p className="text-xs font-light text-neutral-500">
                    <time dateTime={review.date}>{review.date}</time>
                  </p>
                </div>
                <p className="mt-1">
                  <Stars rating={review.rating} />
                </p>
                <p className="mt-3 text-sm leading-relaxed font-light text-neutral-600">
                  {review.text}
                </p>
                {review.response ? (
                  <p className="mt-4 border-l-2 border-navy/20 pl-3 text-sm font-light text-neutral-600">
                    <span className="font-normal text-navy">
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
          <p className="text-xs font-normal tracking-[0.25em] text-navy/60 uppercase">
            What&apos;s nearby
          </p>
          <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {nearby.map((place) => (
              <li key={place.name}>
                <h3 className="text-base font-normal text-navy">
                  {place.name}
                </h3>
                <p className="mt-1 text-sm leading-relaxed font-light text-neutral-600">
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
