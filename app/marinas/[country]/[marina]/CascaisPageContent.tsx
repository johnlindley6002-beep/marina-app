"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import type { Marina } from "../../../../data/marinas";
import { loadBoatProfile, saveBoatProfile } from "../../../../lib/boatProfile";
import { contentLocale, marinaContent } from "../../../../lib/i18n";
import {
  EMPTY_PLAN,
  effectiveDeparture,
  type StayPlan,
} from "../../../../lib/stayPlan";
import BerthAvailabilityMap from "./BerthAvailabilityMap";
import PlanYourStay from "./PlanYourStay";
import PriceEstimate from "./PriceEstimate";
import KeyFactsStrip from "./KeyFactsStrip";
import ApproachInfo from "./ApproachInfo";
import ActionZone from "./ActionZone";
import PhotoStrip from "./PhotoStrip";
import FacilitiesGrid from "./FacilitiesGrid";
import TrustSection from "./TrustSection";
import OfflineCard from "./OfflineCard";
import StayRecap from "./StayRecap";
import ContactDock from "./ContactDock";
import Breadcrumbs from "../../../components/Breadcrumbs";
import FavouriteButton from "../../../components/FavouriteButton";
import FlagIcon from "../../../components/FlagIcon";
import { useLanguage } from "../../../components/LanguageProvider";

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
  const cl = contentLocale(locale);

  const [selectedBerthId, setSelectedBerthId] = useState<string | null>(null);
  const [rebookToken, setRebookToken] = useState(0);
  const [plan, setPlan] = useState<StayPlan>({
    ...EMPTY_PLAN,
    arrival: initialArrival ?? "",
    departure: initialDeparture ?? "",
    loa: initialLength ?? "",
  });

  const onPlanChange = useCallback((patch: Partial<StayPlan>) => {
    setPlan((p) => ({ ...p, ...patch }));
  }, []);

  // Fill boat dimensions from the last ones used anywhere on the site.
  useEffect(() => {
    const saved = loadBoatProfile();
    setPlan((p) => ({
      ...p,
      loa: p.loa || saved.loa,
      beam: p.beam || saved.beam,
      draft: p.draft || saved.draft,
    }));
  }, []);

  useEffect(() => {
    if (plan.loa || plan.beam || plan.draft) {
      saveBoatProfile({ loa: plan.loa, beam: plan.beam, draft: plan.draft });
    }
  }, [plan.loa, plan.beam, plan.draft]);

  const description = content?.description[cl] ?? marina.description;
  const arrivalInstructions =
    content?.arrivalInstructions[cl] ?? marina.arrivalInstructions;
  const gettingThere = {
    byCar: content?.gettingThere.byCar[cl] ?? marina.gettingThere.byCar,
    byTrain: content?.gettingThere.byTrain[cl] ?? marina.gettingThere.byTrain,
    byAir: content?.gettingThere.byAir[cl] ?? marina.gettingThere.byAir,
  };

  return (
    <>
      <section className="on-navy bg-navy px-6 py-16 md:py-24">
        <div className="mx-auto max-w-5xl text-center">
          <p className="flex items-center justify-center gap-2 text-xs font-normal tracking-[0.25em] text-white/60 uppercase">
            <FlagIcon countryCode={marina.countryCode} className="h-3 w-auto" />
            {marina.country}
            {marina.clubBurgee ? (
              <>
                <span className="text-white/60">·</span>
                <Image
                  src={marina.clubBurgee.src}
                  alt={marina.clubBurgee.name}
                  width={1772}
                  height={1063}
                  className="h-4 w-auto"
                />
              </>
            ) : null}
          </p>
          <h1 className="sr-only">{marina.name}</h1>
          <FavouriteButton
            marinaId={marina.id}
            countrySlug={marina.countrySlug}
            marinaName={marina.name}
            tone="light"
            className="mt-4"
          />
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

      <KeyFactsStrip marina={marina} description={description} />

      <section
        id="plan-your-stay"
        className="scroll-mt-24 px-6 py-12 md:px-8 md:py-16"
      >
        <div className="mx-auto max-w-5xl">
          <PlanYourStay
            marina={marina}
            plan={plan}
            onPlanChange={onPlanChange}
          />
        </div>
      </section>

      <section className="px-6 pb-12 md:px-8 md:pb-16">
        <div className="mx-auto max-w-5xl">
          <BerthAvailabilityMap
            marinaName={marina.name}
            marinaEmail={marina.email}
            transientRates={marina.transientRates}
            vatRate={marina.vatRate}
            onBerthSelect={setSelectedBerthId}
            controlled={{
              arrival: plan.arrival,
              departure: effectiveDeparture(plan),
              lengthM: plan.loa,
            }}
          />
        </div>
      </section>

      <section id="price-estimate" className="scroll-mt-24 px-6 py-12 md:px-8 md:py-16">
        <PriceEstimate
          marina={marina}
          plan={plan}
          onPlanChange={onPlanChange}
          selectedBerthId={selectedBerthId}
        />
      </section>

      <section className="px-6 pb-12 md:px-8 md:pb-16">
        <div className="mx-auto max-w-5xl">
          <p className="mb-4 text-xs font-normal tracking-[0.25em] text-navy/60 uppercase">
            Photos
          </p>
          <PhotoStrip photos={marina.photos} />
        </div>
      </section>

      <ApproachInfo
        marina={marina}
        arrivalInstructions={arrivalInstructions}
        gettingThere={gettingThere}
      />

      <section className="bg-neutral-50 px-6 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-normal tracking-wide text-navy/60 uppercase">
            {t.facilities.heading}
          </p>
          <FacilitiesGrid facilities={marina.facilityDetails} />
        </div>
      </section>

      <TrustSection marina={marina} />

      <ActionZone
        marina={marina}
        plan={plan}
        onPlanChange={onPlanChange}
        selectedBerthId={selectedBerthId}
        rebookToken={rebookToken}
      />

      <StayRecap
        marina={marina}
        onRebook={() => setRebookToken((n) => n + 1)}
      />
      <OfflineCard marina={marina} />
      <ContactDock marina={marina} />
    </>
  );
}
