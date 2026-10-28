"use client";

import type { Marina } from "@/data/marinas";
import { ACCOUNT_DATA_SOURCE } from "@/lib/data";
import { formatCoordinates } from "@/lib/geo";
import { formatLength } from "@/lib/units";
import { useLanguage } from "@/components/providers/LanguageProvider";
import Disclosure from "@/components/ui/Disclosure";
import ProtectionIndicator, { ProtectionWhy } from "./ProtectionIndicator";
import { useUnits } from "@/components/providers/UnitsProvider";
import ContactBlock from "./ContactBlock";
import EmergencyNumbers from "./EmergencyNumbers";
import GoogleReviewsBlock from "./GoogleReviewsBlock";
import OfflineCard from "./OfflineCard";

type Props = {
  marina: Marina;
  arrivalInstructions: string;
  gettingThere: { byCar: string; byTrain: string; byAir: string };
};

const labelClass = "field-label";
const valueClass = "mt-2 text-ink-soft";

export default function ApproachInfo({ marina, arrivalInstructions, gettingThere }: Props) {
  const { t } = useLanguage();
  const copy = t.marinaPage.approach;
  const { units } = useUnits();

  return (
    <section id="practical-info" className="section-editorial scroll-mt-20">
      <div className="page-column">
        <h2 className="type-statement text-ink">{copy.heading}</h2>

        {/* The four essentials */}
        <div className="stack-md grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className={labelClass}>{t.visiting.hailing}</p>
            <p className={valueClass}>{t.visiting.vhfChannel(marina.vhfChannel)}</p>
          </div>
          <div>
            <p className={labelClass}>{t.visiting.officeHours}</p>
            <p className={valueClass}>
              {t.visiting.summer}: {marina.officeHours.summer}
              <br />
              {t.visiting.winter}: {marina.officeHours.winter}
            </p>
          </div>
          <div>
            <p className={labelClass}>{copy.minDepth}</p>
            <p className={valueClass}>{formatLength(marina.berths.minDepthM, units, 1)}</p>
          </div>
          <div>
            <p className={labelClass}>{copy.protection}</p>
            <p className={valueClass}>
              <ProtectionIndicator protection={marina.protection} />
            </p>
          </div>
        </div>
        <div className="mt-4">
          <ProtectionWhy protection={marina.protection} />
        </div>

        <div className="mt-10 space-y-1">
          <Disclosure label={copy.moreArrival} openLabel={copy.fewerArrival}>
            <div className="pt-2 pb-4">
              <p className="measure text-ink-soft">{marina.entryNote}</p>
              <p className={`${labelClass} mt-6`}>{t.visiting.onArrival}</p>
              <ul className="mt-3 space-y-2">
                {[arrivalInstructions, ...marina.preArrivalChecklist].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-ink-soft">
                    <svg
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      className="mt-1 h-4 w-4 shrink-0 text-ink"
                      aria-hidden="true"
                    >
                      <path d="M4 10.5l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Disclosure>

          <Disclosure label={copy.gettingThere} openLabel={copy.hideGettingThere}>
            <div className="grid gap-8 pt-2 pb-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className={labelClass}>{t.visiting.byCar}</p>
                <p className={valueClass}>{gettingThere.byCar}</p>
              </div>
              <div>
                <p className={labelClass}>{t.visiting.byTrain}</p>
                <p className={valueClass}>{gettingThere.byTrain}</p>
              </div>
              <div>
                <p className={labelClass}>{t.visiting.byAir}</p>
                <p className={valueClass}>{gettingThere.byAir}</p>
              </div>
              <div>
                <p className={labelClass}>{t.keyFacts.coordinates}</p>
                <p className={`${valueClass} tabular`}>
                  {formatCoordinates(marina.coordinates.lat, marina.coordinates.lng)}
                </p>
              </div>
            </div>
          </Disclosure>
        </div>

        <ContactBlock marina={marina} />
        <EmergencyNumbers marina={marina} embedded />

        <div id="cancellation" className="stack-lg scroll-mt-24">
          <hr className="mb-10 border-hairline" />
          <h3 className="type-heading type-h3 text-ink">{copy.cancellation}</h3>
          <p className="measure mt-3 text-ink-soft">{marina.cancellationPolicy}</p>
          <Disclosure
            hashId="privacy"
            label={copy.dataHandled}
            openLabel={copy.hideDataHandled}
            className="mt-4"
          >
            <p className="measure pt-2 pb-2 text-ink-soft">
              {ACCOUNT_DATA_SOURCE === "supabase" ? t.accounts.privacyNote : t.chrome.privacyNote}
            </p>
          </Disclosure>
        </div>

        <GoogleReviewsBlock marina={marina} />
        <OfflineCard marina={marina} embedded />
      </div>
    </section>
  );
}
