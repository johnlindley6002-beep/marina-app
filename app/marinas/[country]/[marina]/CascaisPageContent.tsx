"use client";

import Image from "next/image";
import { useState } from "react";
import type { Marina } from "../../../../data/marinas";
import {
  CLASS_LENGTH_RANGES,
  MARINA_CLASS_ORDER,
} from "../../../../data/marinas";
import { marinaContent } from "../../../../lib/i18n";
import BerthAvailabilityMap from "./BerthAvailabilityMap";
import RequestBerthForm from "./RequestBerthForm";
import BoatFitCheck from "./BoatFitCheck";
import PhotoStrip from "./PhotoStrip";
import ArrivalActions from "./ArrivalActions";
import FacilitiesGrid from "./FacilitiesGrid";
import Breadcrumbs from "../../../components/Breadcrumbs";
import FlagIcon from "../../../components/FlagIcon";
import { useLanguage } from "../../../components/LanguageProvider";

function formatCoordinates(lat: number, lng: number) {
  const latLabel = lat >= 0 ? "N" : "S";
  const lngLabel = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(3)}° ${latLabel}, ${Math.abs(lng).toFixed(3)}° ${lngLabel}`;
}

const PROTECTION_LABELS: Record<Marina["protection"]["level"], string> = {
  sheltered: "Sheltered",
  partial: "Partially protected",
  exposed: "Exposed",
};

const PROTECTION_BADGE_CLASSES: Record<Marina["protection"]["level"], string> = {
  sheltered: "border-emerald-200 bg-emerald-50 text-emerald-700",
  partial: "border-amber-200 bg-amber-50 text-amber-700",
  exposed: "border-red-200 bg-red-50 text-red-700",
};

function ProtectionTag({ protection }: { protection: Marina["protection"] }) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm ${PROTECTION_BADGE_CLASSES[protection.level]}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="h-4 w-4 shrink-0"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 15c1.5 1.2 3 1.2 4.5 0s3-1.2 4.5 0 3 1.2 4.5 0 3-1.2 4.5 0M3 19c1.5 1.2 3 1.2 4.5 0s3-1.2 4.5 0 3 1.2 4.5 0 3-1.2 4.5 0M12 3v9m0 0-3-3m3 3 3-3"
        />
      </svg>
      <span className="font-normal">{PROTECTION_LABELS[protection.level]}</span>
    </div>
  );
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
  const [selectedBerthId, setSelectedBerthId] = useState<string | null>(null);

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
      <section className="bg-navy px-6 py-16 md:py-24">
        <div className="mx-auto max-w-5xl text-center">
          <p className="flex items-center justify-center gap-2 text-xs font-normal tracking-[0.25em] text-white/60 uppercase">
            <FlagIcon countryCode={marina.countryCode} className="h-3 w-auto" />
            {marina.country}
            {marina.clubBurgee ? (
              <>
                <span className="text-white/30">·</span>
                <img
                  src={marina.clubBurgee.src}
                  alt={marina.clubBurgee.name}
                  className="h-4 w-auto"
                />
              </>
            ) : null}
          </p>
          <h1 className="sr-only">{marina.name}</h1>
          <Image
            src={marina.heroImage}
            alt={`${marina.name} logo`}
            width={575}
            height={383}
            priority
            className="mx-auto mt-6 h-auto w-[220px] sm:w-[260px] md:w-[300px]"
          />
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
          <p className="text-xs font-normal tracking-[0.25em] text-navy/40 uppercase">
            Approach &amp; entry
          </p>
          <div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs font-normal tracking-wide text-navy/40 uppercase">
                VHF channel
              </p>
              <p className="mt-2 text-sm font-light text-neutral-600">
                {marina.vhfChannel}
              </p>
            </div>
            <div>
              <p className="text-xs font-normal tracking-wide text-navy/40 uppercase">
                Office hours
              </p>
              <p className="mt-2 text-sm font-light text-neutral-600">
                {t.visiting.summer}: {marina.officeHours.summer}
                <br />
                {t.visiting.winter}: {marina.officeHours.winter}
              </p>
            </div>
            <div>
              <p className="text-xs font-normal tracking-wide text-navy/40 uppercase">
                Minimum depth
              </p>
              <p className="mt-2 text-sm font-light text-neutral-600">
                {marina.berths.minDepthM.toFixed(1)} m
              </p>
            </div>
            <div>
              <p className="text-xs font-normal tracking-wide text-navy/40 uppercase">
                Outside office hours
              </p>
              <p className="mt-2 text-sm font-light text-neutral-600">
                {marina.outsideHoursInstructions}
              </p>
            </div>
          </div>
          <p className="mt-6 max-w-3xl text-sm leading-relaxed font-light text-neutral-600">
            {marina.entryNote}
          </p>
          <div className="mt-6">
            <ProtectionTag protection={marina.protection} />
            <p className="mt-2 text-xs font-light text-neutral-400">
              {marina.protection.description} General guide only — not a live
              forecast.
            </p>
          </div>
          <ArrivalActions marina={marina} selectedBerthId={selectedBerthId} />
        </div>
      </section>

      <section className="px-6 pb-12 md:px-8 md:pb-16">
        <div className="mx-auto max-w-5xl">
          <BoatFitCheck marina={marina} />
        </div>
      </section>

      <section className="px-6 pb-12 md:px-8 md:pb-16">
        <div className="mx-auto max-w-5xl">
          <p className="mb-4 text-xs font-normal tracking-[0.25em] text-navy/40 uppercase">
            Photos
          </p>
          <PhotoStrip photos={marina.photos} />
        </div>
      </section>

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
            onBerthSelect={setSelectedBerthId}
          />
        </div>
      </section>

      <section className="px-6 pb-16 md:px-8">
        <div className="mx-auto max-w-5xl">
          <RequestBerthForm
            marina={marina}
            initialArrival={initialArrival}
            initialDeparture={initialDeparture}
            initialLength={initialLength}
            selectedBerthId={selectedBerthId}
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
          <FacilitiesGrid facilities={marina.facilityDetails} />
        </div>
      </section>
    </>
  );
}
