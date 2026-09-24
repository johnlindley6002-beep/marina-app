"use client";

import Image from "next/image";
import Link from "next/link";
import { marinas, type Marina } from "../../data/marinas";
import { contentLocale, marinaContent } from "../../lib/i18n";
import { formatLength } from "../../lib/units";
import ChartDivider from "./ChartDivider";
import ChartLinework from "./ChartLinework";
import { useLanguage } from "./LanguageProvider";
import MarinaRow from "./MarinaRow";
import Reveal from "./Reveal";
import { useUnits } from "./UnitsProvider";

function formatCoordinates(lat: number, lng: number) {
  return `${Math.abs(lat).toFixed(3)}° ${lat >= 0 ? "N" : "S"}, ${Math.abs(lng).toFixed(3)}° ${lng >= 0 ? "E" : "W"}`;
}

// With a photo it shows the photo; without one, a quiet chart plate that
// carries the marina's coordinates.
function Plate({ marina }: { marina: Marina }) {
  if (marina.coverImage) {
    return (
      <Image
        src={marina.coverImage.src}
        alt={marina.coverImage.alt}
        width={900}
        height={700}
        className="aspect-[4/3] w-full rounded-[3px] object-cover"
      />
    );
  }
  return (
    <div
      className="on-ink relative isolate aspect-[4/3] w-full overflow-hidden rounded-[3px] bg-gradient-to-br from-ink to-ink-2"
      role="img"
      aria-label={`${marina.name}, ${formatCoordinates(marina.coordinates.lat, marina.coordinates.lng)}`}
    >
      <ChartLinework className="absolute inset-0 -z-10 h-full w-full text-paper opacity-[0.12]" />
      <span
        aria-hidden="true"
        className="absolute top-[46%] left-[52%] h-3 w-3 rounded-full bg-paper ring-8 ring-paper/25"
      />
      <p className="tabular absolute bottom-5 left-6 text-sm text-stone">
        {formatCoordinates(marina.coordinates.lat, marina.coordinates.lng)}
      </p>
    </div>
  );
}

export default function FeaturedMarina() {
  const { t, locale } = useLanguage();
  const { units } = useUnits();
  const cl = contentLocale(locale);

  const flagship = marinas.find((m) => m.featured) ?? marinas[0];
  if (!flagship) return null;
  const others = marinas.filter((m) => m.id !== flagship.id);
  const content = marinaContent[flagship.id as keyof typeof marinaContent];
  const description = content?.description[cl] ?? flagship.description;

  const facts = [
    { label: t.keyFacts.berths, value: String(flagship.berths.count) },
    {
      label: t.keyFacts.maxLength,
      value: formatLength(flagship.berths.maxLengthM, units),
    },
    { label: "VHF", value: `Ch ${flagship.vhfChannel}` },
  ];

  return (
    <section className="section-editorial px-5 md:px-8">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <h2 className="type-statement text-ink">{t.home.featuredHeading}</h2>
        </Reveal>
        <ChartDivider className="mt-12 md:mt-16" />

        <div className="mt-12 grid gap-12 md:mt-16 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-24">
          <Reveal>
            <h3 className="type-heading flex flex-wrap items-center gap-x-4 text-3xl text-ink">
              {flagship.name}
              {flagship.clubBurgee ? (
                <Image
                  src={flagship.clubBurgee.src}
                  alt={flagship.clubBurgee.name}
                  width={1772}
                  height={1063}
                  className="h-6 w-auto"
                />
              ) : null}
            </h3>
            <p className="measure mt-6 text-ink/75">{description}</p>

            <dl className="mt-8 grid max-w-md grid-cols-3">
              {facts.map((fact) => (
                <div key={fact.label} className="hairline-top pt-3 pr-4">
                  <dt className="text-sm text-ink/70">{fact.label}</dt>
                  <dd className="tabular mt-1 text-lg font-medium text-ink">
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>

            <Link
              href={`/marinas/${flagship.countrySlug}/${flagship.id}`}
              className="mt-8 inline-flex min-h-11 items-center text-lg text-ink underline decoration-current/50 decoration-1 underline-offset-[8px] hover:decoration-ink"
            >
              {t.countryPage.viewMarina}
            </Link>
          </Reveal>

          <Plate marina={flagship} />
        </div>

        {others.length > 0 ? (
          <div className="mt-24">
            <h3 className="type-heading type-h3 text-ink">
              {t.home.moreMarinas}
            </h3>
            <ul className="mt-4 max-w-3xl">
              {others.map((marina) => (
                <MarinaRow key={marina.id} marina={marina} />
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
