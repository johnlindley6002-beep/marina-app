"use client";

import type { Marina } from "@/data/marinas";
import { useLanguage } from "@/components/providers/LanguageProvider";
import Disclosure from "@/components/ui/Disclosure";
import NearbyPlaces from "./NearbyPlaces";
import PhotoGallery from "./PhotoGallery";

type Props = {
  marina: Marina;
  description: string;
};

export default function AboutMarina({ marina, description }: Props) {
  const { t } = useLanguage();
  const photos = marina.photos.filter((photo) => !photo.placeholder);

  return (
    <section className="section-editorial">
      <div className="page-column">
        <h2 className="type-statement text-ink">About {marina.name}</h2>
        <Disclosure
          previewLines={2}
          label="Read more"
          openLabel="Show less"
          className="measure stack-md"
        >
          <p className="text-ink-soft">{description}</p>
        </Disclosure>

        <dl className="mt-10">
          <div>
            <dt className="field-label">{t.keyFacts.berths}</dt>
            <dd className="tabular mt-1 text-lg font-medium text-ink">{marina.berths.count}</dd>
          </div>
        </dl>

        {photos.length > 0 ? (
          <div className="stack-lg">
            <hr className="mb-10 border-hairline" />
            <h3 className="type-heading type-h3 mb-6 text-ink">Photos</h3>
            <PhotoGallery photos={photos} />
          </div>
        ) : null}

        <NearbyPlaces marina={marina} />
      </div>
    </section>
  );
}
