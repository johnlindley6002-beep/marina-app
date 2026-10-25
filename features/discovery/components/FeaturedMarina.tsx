"use client";

import Image from "next/image";
import Link from "next/link";
import { marinas, type Marina } from "@/data/marinas";
import { contentLocale, marinaContent } from "@/lib/i18n";
import { formatLength } from "@/lib/units";
import { useLanguage } from "@/components/providers/LanguageProvider";
import MarinaRow from "./MarinaRow";
import { useUnits } from "@/components/providers/UnitsProvider";

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
        className="aspect-[4/3] w-full rounded-md object-cover"
      />
    );
  }
  return (
    <div
      className="on-ink relative isolate aspect-[4/3] w-full overflow-hidden rounded-md bg-ink"
      role="img"
      aria-label={`${marina.name}, ${formatCoordinates(marina.coordinates.lat, marina.coordinates.lng)}`}
    >
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
    <section className="section-editorial">
      <div className="page-column">
        <h2 className="type-statement text-ink">{t.home.featuredHeading}</h2>
        <hr className="stack-md border-hairline" />

        <div className="stack-md grid gap-12 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-24">
          <div>
            <h3 className="type-card flex flex-wrap items-center gap-x-4 text-ink">
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
            <p className="measure mt-6 text-ink-soft">{description}</p>

            <dl className="mt-8 grid max-w-md grid-cols-3">
              {facts.map((fact) => (
                <div key={fact.label} className="hairline-top pt-3 pr-4">
                  <dt className="text-sm text-ink-muted">{fact.label}</dt>
                  <dd className="tabular mt-1 text-lg font-medium text-ink">{fact.value}</dd>
                </div>
              ))}
            </dl>

            <Link
              href={`/marinas/${flagship.countrySlug}/${flagship.id}`}
              className="btn-quiet mt-8 text-lg"
            >
              {t.countryPage.viewMarina}
            </Link>
          </div>

          <Plate marina={flagship} />
        </div>

        {others.length > 0 ? (
          <div className="stack-lg">
            <h3 className="type-heading type-h3 text-ink">{t.home.moreMarinas}</h3>
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
