import Link from "next/link";
import type { Metadata } from "next";
import { getCountries } from "../../data/marinas";

export const metadata: Metadata = {
  title: "Marinas — aldock",
  description: "Browse marinas by country.",
};

export default function MarinasPage() {
  const countries = getCountries();

  return (
    <section className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <p className="text-xs font-normal tracking-[0.25em] text-navy/40 uppercase">
            Marinas
          </p>
          <h1 className="mt-4 text-3xl font-normal tracking-tight text-navy md:text-4xl">
            Choose a country
          </h1>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {countries.map((country) => (
            <Link
              key={country.slug}
              href={`/marinas/${country.slug}`}
              className="group rounded-sm border border-neutral-200/80 bg-white p-8 transition-colors hover:border-navy/20 md:p-10"
            >
              <h2 className="text-lg font-normal tracking-tight text-navy">
                {country.name}
              </h2>
              <p className="mt-3 text-sm font-light text-navy/50 group-hover:text-navy">
                View marinas →
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
