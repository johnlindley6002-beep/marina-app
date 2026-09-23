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
    <div className="mt-12 border border-neutral-200 bg-white p-6">
      <h2 className="text-xs font-normal tracking-[0.25em] text-navy/60 uppercase">
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
              className="font-normal text-navy underline underline-offset-4"
            >
              {favourite.marinaName}
            </Link>
            <span className="flex items-center gap-4">
              <Link
                href={`/marinas/${favourite.countrySlug}/${favourite.marinaId}#request-berth`}
                className="font-light text-navy hover:underline"
              >
                New enquiry
              </Link>
              <button
                type="button"
                onClick={() => toggleFavourite(favourite)}
                className="font-light text-neutral-500 hover:text-red-600"
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
