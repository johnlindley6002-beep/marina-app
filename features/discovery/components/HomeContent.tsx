"use client";

import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/data/site";
import ChartLinework from "@/components/ui/ChartLinework";
import DestinationSearch from "./DestinationSearch";
import FeaturedMarina from "./FeaturedMarina";
import RestingBand from "@/components/ui/RestingBand";
import { useLanguage } from "@/components/providers/LanguageProvider";

export default function HomeContent() {
  const { t } = useLanguage();
  const hero = siteConfig.heroImage;

  return (
    <>
      <section className="on-ink relative isolate overflow-hidden bg-ink text-paper">
        {hero ? (
          <Image
            src={hero.src}
            alt={hero.alt}
            fill
            loading="eager"
            fetchPriority="high"
            sizes="100vw"
            className="-z-20 object-cover"
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

        <div className="page-column pt-28 pb-32 md:pt-44 md:pb-52">
          <span className="block h-px w-16 bg-brass" />
          <div className="mt-8">
            <Image
              src="/images/aldock-wordmark.png"
              alt="aldock"
              width={407}
              height={108}
              loading="eager"
              className="h-7 w-auto"
            />
          </div>
          <h1 className="type-display measure mt-6 max-w-3xl">{t.home.tagline}</h1>
          <p className="mt-5 max-w-xl text-lg text-stone">{t.home.valueProp}</p>

          <div className="mt-10 max-w-3xl">
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

      <RestingBand image={siteConfig.bandImage} />

      <section id="about" className="defer-paint section-editorial scroll-mt-20 bg-paper-deep">
        <div className="page-column grid gap-10 md:grid-cols-[1fr_1.2fr] md:gap-24">
          <h2 className="type-statement text-ink">{t.home.aboutHeading}</h2>
          <div>
            <p className="measure text-ink-soft">{t.home.aboutBody}</p>
            <Link href="/marinas" className="btn-primary mt-8">
              {t.home.findMarinas}
            </Link>
          </div>
        </div>
      </section>

      <section
        id="contact"
        className="on-ink defer-paint section-editorial scroll-mt-20 bg-ink text-paper"
      >
        <div className="page-column grid gap-10 md:grid-cols-[1fr_1.2fr] md:gap-24">
          <h2 className="type-statement">{t.home.contactHeading}</h2>
          <div>
            <p className="measure text-stone">{t.home.contactBody}</p>
            <div className="mt-8 flex flex-col gap-3 text-lg">
              <a href={`mailto:${siteConfig.contact.email}`} className="btn-quiet w-fit text-paper">
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
