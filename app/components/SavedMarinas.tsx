"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  loadFavourites,
  toggleFavourite,
  TRIP_CHANGED_EVENT,
  type Favourite,
} from "../../lib/tripStore";
import { useLanguage } from "./LanguageProvider";

type Props = {
  // On the My boat page the list always shows, with an explanation when empty.
  showEmpty?: boolean;
  headingLevel?: "h2" | "h3";
};

export default function SavedMarinas({
  showEmpty = false,
  headingLevel = "h2",
}: Props) {
  const { t } = useLanguage();
  const [favourites, setFavourites] = useState<Favourite[]>([]);

  useEffect(() => {
    function refresh() {
      setFavourites(loadFavourites());
    }
    refresh();
    window.addEventListener(TRIP_CHANGED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(TRIP_CHANGED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  if (favourites.length === 0 && !showEmpty) return null;

  const Heading = headingLevel;

  return (
    <div className="chapter">
      <Heading className="type-heading type-h3 text-ink">
        {t.favourites.savedHeading}
      </Heading>

      {favourites.length === 0 ? (
        <p className="measure mt-3 text-ink/75">
          No saved marinas yet. Use &quot;Save marina&quot; on a marina page and
          it will appear here.
        </p>
      ) : (
        <ul className="mt-4">
          {favourites.map((favourite) => (
            <li
              key={favourite.marinaId}
              className="hairline-top flex flex-wrap items-center justify-between gap-x-6 text-sm first:border-t-0"
            >
              <Link
                href={`/marinas/${favourite.countrySlug}/${favourite.marinaId}`}
                className="inline-flex min-h-11 items-center text-base font-medium text-ink underline underline-offset-4"
              >
                {favourite.marinaName}
              </Link>
              <span className="flex flex-wrap items-center gap-x-4">
                <Link
                  href={`/marinas/${favourite.countrySlug}/${favourite.marinaId}#request-berth`}
                  className="btn-quiet"
                >
                  Start an enquiry
                </Link>
                <button
                  type="button"
                  onClick={() => toggleFavourite(favourite)}
                  className="inline-flex min-h-11 items-center text-ink/70 hover:text-error"
                >
                  Remove
                  <span className="sr-only"> {favourite.marinaName}</span>
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
