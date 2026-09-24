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

export default function SavedMarinas() {
  const { t } = useLanguage();
  const [favourites, setFavourites] = useState<Favourite[]>([]);

  useEffect(() => {
    function refresh() {
      setFavourites(loadFavourites());
    }
    refresh();
    window.addEventListener(TRIP_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(TRIP_CHANGED_EVENT, refresh);
  }, []);

  if (favourites.length === 0) return null;

  return (
    <div className="mt-12 hairline-top pt-6">
      <h2 className="type-heading text-xl text-ink">
        {t.favourites.savedHeading}
      </h2>
      <ul className="mt-4 space-y-3">
        {favourites.map((favourite) => (
          <li
            key={favourite.marinaId}
            className="flex flex-wrap items-center justify-between gap-3 text-sm"
          >
            <Link
              href={`/marinas/${favourite.countrySlug}/${favourite.marinaId}`}
              className="inline-flex min-h-11 items-center font-medium text-ink underline underline-offset-4"
            >
              {favourite.marinaName}
            </Link>
            <span className="flex items-center gap-4">
              <Link
                href={`/marinas/${favourite.countrySlug}/${favourite.marinaId}#request-berth`}
                className="inline-flex min-h-11 items-center text-ink hover:underline"
              >
                New enquiry
              </Link>
              <button
                type="button"
                onClick={() => toggleFavourite(favourite)}
                className="inline-flex min-h-11 items-center text-ink/70 hover:text-error"
              >
                Remove
              </button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
