import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  CLASS_LENGTH_RANGES,
  FACILITY_LABELS,
  MARINA_CLASS_ORDER,
  getMarina,
  marinas,
} from "../../../../data/marinas";
import BerthAvailabilityMap from "./BerthAvailabilityMap";
import FacilityIcon from "./facility-icons";
import Breadcrumbs from "../../../components/Breadcrumbs";

type Props = {
  params: Promise<{ country: string; marina: string }>;
  searchParams: Promise<{
    arrival?: string;
    departure?: string;
    length?: string;
  }>;
};

function formatCoordinates(lat: number, lng: number) {
  const latLabel = lat >= 0 ? "N" : "S";
  const lngLabel = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(3)}° ${latLabel}, ${Math.abs(lng).toFixed(3)}° ${lngLabel}`;
}

function formatLengthRange(minM: number, maxM: number) {
  return minM === 0 ? `Up to ${maxM} m` : `${minM}–${maxM} m`;
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
    openGraph: {
      title: `${marina.name} — aldock`,
      description: marina.description,
      images: ["/images/cascais-marina-plan.webp"],
    },
  };
}

export default async function MarinaPage({ params, searchParams }: Props) {
  const { country, marina: marinaId } = await params;
  const { arrival, departure, length } = await searchParams;
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
            marinaEmail={marina.email}
            transientRates={marina.transientRates}
            vatRate={marina.vatRate}
            initialArrival={arrival}
            initialDeparture={departure}
            initialLength={length}
          />
        </div>
      </section>

      <section className="px-6 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-normal tracking-[0.25em] text-navy/40 uppercase">
            Rates
          </p>
          <h2 className="mt-4 text-2xl font-normal tracking-tight text-navy">
            Transient berth rates
          </h2>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-xs font-normal tracking-wide text-navy/40 uppercase">
                  <th className="py-3 pr-4">Class</th>
                  <th className="py-3 pr-4">Length range</th>
                  <th className="py-3 pr-4">Low season €/night</th>
                  <th className="py-3">High season €/night</th>
                </tr>
              </thead>
              <tbody>
                {MARINA_CLASS_ORDER.map((marinaClass) => {
                  const range = CLASS_LENGTH_RANGES[marinaClass];
                  const rate = marina.transientRates[marinaClass];
                  return (
                    <tr
                      key={marinaClass}
                      className="border-b border-neutral-100 text-neutral-600"
                    >
                      <td className="py-3 pr-4 font-normal text-navy">
                        {marinaClass}
                      </td>
                      <td className="py-3 pr-4 font-light">
                        {formatLengthRange(range.minM, range.maxM)}
                      </td>
                      <td className="py-3 pr-4 font-light">
                        €{rate.low.toFixed(2)}
                      </td>
                      <td className="py-3 font-light">
                        €{rate.high.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs font-light text-neutral-400">
            Base rates per night, excl. {Math.round(marina.vatRate * 100)}%
            VAT and utilities. Season: low = Jan–Mar &amp; Oct–Dec, high =
            Apr–Sep.
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
        </div>
      </section>

      <section className="px-6 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-normal tracking-wide text-navy/40 uppercase">
            Contact
          </p>
          <div className="mt-6 grid gap-8 sm:grid-cols-2">
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
          </div>
        </div>
      </section>

      <section className="bg-neutral-50 px-6 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-normal tracking-wide text-navy/40 uppercase">
            Visiting the marina
          </p>
          <div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-xs font-normal tracking-wide text-navy/40 uppercase">
                Hailing
              </p>
              <p className="mt-2 text-sm font-light text-neutral-600">
                VHF Channel {marina.vhfChannel}
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
            <div>
              <p className="text-xs font-normal tracking-wide text-navy/40 uppercase">
                On arrival
              </p>
              <p className="mt-2 text-sm font-light text-neutral-600">
                {marina.arrivalInstructions}
              </p>
            </div>
            <div>
              <p className="text-xs font-normal tracking-wide text-navy/40 uppercase">
                By car
              </p>
              <p className="mt-2 text-sm font-light text-neutral-600">
                {marina.gettingThere.byCar}
              </p>
            </div>
            <div>
              <p className="text-xs font-normal tracking-wide text-navy/40 uppercase">
                By train
              </p>
              <p className="mt-2 text-sm font-light text-neutral-600">
                {marina.gettingThere.byTrain}
              </p>
            </div>
            <div>
              <p className="text-xs font-normal tracking-wide text-navy/40 uppercase">
                By air
              </p>
              <p className="mt-2 text-sm font-light text-neutral-600">
                {marina.gettingThere.byAir}
              </p>
            </div>
            <div>
              <p className="text-xs font-normal tracking-wide text-navy/40 uppercase">
                Max length
              </p>
              <p className="mt-2 text-sm font-light text-neutral-600">
                {marina.berths.maxLengthM} m
              </p>
            </div>
            <div>
              <p className="text-xs font-normal tracking-wide text-navy/40 uppercase">
                Max draft
              </p>
              <p className="mt-2 text-sm font-light text-neutral-600">
                {marina.berths.maxDraftM} m
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
    </>
  );
}

export async function generateStaticParams() {
  return marinas.map((marina) => ({
    country: marina.countrySlug,
    marina: marina.id,
  }));
}
