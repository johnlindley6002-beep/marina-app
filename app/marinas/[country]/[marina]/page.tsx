import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { FACILITY_LABELS, getMarina, marinas } from "../../../../data/marinas";
import BerthAvailabilityMap from "./BerthAvailabilityMap";
import FacilityIcon from "./facility-icons";
import Breadcrumbs from "../../../components/Breadcrumbs";

type Props = {
  params: Promise<{ country: string; marina: string }>;
};

function formatCoordinates(lat: number, lng: number) {
  const latLabel = lat >= 0 ? "N" : "S";
  const lngLabel = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(3)}° ${latLabel}, ${Math.abs(lng).toFixed(3)}° ${lngLabel}`;
}

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

      <div className="mx-auto max-w-5xl px-6 py-4 text-navy/60 md:px-8">
        <Breadcrumbs
          items={[
            { label: "Marinas", href: "/marinas" },
            { label: marina.country, href: `/marinas/${marina.countrySlug}` },
            { label: marina.name },
          ]}
        />
      </div>

      <section className="px-6 py-12 md:px-8 md:py-16">
        <div className="mx-auto max-w-5xl">
          <BerthAvailabilityMap
            marinaName={marina.name}
            transientRates={marina.transientRates}
            vatRate={marina.vatRate}
          />
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
        </div>
      </section>

      <section className="px-6 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-normal tracking-wide text-navy/40 uppercase">
            Contact & hailing
          </p>
          <div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs font-normal tracking-wide text-navy/40 uppercase">
                VHF channel
              </p>
              <p className="mt-2 text-lg font-normal text-navy">
                Channel {marina.vhfChannel}
              </p>
            </div>
            <div>
              <p className="text-xs font-normal tracking-wide text-navy/40 uppercase">
                Phone
              </p>
              <p className="mt-2 text-sm font-light text-neutral-600">
                {marina.phone}
              </p>
            </div>
            <div>
              <p className="text-xs font-normal tracking-wide text-navy/40 uppercase">
                Email
              </p>
              <p className="mt-2 text-sm font-light text-neutral-600">
                {marina.email}
              </p>
            </div>
            <div>
              <p className="text-xs font-normal tracking-wide text-navy/40 uppercase">
                Office hours
              </p>
              <p className="mt-2 text-sm font-light text-neutral-600">
                Summer: {marina.officeHours.summer}
                <br />
                Winter: {marina.officeHours.winter}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-neutral-50 px-6 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-normal tracking-wide text-navy/40 uppercase">
            Key facts
          </p>
          <div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
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
                Max draft
              </p>
              <p className="mt-2 text-lg font-normal text-navy">
                {marina.berths.maxDraftM} m
              </p>
            </div>
            <div>
              <p className="text-xs font-normal tracking-wide text-navy/40 uppercase">
                Coordinates
              </p>
              <p className="mt-2 text-sm font-light text-neutral-600">
                {formatCoordinates(marina.coordinates.lat, marina.coordinates.lng)}
              </p>
            </div>
            <div className="sm:col-span-2 lg:col-span-4">
              <p className="text-xs font-normal tracking-wide text-navy/40 uppercase">
                Address
              </p>
              <p className="mt-2 text-sm font-light text-neutral-600">
                {marina.address}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-normal tracking-wide text-navy/40 uppercase">
            Facilities
          </p>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {marina.facilities.map((facility) => (
              <div
                key={facility}
                className="flex flex-col items-center gap-3 rounded-sm border border-neutral-200 bg-white px-4 py-6 text-center"
              >
                <FacilityIcon facility={facility} className="h-6 w-6 text-navy" />
                <p className="text-sm font-light text-neutral-600">
                  {FACILITY_LABELS[facility]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-navy px-6 py-16 text-center md:px-8 md:py-24">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl font-normal tracking-tight text-white md:text-3xl">
            Questions about a berth at {marina.name}?
          </h2>
          <a
            href={`mailto:${marina.email}`}
            className="mt-8 inline-block bg-navy-accent px-8 py-3 text-sm font-normal tracking-wide text-white hover:bg-[#254a75]"
          >
            Contact marina
          </a>
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
