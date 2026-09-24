"use client";

import dynamic from "next/dynamic";
import { useCallback, useDeferredValue, useEffect, useRef, useState } from "react";
import type { Marina } from "../../../../data/marinas";
import { loadBoatProfile, saveBoatProfile } from "../../../../lib/boatProfile";
import { contentLocale, marinaContent } from "../../../../lib/i18n";
import {
  EMPTY_PLAN,
  effectiveDeparture,
  type StayPlan,
} from "../../../../lib/stayPlan";
import { useBoats } from "../../../components/BoatProvider";
import FuelPrices from "./FuelPrices";
import MarinaHero from "./MarinaHero";
import { GalleryProvider } from "./PhotoGallery";
import PlanYourStay from "./PlanYourStay";
import PriceEstimate from "./PriceEstimate";
import KeyFactsStrip from "./KeyFactsStrip";
import ApproachInfo from "./ApproachInfo";
import AboutMarina from "./AboutMarina";
import Breadcrumbs from "../../../components/Breadcrumbs";
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

  // When the active boat changes (here or in My boat), its sizes replace the
  // ones in the plan.
  const { ready: boatsReady, activeBoat } = useBoats();
  const seenBoat = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (!boatsReady) return;
    const id = activeBoat?.id ?? null;
    if (seenBoat.current === undefined) {
      seenBoat.current = id;
      return;
    }
    if (seenBoat.current !== id) {
      seenBoat.current = id;
      if (activeBoat) {
        onPlanChange({
          loa: activeBoat.loa,
          beam: activeBoat.beam,
          draft: activeBoat.draft,
        });
      }
    }
  }, [boatsReady, activeBoat, onPlanChange]);

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

  const galleryPhotos = marina.photos.filter((photo) => !photo.placeholder);

  return (
    <GalleryProvider photos={galleryPhotos}>
      <MarinaHero marina={marina} />

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
          <FuelPrices marina={marina} />
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
    </GalleryProvider>
  );
}
