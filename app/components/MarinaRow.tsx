"use client";

import Image from "next/image";
import Link from "next/link";
import {
  MARINA_CLASS_ORDER,
  type Marina,
} from "../../data/marinas";
import { formatLength } from "../../lib/units";
import FavouriteButton from "./FavouriteButton";
import { useLanguage } from "./LanguageProvider";
import { useUnits } from "./UnitsProvider";

type Props = {
  marina: Marina;
  // Carries the search's dates and length through to the marina page.
  search?: string;
  highlighted?: boolean;
  onHover?: (id: string | null) => void;
};

export default function MarinaRow({
  marina,
  search = "",
  highlighted,
  onHover,
}: Props) {
  const { t } = useLanguage();
  const { units } = useUnits();

  const cheapest = Math.min(
    ...MARINA_CLASS_ORDER.map((c) => marina.transientRates[c].low)
  );

  return (
    <li
      className={`hairline-top relative first:border-t-0 ${
        highlighted ? "bg-paper-deep/60" : ""
      }`}
      onMouseEnter={() => onHover?.(marina.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      <Link
        href={`/marinas/${marina.countrySlug}/${marina.id}${search}`}
        className="group grid gap-5 py-8 sm:grid-cols-[auto_1fr_auto] sm:items-start"
      >
        {marina.coverImage ? (
          <Image
            src={marina.coverImage.src}
            alt={marina.coverImage.alt}
            width={160}
            height={120}
            className="h-24 w-32 rounded-[3px] object-cover"
          />
        ) : null}

        <div className="min-w-0 sm:col-start-2">
          <h2 className="type-heading flex items-center gap-3 text-2xl text-ink">
            {marina.name}
            {marina.clubBurgee ? (
              <Image
                src={marina.clubBurgee.src}
                alt={marina.clubBurgee.name}
                width={1772}
                height={1063}
                className="h-4 w-auto"
              />
            ) : null}
          </h2>
          <p className="mt-1 text-ink/70">{marina.location}</p>
          <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3">
            <div>
              <dt className="text-sm text-ink/70">{t.keyFacts.berths}</dt>
              <dd className="tabular font-medium text-ink">
                {marina.berths.count}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-ink/70">{t.keyFacts.maxLength}</dt>
              <dd className="tabular font-medium text-ink">
                {formatLength(marina.berths.maxLengthM, units)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-ink/70">{t.results.from}</dt>
              <dd className="tabular font-medium text-ink">
                €{cheapest.toFixed(2)}
              </dd>
            </div>
          </dl>
        </div>

        <span className="text-ink underline decoration-brass decoration-2 underline-offset-[6px] sm:col-start-3 sm:row-start-1">
          {t.countryPage.viewMarina}
        </span>
      </Link>
      <FavouriteButton
        marinaId={marina.id}
        countrySlug={marina.countrySlug}
        marinaName={marina.name}
        className="absolute right-0 bottom-6"
      />
    </li>
  );
}
