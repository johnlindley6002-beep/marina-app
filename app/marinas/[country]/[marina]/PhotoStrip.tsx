import Image from "next/image";

type Photo = { src: string; alt: string; caption: string; credit?: string };

export default function PhotoStrip({ photos }: { photos: Photo[] }) {
  if (photos.length === 0) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {photos.map((photo) => (
        <figure key={photo.src}>
          {/* TODO: replace with a real photo */}
          <div className="relative aspect-[4/3] overflow-hidden rounded-sm border border-neutral-200">
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              loading="lazy"
              sizes="(max-width: 640px) 100vw, 33vw"
              className="object-cover"
            />
          </div>
          <figcaption className="mt-2 text-sm font-light text-neutral-500">
            {photo.caption}
            {photo.credit ? (
              <span className="block text-xs text-neutral-500">
                {photo.credit}
              </span>
            ) : null}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
