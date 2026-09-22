"use client";

import Image from "next/image";
import type { Marina } from "../../../../data/marinas";
import {
  CLASS_LENGTH_RANGES,
  MARINA_CLASS_ORDER,
} from "../../../../data/marinas";
import { marinaContent } from "../../../../lib/i18n";
import BerthAvailabilityMap from "./BerthAvailabilityMap";
import FacilityIcon from "./facility-icons";
import Breadcrumbs from "../../../components/Breadcrumbs";
import FlagIcon from "../../../components/FlagIcon";
import { useLanguage } from "../../../components/LanguageProvider";

function formatCoordinates(lat: number, lng: number) {
  const latLabel = lat >= 0 ? "N" : "S";
  const lngLabel = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(3)}° ${latLabel}, ${Math.abs(lng).toFixed(3)}° ${lngLabel}`;
}

type Props = {
  marina: Marina;
  initialArrival?: string;
  initialDeparture?: string;
  initialLength?: string;
};

export default function CascaisPageContent({
  marina,
  initialArrival,
  initialDeparture,
  initialLength,
}: Props) {
  const { t, locale } = useLanguage();
  const content = marinaContent[marina.id as keyof typeof marinaContent];

  const description = content?.description[locale] ?? marina.description;
  const arrivalInstructions =
    content?.arrivalInstructions[locale] ?? marina.arrivalInstructions;
  const gettingThere = {
    byCar: content?.gettingThere.byCar[locale] ?? marina.gettingThere.byCar,
    byTrain:
      content?.gettingThere.byTrain[locale] ?? marina.gettingThere.byTrain,
    byAir: content?.gettingThere.byAir[locale] ?? marina.gettingThere.byAir,
  };

  function formatLengthRange(minM: number, maxM: number) {
    return minM === 0 ? t.rates.upTo(maxM) : `${minM}–${maxM} m`;
  }

  return (
    <>
      <section className="relative flex h-[50vh] min-h-[360px] items-end">
        <Image
          src={marina.heroImage}
          alt={`${marina.name}, Portugal`}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/30 to-navy/10" />
        <div className="relative mx-auto w-full max-w-5xl px-6 pb-12 md:px-8">
          <p className="flex items-center gap-2 text-xs font-normal tracking-[0.25em] text-white/60 uppercase">
            <FlagIcon countryCode={marina.countryCode} className="h-3 w-auto" />
            {marina.country}
          </p>
          <h1 className="mt-4 text-3xl font-normal tracking-tight text-white md:text-5xl">
            {marina.name}
          </h1>
          <p className="mt-3 text-xs font-light text-white/50">
            {t.hero.photoLabel}:{" "}
            <a
              href={marina.credit.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-white/80"
            >
              {marina.credit.text}
            </a>
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-6 py-4 text-navy/60 md:px-8">
        <Breadcrumbs
          items={[
            { label: t.breadcrumbs.marinas, href: "/marinas" },
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
            initialArrival={initialArrival}
            initialDeparture={initialDeparture}
            initialLength={initialLength}
          />
        </div>
      </section>

      <section className="px-6 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-normal tracking-[0.25em] text-navy/40 uppercase">
            {t.rates.eyebrow}
          </p>
          <h2 className="mt-4 text-2xl font-normal tracking-tight text-navy">
            {t.rates.heading}
          </h2>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-xs font-normal tracking-wide text-navy/40 uppercase">
                  <th className="py-3 pr-4">{t.rates.colClass}</th>
                  <th className="py-3 pr-4">{t.rates.colLength}</th>
                  <th className="py-3 pr-4">{t.rates.colLow}</th>
                  <th className="py-3">{t.rates.colHigh}</th>
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
            {t.rates.caption(Math.round(marina.vatRate * 100))}
          </p>
        </div>
      </section>

      <section className="bg-neutral-50 px-6 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-normal tracking-[0.25em] text-navy/40 uppercase">
            {t.about.eyebrow}
          </p>
          <p className="mt-4 max-w-3xl text-base leading-relaxed font-light text-neutral-600 md:text-lg">
            {description}
          </p>
        </div>
      </section>

      <section className="px-6 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-normal tracking-wide text-navy/40 uppercase">
            {t.contact.heading}
          </p>
          <div className="mt-6 grid gap-8 sm:grid-cols-2">
            <div>
              <p className="text-xs font-normal tracking-wide text-navy/40 uppercase">
                {t.contact.phone}
              </p>
              <p className="mt-2 text-sm font-light text-neutral-600">
                {marina.phone}
              </p>
            </div>
            <div>
              <p className="text-xs font-normal tracking-wide text-navy/40 uppercase">
                {t.contact.email}
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
            {t.visiting.heading}
          </p>
          <div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-xs font-normal tracking-wide text-navy/40 uppercase">
                {t.visiting.hailing}
              </p>
              <p className="mt-2 text-sm font-light text-neutral-600">
                {t.visiting.vhfChannel(marina.vhfChannel)}
              </p>
            </div>
            <div>
              <p className="text-xs font-normal tracking-wide text-navy/40 uppercase">
                {t.visiting.officeHours}
              </p>
              <p className="mt-2 text-sm font-light text-neutral-600">
                {t.visiting.summer}: {marina.officeHours.summer}
                <br />
                {t.visiting.winter}: {marina.officeHours.winter}
              </p>
            </div>
            <div>
              <p className="text-xs font-normal tracking-wide text-navy/40 uppercase">
                {t.visiting.onArrival}
              </p>
              <p className="mt-2 text-sm font-light text-neutral-600">
                {arrivalInstructions}
              </p>
            </div>
            <div>
              <p className="text-xs font-normal tracking-wide text-navy/40 uppercase">
                {t.visiting.byCar}
              </p>
              <p className="mt-2 text-sm font-light text-neutral-600">
                {gettingThere.byCar}
              </p>
            </div>
            <div>
              <p className="text-xs font-normal tracking-wide text-navy/40 uppercase">
                {t.visiting.byTrain}
              </p>
              <p className="mt-2 text-sm font-light text-neutral-600">
                {gettingThere.byTrain}
              </p>
            </div>
            <div>
              <p className="text-xs font-normal tracking-wide text-navy/40 uppercase">
                {t.visiting.byAir}
              </p>
              <p className="mt-2 text-sm font-light text-neutral-600">
                {gettingThere.byAir}
              </p>
            </div>
            <div>
              <p className="text-xs font-normal tracking-wide text-navy/40 uppercase">
                {t.visiting.maxLength}
              </p>
              <p className="mt-2 text-sm font-light text-neutral-600">
                {marina.berths.maxLengthM} m
              </p>
            </div>
            <div>
              <p className="text-xs font-normal tracking-wide text-navy/40 uppercase">
                {t.visiting.maxDraft}
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
            {t.keyFacts.heading}
          </p>
          <div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs font-normal tracking-wide text-navy/40 uppercase">
                {t.keyFacts.berths}
              </p>
              <p className="mt-2 text-lg font-normal text-navy">
                {marina.berths.count}
              </p>
            </div>
            <div>
              <p className="text-xs font-normal tracking-wide text-navy/40 uppercase">
                {t.keyFacts.maxLength}
              </p>
              <p className="mt-2 text-lg font-normal text-navy">
                {marina.berths.maxLengthM} m
              </p>
            </div>
            <div>
              <p className="text-xs font-normal tracking-wide text-navy/40 uppercase">
                {t.keyFacts.maxDraft}
              </p>
              <p className="mt-2 text-lg font-normal text-navy">
                {marina.berths.maxDraftM} m
              </p>
            </div>
            <div>
              <p className="text-xs font-normal tracking-wide text-navy/40 uppercase">
                {t.keyFacts.coordinates}
              </p>
              <p className="mt-2 text-sm font-light text-neutral-600">
                {formatCoordinates(marina.coordinates.lat, marina.coordinates.lng)}
              </p>
            </div>
            <div className="sm:col-span-2 lg:col-span-4">
              <p className="text-xs font-normal tracking-wide text-navy/40 uppercase">
                {t.keyFacts.address}
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
            {t.facilities.heading}
          </p>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {marina.facilities.map((facility) => (
              <div
                key={facility}
                className="flex flex-col items-center gap-3 rounded-sm border border-neutral-200 bg-white px-4 py-6 text-center"
              >
                <FacilityIcon facility={facility} className="h-6 w-6 text-navy" />
                <p className="text-sm font-light text-neutral-600">
                  {t.facilities[facility]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
