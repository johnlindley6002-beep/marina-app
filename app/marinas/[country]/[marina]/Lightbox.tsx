"use client";

import Image from "next/image";
import { useEffect, useRef, type KeyboardEvent, type PointerEvent } from "react";
import type { Photo } from "./PhotoGallery";

type Props = {
  photos: Photo[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
};

const SWIPE_DISTANCE = 50;

const controlClass =
  "inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/40 bg-ink/60 text-white transition-colors hover:bg-white/15";

// A full-screen viewer on the native dialog element: it traps focus, closes
// on Escape and makes the page behind it inert without any library.
export default function Lightbox({ photos, index, onIndexChange, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const swipeStart = useRef<number | null>(null);
  const count = photos.length;
  const photo = photos[index];

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    // Escape raises cancel. It is handled here so the viewer unmounts through
    // React, and close stays as a fallback for any other native close.
    const handleCancel = (event: Event) => {
      event.preventDefault();
      onCloseRef.current();
    };
    const handleClose = () => onCloseRef.current();
    dialog.addEventListener("cancel", handleCancel);
    dialog.addEventListener("close", handleClose);
    if (!dialog.open) dialog.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog.removeEventListener("cancel", handleCancel);
      dialog.removeEventListener("close", handleClose);
      document.body.style.overflow = previous;
    };
  }, []);

  const go = (step: number) => onIndexChange((index + step + count) % count);

  function onKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (count < 2) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      go(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(-1);
    }
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    swipeStart.current = event.clientX;
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (swipeStart.current === null || count < 2) return;
    const delta = event.clientX - swipeStart.current;
    swipeStart.current = null;
    if (Math.abs(delta) >= SWIPE_DISTANCE) go(delta < 0 ? 1 : -1);
  }

  // The neighbours load quietly so a swipe shows the next photo straight away.
  const neighbours =
    count > 1
      ? [...new Set([(index + 1) % count, (index - 1 + count) % count])]
      : [];

  return (
    <dialog
      ref={dialogRef}
      aria-label="Photo gallery"
      onKeyDown={onKeyDown}
      className="on-ink fixed inset-0 m-0 h-full max-h-none w-full max-w-none border-0 bg-ink p-0 text-white backdrop:bg-ink"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <p className="tabular text-sm text-white/80" aria-live="polite">
            Photo {index + 1} of {count}
          </p>
          <button
            type="button"
            onClick={onClose}
            className={controlClass}
          >
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
              <path d="M4 4l12 12M16 4L4 16" strokeLinecap="round" />
            </svg>
            <span className="sr-only">Close photo gallery</span>
          </button>
        </div>

        <div
          className="relative min-h-0 flex-1 touch-pan-y select-none"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => (swipeStart.current = null)}
        >
          <Image
            key={photo.src}
            src={photo.src}
            alt={photo.alt}
            fill
            sizes="100vw"
            loading="eager"
            draggable={false}
            className="object-contain"
          />

          {count > 1 ? (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                className={`${controlClass} absolute top-1/2 left-3 -translate-y-1/2 sm:left-6`}
              >
                <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                  <path d="M12.5 4l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="sr-only">Previous photo</span>
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                className={`${controlClass} absolute top-1/2 right-3 -translate-y-1/2 sm:right-6`}
              >
                <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                  <path d="M7.5 4l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="sr-only">Next photo</span>
              </button>
            </>
          ) : null}
        </div>

        <div className="min-h-16 px-4 py-4 text-center sm:px-6" aria-live="polite">
          <p className="mx-auto max-w-2xl text-white">{photo.caption}</p>
          {photo.credit ? (
            <p className="mx-auto mt-1 max-w-2xl text-sm text-white/70">
              {photo.credit}
            </p>
          ) : null}
        </div>
      </div>

      <div className="hidden" aria-hidden="true">
        {neighbours.map((n) => (
          <Image
            key={photos[n].src}
            src={photos[n].src}
            alt=""
            width={1600}
            height={1200}
            sizes="100vw"
            loading="eager"
          />
        ))}
      </div>
    </dialog>
  );
}
