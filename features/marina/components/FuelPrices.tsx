"use client";

import type { Marina, Timestamped } from "@/data/marinas";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useFormat } from "@/components/providers/useFormat";
import LastUpdated from "@/components/ui/LastUpdated";

// Fuel prices per litre, exactly as the marina supplied them. With no price
// on file a card says so and sends the reader to the fuel dock, and shows no
// "Updated" line, so nothing looks current that is not.
function FuelCard({ label, entry }: { label: string; entry: Timestamped<number | null> }) {
  const { t } = useLanguage();
  const { moneyPrecise } = useFormat();
  return (
    <div className="hairline-top pt-4">
      <dt className="field-label">{label}</dt>
      <dd className="mt-1">
        {entry.value !== null ? (
          <>
            <span className="type-heading tabular text-3xl text-ink">
              {moneyPrecise(entry.value, 3)}
            </span>{" "}
            <span className="text-ink-soft">{t.marinaPage.fuel.perLitre}</span>
            <LastUpdated date={entry.lastUpdated} className="mt-1 block" />
          </>
        ) : (
          <span className="text-ink-soft">{t.marinaPage.fuel.atDock}</span>
        )}
      </dd>
    </div>
  );
}

export default function FuelPrices({ marina }: { marina: Marina }) {
  const { t } = useLanguage();
  const copy = t.marinaPage.fuel;
  return (
    <div className="stack-md">
      <h3 className="type-heading type-h3 text-ink">{copy.heading}</h3>
      <dl className="mt-4 grid gap-x-10 gap-y-6 sm:grid-cols-2">
        <FuelCard label={copy.diesel} entry={marina.fuelPrices.diesel} />
        <FuelCard label={copy.petrol} entry={marina.fuelPrices.ron95} />
      </dl>
      <p className="mt-4 text-sm text-ink-muted">{copy.note}</p>
    </div>
  );
}
