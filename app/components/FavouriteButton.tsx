"use client";

import { useEffect, useState } from "react";
import {
  loadFavourites,
  toggleFavourite,
  TRIP_CHANGED_EVENT,
} from "../../lib/tripStore";
import { useLanguage } from "./LanguageProvider";

type Props = {
  marinaId: string;
  countrySlug: string;
  marinaName: string;
  className?: string;
  tone?: "light" | "dark";
};

export default function FavouriteButton({
  marinaId,
  countrySlug,
  marinaName,
  className = "",
  tone = "dark",
}: Props) {
  const { t } = useLanguage();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    function refresh() {
      setSaved(loadFavourites().some((f) => f.marinaId === marinaId));
    }
    refresh();
    window.addEventListener(TRIP_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(TRIP_CHANGED_EVENT, refresh);
  }, [marinaId]);

  const colour =
    tone === "light"
      ? "text-white hover:text-white"
      : "text-ink hover:text-ink-2";

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={`${saved ? t.favourites.saved : t.favourites.save}: ${marinaName}`}
      onClick={() => toggleFavourite({ marinaId, countrySlug, marinaName })}
      className={`inline-flex items-center gap-2 text-sm ${colour} ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 20.5s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 7.9a4.2 4.2 0 0 1 7.5 2.6c0 5.4-7.5 10-7.5 10Z"
        />
      </svg>
      <span>{saved ? t.favourites.saved : t.favourites.save}</span>
    </button>
  );
}
