import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getMarina, marinas } from "../../../../data/marinas";
import BerthSearch from "./BerthSearch";

type Props = {
  params: Promise<{ country: string; marina: string }>;
};

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { country, marina: marinaId } = await params;
  const marina = getMarina(country, marinaId);
  if (!marina) return {};
  return {
    title: `${marina.name} — aldock`,
    description: marina.description,
  };
}

export default async function MarinaPage({ params }: Props) {
  const { country, marina: marinaId } = await params;
  const marina = getMarina(country, marinaId);

  if (!marina) {
    notFound();
  }

  return (
    <>
      <section className="relative flex h-[50vh] min-h-[360px] items-end">
        {/* TODO: replace with a real photo of Marina de Cascais */}
        <Image
          src={marina.heroImage}
          alt={`${marina.name} — placeholder photo`}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/30 to-navy/10" />
        <div className="relative mx-auto w-full max-w-5xl px-6 pb-12 md:px-8">
          <p className="text-xs font-normal tracking-[0.25em] text-white/60 uppercase">
            {marina.country}
          </p>
          <h1 className="mt-4 text-3xl font-normal tracking-tight text-white md:text-5xl">
            {marina.name}
          </h1>
        </div>
      </section>

      <section className="px-6 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-5xl">
          <BerthSearch marinaName={marina.name} />
        </div>
      </section>

      <section className="px-6 pb-16 md:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="relative aspect-[16/9] max-h-[420px] overflow-hidden rounded-sm border border-neutral-200">
            <Image
              src="/images/map-placeholder.svg"
              alt={`Map placeholder for ${marina.address}`}
              fill
              sizes="(max-width: 768px) 100vw, 1024px"
              className="object-cover"
            />
          </div>
          <p className="mt-3 text-center text-sm font-light text-neutral-400">
            Interactive berth map — coming soon
          </p>
        </div>
      </section>

      <section className="bg-neutral-50 px-6 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-normal tracking-[0.25em] text-navy/40 uppercase">
            About
          </p>
          <p className="mt-4 max-w-3xl text-base leading-relaxed font-light text-neutral-600 md:text-lg">
            {marina.description}
          </p>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs font-normal tracking-wide text-navy/40 uppercase">
                Berths
              </p>
              <p className="mt-2 text-lg font-normal text-navy">
                {marina.berths.count}
              </p>
            </div>
            <div>
              <p className="text-xs font-normal tracking-wide text-navy/40 uppercase">
                Max length
              </p>
              <p className="mt-2 text-lg font-normal text-navy">
                {marina.berths.maxLengthM} m
              </p>
            </div>
            <div>
              <p className="text-xs font-normal tracking-wide text-navy/40 uppercase">
                Address
              </p>
              <p className="mt-2 text-sm font-light text-neutral-600">
                {marina.address}
              </p>
            </div>
            <div>
              <p className="text-xs font-normal tracking-wide text-navy/40 uppercase">
                Contact
              </p>
              <p className="mt-2 text-sm font-light text-neutral-600">
                {marina.phone}
                <br />
                {marina.email}
                <br />
                VHF Channel {marina.vhfChannel}
              </p>
            </div>
          </div>

          <div className="mt-12">
            <p className="text-xs font-normal tracking-wide text-navy/40 uppercase">
              Facilities
            </p>
            <ul className="mt-4 flex flex-wrap gap-3">
              {marina.facilities.map((facility) => (
                <li
                  key={facility}
                  className="rounded-sm border border-neutral-200 bg-white px-4 py-2 text-sm font-light text-neutral-600"
                >
                  {facility}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}

export async function generateStaticParams() {
  return marinas.map((marina) => ({
    country: marina.countrySlug,
    marina: marina.id,
  }));
}
