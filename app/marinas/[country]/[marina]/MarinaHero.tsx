"use client";

import Image from "next/image";
import type { Marina } from "../../../../data/marinas";
import { formatCoordinates, mapsUrlForCoordinates } from "../../../../lib/geo";
import ChartLinework from "../../../components/ChartLinework";
import FavouriteButton from "../../../components/FavouriteButton";
import FlagIcon from "../../../components/FlagIcon";
import ShareButton from "../../../components/ShareButton";
import { useGallery } from "./PhotoGallery";

const chipClass =
  "inline-flex min-h-11 items-center gap-2 rounded-full border border-white/40 bg-ink/40 px-4 text-sm text-white transition-colors hover:border-white";

// Full-bleed, photo-led hero. The height is fixed per breakpoint and is the
// same with a photo or with the placeholder, so adding the photo later moves
// nothing.
export default function MarinaHero({ marina }: { marina: Marina }) {
  const { count, open } = useGallery();
  const photo = marina.heroImage;
  const { lat, lng } = marina.coordinates;

  return (
    <section className="on-ink relative isolate h-[32rem] overflow-hidden bg-gradient-to-br from-ink to-ink-2 lg:h-[36rem]">
      {photo ? (
        <>
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            loading="eager"
            fetchPriority="high"
            sizes="100vw"
            className="-z-20 object-cover"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-gradient-to-b from-ink/70 via-ink/25 to-ink/85"
          />
        </>
      ) : (
        <ChartLinework className="absolute inset-0 -z-10 h-full w-full text-paper opacity-[0.07]" />
      )}

      <div className="mx-auto flex h-full max-w-5xl flex-col justify-between px-5 py-6 md:px-8">
        <div className="flex items-center justify-between gap-4">
          <p className="flex items-center gap-2 text-sm text-white">
            <FlagIcon countryCode={marina.countryCode} className="h-3 w-auto" />
            {marina.country}
            {marina.clubBurgee ? (
              <>
                <span className="text-white/60">·</span>
                <Image
                  src={marina.clubBurgee.src}
                  alt={marina.clubBurgee.name}
                  width={1772}
                  height={1063}
                  className="h-4 w-auto"
                />
              </>
            ) : null}
          </p>
          <FavouriteButton
            marinaId={marina.id}
            countrySlug={marina.countrySlug}
            marinaName={marina.name}
            tone="light"
            variant="ghost"
          />
        </div>

        <div>
          <h1 className="sr-only">{marina.name}</h1>
          <Image
            src={marina.wordmark}
            alt={`${marina.name} logo`}
            width={575}
            height={383}
            loading="eager"
            fetchPriority={photo ? "auto" : "high"}
            className="h-auto w-[180px] sm:w-[260px] md:w-[300px]"
          />

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <a
              href="#plan-your-stay"
              className="inline-flex min-h-12 items-center rounded-[3px] bg-brass px-8 text-base font-medium text-ink transition-[filter] hover:brightness-105"
            >
              Request a berth
            </a>
            <ShareButton title={marina.name} className={chipClass} />
            <a
              href={mapsUrlForCoordinates(lat, lng)}
              target="_blank"
              rel="noopener noreferrer"
              className={`${chipClass} py-1`}
            >
              <svg
                viewBox="0 0 20 20"
                className="h-4 w-4 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <path
                  d="M10 17s5.5-4.7 5.5-9A5.5 5.5 0 0 0 4.5 8c0 4.3 5.5 9 5.5 9Z"
                  strokeLinejoin="round"
                />
                <circle cx="10" cy="8" r="2" />
              </svg>
              <span className="leading-tight">
                Show on the map
                <span className="tabular block text-xs text-white/80">
                  {formatCoordinates(lat, lng)}
                </span>
                <span className="sr-only"> (opens in a new tab)</span>
              </span>
            </a>
            {count > 0 ? (
              <button type="button" onClick={() => open(0)} className={chipClass}>
                View gallery ({count})
              </button>
            ) : null}
          </div>

          {!photo ? (
            <p className="mt-4 text-xs text-white/70">Marina photo coming soon</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
