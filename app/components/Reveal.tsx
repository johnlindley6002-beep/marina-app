"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

// Settles its content in once, with a gentle fade and rise, when it first
// enters the viewport. Use it sparingly, on section headlines and lead blocks.
// It hides itself only after hydration, only when motion is allowed and only if
// it starts below the fold (see .reveal in globals.css), so with reduced motion,
// without JavaScript, or when already on screen, everything is simply there.
export default function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  // Milliseconds, for a short stagger between neighbours.
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const rect = node.getBoundingClientRect();
    // Already on screen (or scrolled past): leave it visible, no flicker.
    if (rect.top < window.innerHeight * 0.94) return;
    node.classList.add("is-armed");
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          node.classList.add("is-in");
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${className}`}
      style={delay ? ({ "--d": `${delay}ms` } as CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}
