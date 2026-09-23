"use client";

import Link from "next/link";
import FlagIcon from "../components/FlagIcon";
import { useLanguage } from "../components/LanguageProvider";
import SavedMarinas from "../components/SavedMarinas";

type Country = { slug: string; name: string; countryCode: string };

export default function MarinasListContent({
  countries,
}: {
  countries: Country[];
}) {
  const { t } = useLanguage();

  return (
    <section className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <p className="text-xs font-normal tracking-[0.25em] text-navy/60 uppercase">
            {t.marinasList.eyebrow}
          </p>
          <h1 className="mt-4 text-3xl font-normal tracking-tight text-navy md:text-4xl">
            {t.marinasList.heading}
          </h1>
        </div>

        <SavedMarinas />

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {countries.map((country) => (
            <Link
              key={country.slug}
              href={`/marinas/${country.slug}`}
              className="group rounded-sm border border-neutral-200/80 bg-white p-8 transition-colors hover:border-navy/20 md:p-10"
            >
              <h2 className="flex items-center gap-2 text-lg font-normal tracking-tight text-navy">
                <FlagIcon countryCode={country.countryCode} />
                {country.name}
              </h2>
              <p className="mt-3 text-sm font-light text-navy/60 group-hover:text-navy">
                {t.marinasList.viewMarinas}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
