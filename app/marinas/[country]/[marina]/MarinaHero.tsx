"use client";

import Image from "next/image";
import { useRef, type CSSProperties } from "react";
import type { Marina } from "../../../../data/marinas";
import { formatCoordinates, mapsUrlForCoordinates } from "../../../../lib/geo";
import { useParallax } from "../../../../lib/useParallax";
import ChartLinework from "../../../components/ChartLinework";
import FavouriteButton from "../../../components/FavouriteButton";
import FlagIcon from "../../../components/FlagIcon";
import ShareButton from "../../../components/ShareButton";
import { useGallery } from "./PhotoGallery";

const chipClass = "chip-dark";

const rise = (delay: number, duration = "0.7s"): CSSProperties =>
  ({ "--d": `${delay}ms`, animationDuration: duration }) as CSSProperties;

// Full-bleed, image-led hero with the name and wordmark over the picture. The
// height is set in CSS and is the same with a photo or with the placeholder, so
// adding the photo later moves nothing. The one orchestrated moment of the
// site: the image settles, then the text and actions rise in.
export default function MarinaHero({ marina }: { marina: Marina }) {
  const { count, open } = useGallery();
  const photo = marina.heroImage;
  const { lat, lng } = marina.coordinates;

  const sectionRef = useRef<HTMLElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  useParallax(sectionRef, layerRef, !!photo);

  return (
    <section
      ref={sectionRef}
      className="on-ink relative isolate h-[88svh] max-h-[58rem] min-h-[42rem] overflow-hidden bg-gradient-to-br from-ink to-ink-2 lg:min-h-[36rem]"
    >
      {photo ? (
        <>
          <div
            ref={layerRef}
            className="absolute inset-0 -z-20 will-change-transform"
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              loading="eager"
              fetchPriority="high"
              sizes="100vw"
              className="hero-settle object-cover"
            />
          </div>
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-gradient-to-b from-ink/55 via-ink/20 to-ink/90"
          />
        </>
      ) : (
        <ChartLinework className="absolute inset-0 -z-10 h-full w-full text-paper opacity-[0.09]" />
      )}

      <div className="page-column flex h-full flex-col justify-between py-6 md:py-8">
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

        <div className="pb-2 md:pb-6">
          <span
            className="hero-rise mb-6 block h-px w-16 bg-brass"
            style={rise(0)}
          />
          <Image
            src={marina.wordmark}
            alt=""
            width={575}
            height={383}
            loading="eager"
            className="hero-rise -mt-10 -mb-8 -ml-[48px] h-auto w-[200px] max-w-none sm:-mt-[52px] sm:-mb-[50px] sm:-ml-[62px] sm:w-[260px]"
            style={rise(80)}
          />
          <h1
            className="type-statement hero-rise measure mt-5 max-w-3xl text-paper"
            style={rise(160, "0.5s")}
          >
            {marina.name}
          </h1>
          <p
            className="hero-rise mt-4 max-w-md text-stone"
            style={rise(260)}
          >
            {marina.location}
          </p>

          <div
            className="hero-rise mt-8 flex flex-wrap items-center gap-3"
            style={rise(340)}
          >
            <a
              href="#plan-your-stay"
              className="btn-primary"
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
            <p className="mt-6 text-xs text-white/70">Marina photo coming soon</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
