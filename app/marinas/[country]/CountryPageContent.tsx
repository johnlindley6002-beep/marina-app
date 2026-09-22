"use client";

import Link from "next/link";
import type { Marina } from "../../../data/marinas";
import { useLanguage } from "../../components/LanguageProvider";

export default function CountryPageContent({
  marinas,
  countryName,
}: {
  marinas: Marina[];
  countryName: string;
}) {
  const { t } = useLanguage();

  return (
    <section className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <p className="text-xs font-normal tracking-[0.25em] text-navy/40 uppercase">
            {countryName}
          </p>
          <h1 className="mt-4 text-3xl font-normal tracking-tight text-navy md:text-4xl">
            {t.countryPage.heading(countryName)}
          </h1>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {marinas.map((marina) => (
            <Link
              key={marina.id}
              href={`/marinas/${marina.countrySlug}/${marina.id}`}
              className="group rounded-sm border border-neutral-200/80 bg-white p-8 transition-colors hover:border-navy/20 md:p-10"
            >
              <h2 className="text-lg font-normal tracking-tight text-navy">
                {marina.name}
              </h2>
              <p className="mt-3 text-sm leading-relaxed font-light text-neutral-500">
                {marina.location}
              </p>
              <p className="mt-4 text-sm font-light text-navy/50 group-hover:text-navy">
                {t.countryPage.viewMarina}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
