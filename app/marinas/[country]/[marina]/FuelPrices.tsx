"use client";

import type { Marina, Timestamped } from "../../../../data/marinas";
import LastUpdated from "../../../components/LastUpdated";

// Fuel prices per litre, exactly as the marina supplied them. With no price
// on file a card says so and sends the reader to the fuel dock, and shows no
// "Updated" line, so nothing looks current that is not.
export function formatFuelPrice(perLitre: number): string {
  return `€${perLitre.toFixed(3)}`;
}

function FuelCard({
  label,
  entry,
}: {
  label: string;
  entry: Timestamped<number | null>;
}) {
  return (
    <div className="hairline-top pt-4">
      <dt className="field-label">{label}</dt>
      <dd className="mt-1">
        {entry.value !== null ? (
          <>
            <span className="type-heading tabular text-3xl text-ink">
              {formatFuelPrice(entry.value)}
            </span>{" "}
            <span className="text-ink/75">per litre</span>
            <LastUpdated date={entry.lastUpdated} className="mt-1 block" />
          </>
        ) : (
          <span className="text-ink/75">Price at the fuel dock</span>
        )}
      </dd>
    </div>
  );
}

export default function FuelPrices({ marina }: { marina: Marina }) {
  return (
    <div className="stack-md">
      <h3 className="type-heading type-h3 text-ink">Fuel prices</h3>
      <dl className="mt-4 grid gap-x-10 gap-y-6 sm:grid-cols-2">
        <FuelCard label="Diesel" entry={marina.fuelPrices.diesel} />
        <FuelCard label="Petrol (RON 95)" entry={marina.fuelPrices.ron95} />
      </dl>
      <p className="mt-4 text-sm text-ink/70">
        Set by the marina and changed often. Confirm at the fuel dock.
      </p>
    </div>
  );
}
