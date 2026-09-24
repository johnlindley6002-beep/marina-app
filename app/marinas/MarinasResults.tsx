"use client";

import { useState } from "react";
import DestinationSearch from "../components/DestinationSearch";
import { useLanguage } from "../components/LanguageProvider";
import MarinaRow from "../components/MarinaRow";
import SavedMarinas from "../components/SavedMarinas";
import { searchMarinas } from "../../lib/marinaSearch";
import MarinasMap, { MARINAS_MAP_READY, type MapPin } from "./MarinasMap";

type Props = {
  q: string;
  arrival: string;
  departure: string;
  length: string;
};

export default function MarinasResults({ q, arrival, departure, length }: Props) {
  const { t } = useLanguage();
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const lengthNumber = Number(length);
  const results = searchMarinas({
    q,
    length: lengthNumber > 0 ? lengthNumber : undefined,
  });

  // Dates and length ride along to the marina page's Plan your stay panel.
  const carried = new URLSearchParams();
  if (arrival) carried.set("arrival", arrival);
  if (departure) carried.set("departure", departure);
  if (lengthNumber > 0) carried.set("length", length);
  const search = carried.size > 0 ? `?${carried}` : "";

  const pins: MapPin[] = results.map((m) => ({
    id: m.id,
    name: m.name,
    lat: m.coordinates.lat,
    lng: m.coordinates.lng,
    href: `/marinas/${m.countrySlug}/${m.id}${search}`,
  }));

  return (
    <section className="px-5 py-14 md:px-8 md:py-20">
      <div className="mx-auto max-w-6xl">
        <h1 className="type-display [font-size:clamp(2rem,1.2rem+3vw,3.2rem)] text-ink">
          {q ? t.results.forQuery(q) : t.results.heading}
        </h1>
        <p className="tabular mt-3 text-ink/70">
          {t.results.count(results.length)}
        </p>

        <DestinationSearch
          className="mt-8 max-w-3xl"
          initial={{ q, arrival, departure, length }}
        />

        <SavedMarinas />

        <div
          className={`mt-12 grid gap-12 ${
            MARINAS_MAP_READY ? "lg:grid-cols-[1fr_1.1fr]" : ""
          }`}
        >
          {results.length > 0 ? (
            <ul className="max-w-3xl">
              {results.map((marina) => (
                <MarinaRow
                  key={marina.id}
                  marina={marina}
                  search={search}
                  highlighted={highlightedId === marina.id}
                  onHover={setHighlightedId}
                />
              ))}
            </ul>
          ) : (
            <p className="measure text-lg text-ink/75">{t.results.none}</p>
          )}
          {MARINAS_MAP_READY ? (
            <MarinasMap
              pins={pins}
              highlightedId={highlightedId}
              onHover={setHighlightedId}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
