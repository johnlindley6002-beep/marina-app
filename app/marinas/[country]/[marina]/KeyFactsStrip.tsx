"use client";

import type { Marina } from "../../../../data/marinas";
import { formatLength } from "../../../../lib/units";
import { useLanguage } from "../../../components/LanguageProvider";
import { useUnits } from "../../../components/UnitsProvider";

type Props = { marina: Marina; description: string };

export default function KeyFactsStrip({ marina, description }: Props) {
  const { t } = useLanguage();
  const { units } = useUnits();

  const facts: { label: string; value: string }[] = [
    { label: t.keyFacts.berths, value: String(marina.berths.count) },
    {
      label: t.keyFacts.maxLength,
      value: formatLength(marina.berths.maxLengthM, units),
    },
    {
      label: t.keyFacts.maxDraft,
      value: formatLength(marina.berths.maxDraftM, units),
    },
    {
      label: "Min depth",
      value: formatLength(marina.berths.minDepthM, units, 1),
    },
    { label: "VHF", value: `Ch ${marina.vhfChannel}` },
    { label: "Location", value: marina.location },
  ];

  return (
    <section className="bg-paper-deep section-tight px-5 md:px-8">
      <div className="mx-auto max-w-5xl">
        <h2 className="sr-only">{t.keyFacts.heading}</h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-6">
          {facts.map((fact) => (
            <div key={fact.label}>
              <dt className="text-sm font-medium text-ink/80">
                {fact.label}
              </dt>
              <dd
                className={`tabular mt-1 font-medium text-ink ${
                  fact.label === "Location" ? "text-base" : "text-lg"
                }`}
              >
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-8 max-w-3xl text-sm leading-relaxed text-ink/75 md:text-base">
          {description}
        </p>
      </div>
    </section>
  );
}
