"use client";

import type { ReactNode } from "react";
import type { Marina } from "@/data/marinas";
import ProtectionIndicator from "./ProtectionIndicator";
import { formatLength } from "@/lib/units";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useUnits } from "@/components/providers/UnitsProvider";

export default function KeyFactsStrip({ marina }: { marina: Marina }) {
  const { t } = useLanguage();
  const { units } = useUnits();

  const facts: { label: string; value: ReactNode }[] = [
    {
      label: t.keyFacts.maxLength,
      value: formatLength(marina.berths.maxLengthM, units),
    },
    {
      label: t.keyFacts.maxDraft,
      value: formatLength(marina.berths.maxDraftM, units),
    },
    {
      label: t.marinaPage.facts.minDepth,
      value: formatLength(marina.berths.minDepthM, units, 1),
    },
    { label: t.marinaPage.facts.vhf, value: t.marinaPage.facts.channelShort(marina.vhfChannel) },
    {
      label: t.marinaPage.facts.protection,
      value: <ProtectionIndicator protection={marina.protection} />,
    },
    { label: t.marinaPage.facts.location, value: marina.location },
  ];

  return (
    <section className="section-tight bg-paper-deep">
      <div className="page-column">
        <h2 className="sr-only">{t.keyFacts.heading}</h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-[repeat(5,auto)_minmax(0,1.6fr)]">
          {facts.map((fact) => (
            <div
              key={fact.label}
              className={
                fact.label === t.marinaPage.facts.location
                  ? "col-span-2 sm:col-span-3 lg:col-span-1"
                  : ""
              }
            >
              <dt className="field-label">{fact.label}</dt>
              <dd
                className={`tabular mt-1 font-medium text-ink ${
                  fact.label === t.marinaPage.facts.location ? "text-base" : "text-lg"
                }`}
              >
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
