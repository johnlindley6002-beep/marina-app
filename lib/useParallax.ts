"use client";

import { useEffect, type RefObject } from "react";

// A slow drift for a hero image while its section is on screen: the image
// moves down at a fraction of the scroll, so it seems to sit further back.
// Off when the reader prefers reduced motion. Transform only, so nothing shifts.
export function useParallax(
  sectionRef: RefObject<HTMLElement | null>,
  layerRef: RefObject<HTMLElement | null>,
  enabled: boolean,
  strength = 0.16
) {
  useEffect(() => {
    const section = sectionRef.current;
    const layer = layerRef.current;
    if (!enabled || !section || !layer) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let visible = true;

    function update() {
      frame = 0;
      if (!visible || !layer || !section) return;
      // Capped at the section's height, so it never drifts on past the hero.
      const y = Math.min(Math.max(0, window.scrollY), section.offsetHeight);
      layer.style.transform = `translate3d(0, ${(y * strength).toFixed(1)}px, 0) scale(1.08)`;
    }

    function onScroll() {
      if (!frame) frame = requestAnimationFrame(update);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { threshold: 0 }
    );
    observer.observe(section);
    window.addEventListener("scroll", onScroll, { passive: true });
    update();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
      layer.style.transform = "";
    };
  }, [sectionRef, layerRef, enabled, strength]);
}
