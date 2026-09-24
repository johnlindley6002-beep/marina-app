"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useDeferredValue, useEffect, useState } from "react";
import type { Marina } from "../../../../data/marinas";
import { loadBoatProfile, saveBoatProfile } from "../../../../lib/boatProfile";
import { contentLocale, marinaContent } from "../../../../lib/i18n";
import {
  EMPTY_PLAN,
  effectiveDeparture,
  type StayPlan,
} from "../../../../lib/stayPlan";
import PlanYourStay from "./PlanYourStay";
import PriceEstimate from "./PriceEstimate";
import KeyFactsStrip from "./KeyFactsStrip";
import ApproachInfo from "./ApproachInfo";
import AboutMarina from "./AboutMarina";
import Breadcrumbs from "../../../components/Breadcrumbs";
import ChartLinework from "../../../components/ChartLinework";
import FavouriteButton from "../../../components/FavouriteButton";
import FlagIcon from "../../../components/FlagIcon";
import { useLanguage } from "../../../components/LanguageProvider";

// Below-the-fold pieces load as separate chunks, after first paint. They are
// still rendered on the server, so nothing shifts when they arrive.
const BerthAvailabilityMap = dynamic(() => import("./BerthAvailabilityMap"), {
  ssr: false,
  loading: () => (
    <div
      className="surface-lift min-h-[27rem] md:min-h-[48.5rem]"
      aria-hidden="true"
    />
  ),
});
// The enquiry form is the heaviest client piece. It loads after first paint,
// and its measured height is reserved (with the anchor id) so nothing shifts.
const RequestBerthForm = dynamic(() => import("./RequestBerthForm"), {
  ssr: false,
  loading: () => (
    <div
      id="request-berth"
      className="surface-lift scroll-mt-24 min-h-[226rem] md:min-h-[133rem]"
      aria-hidden="true"
    />
  ),
});
const ArrivalActions = dynamic(() => import("./ArrivalActions"));
const FacilitiesGrid = dynamic(() => import("./FacilitiesGrid"));
const StayRecap = dynamic(() => import("./StayRecap"));
const ContactDock = dynamic(() => import("./ContactDock"));

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

  // The map redraws hundreds of berths, so it follows the inputs a beat behind
  // to keep typing responsive.
  const mapArrival = useDeferredValue(plan.arrival);
  const mapDeparture = useDeferredValue(effectiveDeparture(plan));
  const mapLength = useDeferredValue(plan.loa);

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
      <section className="on-ink section relative isolate overflow-hidden bg-gradient-to-br from-ink to-ink-2 px-5">
        <ChartLinework className="absolute inset-0 -z-10 h-full w-full text-paper opacity-[0.07]" />
        <FavouriteButton
          marinaId={marina.id}
          countrySlug={marina.countrySlug}
          marinaName={marina.name}
          tone="light"
          variant="ghost"
          className="absolute top-4 right-4 md:top-6 md:right-6"
        />
        <div className="mx-auto max-w-5xl pt-10 text-center sm:pt-0">
          <p className="flex items-center justify-center gap-2 text-sm text-stone">
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
          <Image
            src={marina.heroImage}
            alt={`${marina.name} logo`}
            width={575}
            height={383}
            loading="eager"
            fetchPriority="high"
            className="mx-auto mt-8 h-auto w-[300px] sm:w-[380px] md:w-[440px]"
          />
          <a
            href="#plan-your-stay"
            className="mt-8 inline-flex min-h-12 items-center rounded-[3px] bg-brass px-8 text-base font-medium text-ink transition-[filter] hover:brightness-105"
          >
            Request a berth
          </a>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-5 py-4 text-ink/70 md:px-8">
        <Breadcrumbs
          items={[
            { label: t.breadcrumbs.marinas, href: "/marinas" },
            { label: marina.country, href: `/marinas/${marina.countrySlug}` },
            { label: marina.name },
          ]}
        />
      </div>

      <KeyFactsStrip marina={marina} />

      <section
        id="plan-your-stay"
        className="section-tight scroll-mt-24 px-5 md:px-8"
      >
        <div className="mx-auto max-w-5xl space-y-10 md:space-y-14">
          <PlanYourStay
            marina={marina}
            plan={plan}
            onPlanChange={onPlanChange}
          />

          <BerthAvailabilityMap
            marinaName={marina.name}
            marinaEmail={marina.email}
            transientRates={marina.transientRates}
            vatRate={marina.vatRate}
            onBerthSelect={setSelectedBerthId}
            controlled={{
              arrival: mapArrival,
              departure: mapDeparture,
              lengthM: mapLength,
            }}
          />

          <div id="price-estimate" className="scroll-mt-24">
            <PriceEstimate
              marina={marina}
              plan={plan}
              onPlanChange={onPlanChange}
              selectedBerthId={selectedBerthId}
            />
          </div>

          <RequestBerthForm
            marina={marina}
            plan={plan}
            onPlanChange={onPlanChange}
            selectedBerthId={selectedBerthId}
            rebookToken={rebookToken}
          />

          <div>
            <ArrivalActions
              marina={marina}
              plan={plan}
              selectedBerthId={selectedBerthId}
            />
            <StayRecap
              embedded
              marina={marina}
              onRebook={() => setRebookToken((n) => n + 1)}
            />
            <div className="hairline-top mt-10 pt-6">
              <a
                href="#contact-details"
                className="inline-flex min-h-11 items-center text-ink underline underline-offset-4 hover:text-ink-2"
              >
                General question? See the contact details
              </a>
            </div>
          </div>
        </div>
      </section>

      <ApproachInfo
        marina={marina}
        arrivalInstructions={arrivalInstructions}
        gettingThere={gettingThere}
      />

      <section className="section bg-paper-deep px-5 md:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="type-heading type-h2 text-ink">
            {t.facilities.heading}
          </h2>
          <FacilitiesGrid facilities={marina.facilityDetails} />
        </div>
      </section>

      <AboutMarina marina={marina} description={description} />

      <section className="px-5 pb-10 md:px-8 md:pb-14">
        <div className="hairline-top mx-auto flex max-w-5xl flex-col gap-4 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="type-heading type-h3 text-ink">
            Ready to plan your visit?
          </p>
          <a
            href="#request-berth"
            className="inline-flex min-h-12 items-center justify-center rounded-[3px] bg-brass px-8 text-base font-medium text-ink transition-[filter] hover:brightness-105"
          >
            Request a berth
          </a>
        </div>
      </section>

      <ContactDock marina={marina} />
    </>
  );
}
