"use client";

import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "../../data/site";
import ChartLinework from "./ChartLinework";
import DestinationSearch from "./DestinationSearch";
import FeaturedMarina from "./FeaturedMarina";
import { useLanguage } from "./LanguageProvider";

export default function HomeContent() {
  const { t } = useLanguage();
  const hero = siteConfig.heroImage;

  return (
    <>
      <section className="on-ink relative isolate overflow-hidden bg-gradient-to-br from-ink via-ink to-ink-2 text-paper">
        {hero ? (
          <Image
            src={hero.src}
            alt={hero.alt}
            fill
            loading="eager"
            fetchPriority="high"
            sizes="100vw"
            className="hero-settle -z-20 object-cover"
          />
        ) : null}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10"
          style={{
            background: hero
              ? "linear-gradient(100deg, var(--ink) 10%, color-mix(in srgb, var(--ink) 80%, transparent) 50%, color-mix(in srgb, var(--ink-2) 45%, transparent) 100%)"
              : "transparent",
          }}
        />
        <ChartLinework className="absolute inset-0 -z-10 h-full w-full text-paper opacity-[0.07]" />

        <div className="mx-auto max-w-6xl px-5 pt-20 pb-24 md:px-8 md:pt-32 md:pb-36">
          <span
            className="hero-rise block h-px w-16 bg-brass"
            style={{ "--d": "0ms" } as React.CSSProperties}
          />
          <div
            className="hero-rise mt-8"
            style={{ "--d": "90ms" } as React.CSSProperties}
          >
            <Image
              src="/images/aldock-wordmark.png"
              alt="aldock"
              width={407}
              height={108}
              loading="eager"
              className="h-7 w-auto"
            />
          </div>
          <h1
            className="type-display hero-rise measure mt-6 max-w-3xl"
            style={{ "--d": "180ms" } as React.CSSProperties}
          >
            {t.home.tagline}
          </h1>
          <p
            className="hero-rise mt-5 max-w-xl text-lg text-stone"
            style={{ "--d": "270ms" } as React.CSSProperties}
          >
            {t.home.valueProp}
          </p>

          <div
            className="hero-rise mt-10 max-w-3xl"
            style={{ "--d": "360ms" } as React.CSSProperties}
          >
            <DestinationSearch />
            <Link
              href="/marinas"
              className="mt-3 inline-flex min-h-11 items-center text-stone underline underline-offset-4 transition-colors hover:text-paper"
            >
              {t.home.browseMarinas}
            </Link>
          </div>
        </div>
      </section>

      <FeaturedMarina />

      <section
        id="about"
        className="defer-paint scroll-mt-20 section bg-paper-deep px-5 md:px-8"
      >
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[1fr_1.2fr] md:gap-20">
          <h2 className="type-heading type-h2 text-ink">
            {t.home.aboutHeading}
          </h2>
          <div>
            <p className="measure text-lg text-ink/75">{t.home.aboutBody}</p>
            <Link
              href="/marinas"
              className="mt-8 inline-flex min-h-12 items-center rounded-[3px] bg-brass px-8 text-base font-medium text-ink transition-[filter] hover:brightness-105"
            >
              {t.home.findMarinas}
            </Link>
          </div>
        </div>
      </section>

      <section
        id="contact"
        className="on-ink defer-paint scroll-mt-20 section bg-ink px-5 text-paper md:px-8"
      >
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[1fr_1.2fr] md:gap-20">
          <h2 className="type-heading type-h2">{t.home.contactHeading}</h2>
          <div>
            <p className="measure text-lg text-stone">{t.home.contactBody}</p>
            <div className="mt-8 flex flex-col gap-3 text-lg">
              <a
                href={`mailto:${siteConfig.contact.email}`}
                className="inline-flex min-h-11 w-fit items-center underline decoration-brass decoration-2 underline-offset-[6px]"
              >
                {siteConfig.contact.email}
              </a>
              <a
                href={`tel:${siteConfig.contact.phone.replace(/[^\d+]/g, "")}`}
                className="tabular inline-flex min-h-11 w-fit items-center text-stone transition-colors hover:text-paper"
              >
                {siteConfig.contact.phone}
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
