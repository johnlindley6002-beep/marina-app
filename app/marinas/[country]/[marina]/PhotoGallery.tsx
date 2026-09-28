"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type Photo = { src: string; alt: string; caption: string; credit?: string };

// The viewer is only fetched the first time someone opens a photo.
const Lightbox = dynamic(() => import("./Lightbox"), { ssr: false });

// Tiles shown before the rest move into the viewer only.
const MAX_TILES = 5;

type GalleryContextValue = { count: number; open: (index?: number) => void };

const GalleryContext = createContext<GalleryContextValue>({
  count: 0,
  open: () => {},
});

export function useGallery() {
  return useContext(GalleryContext);
}

// Owns the one lightbox on the page, so the hero and the gallery below open
// the same viewer.
export function GalleryProvider({
  photos,
  children,
}: {
  photos: Photo[];
  children: ReactNode;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const opener = useRef<HTMLElement | null>(null);

  const open = useCallback(
    (index = 0) => {
      if (photos.length === 0) return;
      opener.current = document.activeElement as HTMLElement | null;
      setOpenIndex(index);
    },
    [photos.length]
  );

  function close() {
    setOpenIndex(null);
    const target = opener.current;
    setTimeout(() => target?.focus(), 0);
  }

  const value = useMemo(
    () => ({ count: photos.length, open }),
    [photos.length, open]
  );

  return (
    <GalleryContext.Provider value={value}>
      {children}
      {openIndex !== null ? (
        <Lightbox
          photos={photos}
          index={openIndex}
          onIndexChange={setOpenIndex}
          onClose={close}
        />
      ) : null}
    </GalleryContext.Provider>
  );
}

// Layout per photo count. Mobile is a swipeable row; from md up it is a
// mosaic with a fixed height, so no image can move the page.
function tileClass(count: number, i: number): string {
  if (count < 3) return "";
  if (i === 0) return "md:col-span-2 md:row-span-2";
  // Four tiles: the last one spans the bottom right so the mosaic has no gap.
  if (count === 4 && i === 3) return "md:col-span-2";
  return "";
}

function gridClass(count: number): string {
  if (count === 1) return "md:grid-cols-1";
  if (count === 2) return "md:grid-cols-2 md:grid-rows-1";
  if (count === 3) return "md:grid-cols-3 md:grid-rows-2";
  return "md:grid-cols-4 md:grid-rows-2";
}

export default function PhotoGallery({ photos }: { photos: Photo[] }) {
  const { open } = useGallery();

  if (photos.length === 0) return null;

  const tiles = photos.slice(0, MAX_TILES);
  const count = tiles.length;
  const hiddenCount = photos.length - tiles.length;

  return (
    <div>
      <div
        role="group"
        aria-label="Photos"
        className={`flex snap-x snap-mandatory gap-3 overflow-x-auto md:grid md:h-[28rem] md:snap-none md:overflow-visible ${gridClass(count)}`}
      >
        {tiles.map((photo, i) => (
          <button
            key={photo.src}
            type="button"
            onClick={() => open(i)}
            className={`group relative aspect-[4/3] shrink-0 basis-[85%] snap-center overflow-hidden rounded-[3px] focus-visible:-outline-offset-4 md:aspect-auto md:basis-auto ${tileClass(count, i)}`}
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              loading="lazy"
              sizes={
                i === 0 && count > 1
                  ? "(max-width: 768px) 85vw, 50vw"
                  : count === 1
                    ? "(max-width: 1024px) 100vw, 1024px"
                    : "(max-width: 768px) 85vw, 25vw"
              }
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transition-none"
            />
            <span className="sr-only">Open photo: {photo.caption}</span>
            {hiddenCount > 0 && i === count - 1 ? (
              <span
                aria-hidden="true"
                className="absolute inset-0 flex items-center justify-center bg-ink/60 text-lg font-medium text-white"
              >
                +{hiddenCount}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => open(0)}
        className="mt-3 btn-quiet"
      >
        {photos.length === 1 ? "View photo" : `View all ${photos.length} photos`}
      </button>
    </div>
  );
}
