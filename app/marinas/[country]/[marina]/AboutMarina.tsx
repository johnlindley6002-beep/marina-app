"use client";

import type { Marina } from "../../../../data/marinas";
import { useLanguage } from "../../../components/LanguageProvider";
import NearbyPlaces from "./NearbyPlaces";
import PhotoStrip from "./PhotoStrip";

type Props = {
  marina: Marina;
  description: string;
};

export default function AboutMarina({ marina, description }: Props) {
  const { t } = useLanguage();
  const photos = marina.photos.filter((photo) => !photo.placeholder);

  return (
    <section className="section px-5 md:px-8">
      <div className="mx-auto max-w-5xl">
        <h2 className="type-heading type-h2 text-ink">About {marina.name}</h2>
        <p className="measure mt-6 text-lg text-ink/75">{description}</p>

        <dl className="mt-6">
          <div>
            <dt className="text-sm font-medium text-ink/80">
              {t.keyFacts.berths}
            </dt>
            <dd className="tabular mt-1 text-lg font-medium text-ink">
              {marina.berths.count}
            </dd>
          </div>
        </dl>

        {photos.length > 0 ? (
          <div className="hairline-top mt-12 pt-8">
            <h3 className="type-heading type-h3 mb-6 text-ink">Photos</h3>
            <PhotoStrip photos={photos} />
          </div>
        ) : null}

        <NearbyPlaces marina={marina} />
      </div>
    </section>
  );
}
