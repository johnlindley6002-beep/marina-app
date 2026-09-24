"use client";

import type { Marina } from "../../../../data/marinas";
import { siteConfig } from "../../../../data/site";
import { formatLength } from "../../../../lib/units";
import { useLanguage } from "../../../components/LanguageProvider";
import { useUnits } from "../../../components/UnitsProvider";
import ContactBlock from "./ContactBlock";
import EmergencyNumbers from "./EmergencyNumbers";
import GoogleReviewsBlock from "./GoogleReviewsBlock";

const PROTECTION_LABELS: Record<Marina["protection"]["level"], string> = {
  sheltered: "Sheltered",
  partial: "Partially protected",
  exposed: "Exposed",
};

const PROTECTION_BADGE_CLASSES: Record<Marina["protection"]["level"], string> = {
  sheltered: "border-ink/30 bg-ink/5 text-ink",
  partial: "border-brass bg-brass/15 text-ink",
  exposed: "border-error/50 bg-error/10 text-error",
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
      <span className="font-medium">{PROTECTION_LABELS[protection.level]}</span>
    </div>
  );
}

function formatCoordinates(lat: number, lng: number) {
  const latLabel = lat >= 0 ? "N" : "S";
  const lngLabel = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(3)}° ${latLabel}, ${Math.abs(lng).toFixed(3)}° ${lngLabel}`;
}

type Props = {
  marina: Marina;
  arrivalInstructions: string;
  gettingThere: { byCar: string; byTrain: string; byAir: string };
};

const labelClass = "text-sm font-medium text-ink/80";
const valueClass = "mt-2 text-ink/75";

export default function ApproachInfo({
  marina,
  arrivalInstructions,
  gettingThere,
}: Props) {
  const { t } = useLanguage();
  const { units } = useUnits();

  return (
    <section id="practical-info" className="section scroll-mt-20 px-5 md:px-8">
      <div className="mx-auto max-w-5xl">
        <h2 className="type-heading type-h2 text-ink">
          Approach &amp; practical info
        </h2>

        <div className="mt-6 grid gap-8 sm:grid-cols-3">
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
            <p className={labelClass}>Minimum depth</p>
            <p className={valueClass}>
              {formatLength(marina.berths.minDepthM, units, 1)}
            </p>
          </div>
        </div>

        <p className="measure mt-6 text-ink/75">{marina.entryNote}</p>

        <div className="mt-6">
          <ProtectionTag protection={marina.protection} />
          <p className="mt-2 text-sm text-ink/70">
            {marina.protection.description} General guide only, not a live
            forecast.
          </p>
        </div>

        <div className="mt-8">
          <p className={labelClass}>{t.visiting.onArrival}</p>
          <ul className="mt-3 space-y-2">
            {[arrivalInstructions, ...marina.preArrivalChecklist].map((item) => (
              <li key={item} className="flex items-start gap-2 text-ink/75">
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  className="mt-1 h-4 w-4 shrink-0 text-ink"
                  aria-hidden="true"
                >
                  <path
                    d="M4 10.5l4 4 8-9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
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

        <ContactBlock marina={marina} />
        <EmergencyNumbers marina={marina} embedded />

        <div className="hairline-top mt-12 grid gap-8 pt-8 md:grid-cols-2 md:gap-12">
          <div id="cancellation">
            <h3 className="type-heading type-h3 text-ink">Cancellation policy</h3>
            <p className="measure mt-3 text-ink/75">
              {marina.cancellationPolicy}
            </p>
          </div>
          <div id="privacy" className="scroll-mt-24">
            <h3 className="type-heading type-h3 text-ink">Privacy</h3>
            <p className="measure mt-3 text-ink/75">{siteConfig.privacyNote}</p>
          </div>
        </div>

        <GoogleReviewsBlock marina={marina} />
      </div>
    </section>
  );
}
