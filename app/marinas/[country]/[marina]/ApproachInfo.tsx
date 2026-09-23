"use client";

import type { Marina } from "../../../../data/marinas";
import { formatLength } from "../../../../lib/units";
import { useLanguage } from "../../../components/LanguageProvider";
import { useUnits } from "../../../components/UnitsProvider";
import EmergencyNumbers from "./EmergencyNumbers";

const PROTECTION_LABELS: Record<Marina["protection"]["level"], string> = {
  sheltered: "Sheltered",
  partial: "Partially protected",
  exposed: "Exposed",
};

const PROTECTION_BADGE_CLASSES: Record<Marina["protection"]["level"], string> = {
  sheltered: "border-emerald-200 bg-emerald-50 text-emerald-700",
  partial: "border-amber-200 bg-amber-50 text-amber-800",
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

const labelClass = "text-xs font-normal tracking-wide text-navy/60 uppercase";
const valueClass = "mt-2 text-sm font-light text-neutral-600";

export default function ApproachInfo({
  marina,
  arrivalInstructions,
  gettingThere,
}: Props) {
  const { t } = useLanguage();
  const { units } = useUnits();

  return (
    <section className="px-6 py-16 md:px-8 md:py-24">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-normal tracking-[0.25em] text-navy/60 uppercase">
          Approach &amp; practical info
        </p>

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

        <p className="mt-6 max-w-3xl text-sm leading-relaxed font-light text-neutral-600">
          {marina.entryNote}
        </p>

        <div className="mt-6">
          <ProtectionTag protection={marina.protection} />
          <p className="mt-2 text-xs font-light text-neutral-500">
            {marina.protection.description} General guide only — not a live
            forecast.
          </p>
        </div>

        <div className="mt-8">
          <p className={labelClass}>{t.visiting.onArrival}</p>
          <ul className="mt-3 space-y-2">
            {[arrivalInstructions, ...marina.preArrivalChecklist].map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-sm font-light text-neutral-600"
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  className="mt-0.5 h-4 w-4 shrink-0 text-navy"
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

        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
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
            <p className={labelClass}>{t.keyFacts.address}</p>
            <p className={valueClass}>{marina.address}</p>
          </div>
          <div>
            <p className={labelClass}>{t.keyFacts.coordinates}</p>
            <p className={valueClass}>
              {formatCoordinates(marina.coordinates.lat, marina.coordinates.lng)}
            </p>
          </div>
        </div>

        <EmergencyNumbers marina={marina} embedded />
      </div>
    </section>
  );
}
