"use client";

import { useEffect, useId, useState, type ReactNode } from "react";

// The one reveal used across the site: a button with aria-expanded that opens a
// panel. It animates height and fades (instant under prefers-reduced-motion),
// and the panel is inert while closed, so nothing hidden can be tabbed to.

type CollapseProps = {
  open: boolean;
  id?: string;
  className?: string;
  children: ReactNode;
};

// The animated panel on its own, for content that appears when a condition is
// met (for example the estimate once dates and length are entered).
export function Collapse({ open, id, className = "", children }: CollapseProps) {
  // While open and at rest the panel stops clipping, so shadows and focus
  // outlines at its edges are not cut off. It clips only while animating or
  // closed.
  const [settled, setSettled] = useState(open);
  useEffect(() => {
    if (!open) {
      setSettled(false);
      return;
    }
    const timer = setTimeout(() => setSettled(true), 550);
    return () => clearTimeout(timer);
  }, [open]);

  return (
    <div
      id={id}
      className={`grid transition-[grid-template-rows,opacity] duration-500 ease-out motion-reduce:transition-none ${
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      } ${className}`}
    >
      <div
        className={`min-h-0 ${open && settled ? "" : "overflow-hidden"}`}
        inert={!open}
      >
        {children}
      </div>
    </div>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`h-4 w-4 shrink-0 transition-transform duration-500 motion-reduce:transition-none ${
        open ? "rotate-180" : ""
      }`}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden="true"
    >
      <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type Props = {
  // The trigger text while closed, and (optionally) while open.
  label: string;
  openLabel?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  // "link" is quiet text with a chevron. "row" is a full-width row with a
  // hairline above, for lists of items.
  variant?: "link" | "row";
  // preview clamps the content to this many lines while closed, instead of
  // hiding it, for a short summary with a Read more.
  previewLines?: 2 | 3;
  // Opens automatically when the page is loaded or navigated to this hash
  // (for example "#privacy"), and carries that id so the link can land here.
  hashId?: string;
  className?: string;
  // Called with the new state whenever the reader toggles it.
  onToggle?: (open: boolean) => void;
};

const CLAMP = { 2: "line-clamp-2", 3: "line-clamp-3" } as const;

export default function Disclosure({
  label,
  openLabel,
  children,
  defaultOpen = false,
  variant = "link",
  previewLines,
  hashId,
  className = "",
  onToggle,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const uid = useId();
  const panelId = `${uid}-panel`;

  useEffect(() => {
    if (!hashId) return;
    function check() {
      if (window.location.hash === `#${hashId}`) {
        setOpen(true);
        requestAnimationFrame(() =>
          document
            .getElementById(hashId as string)
            ?.scrollIntoView({ block: "start" })
        );
      }
    }
    check();
    window.addEventListener("hashchange", check);
    return () => window.removeEventListener("hashchange", check);
  }, [hashId]);

  function toggle() {
    const next = !open;
    setOpen(next);
    onToggle?.(next);
  }

  const text = open && openLabel ? openLabel : label;

  const trigger =
    variant === "row" ? (
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={toggle}
        className="flex min-h-11 w-full items-center justify-between gap-4 py-2 text-left font-medium text-ink"
      >
        <span>{text}</span>
        <Chevron open={open} />
      </button>
    ) : (
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={toggle}
        className="btn-quiet gap-2"
      >
        <span>{text}</span>
        <Chevron open={open} />
      </button>
    );

  const wrapperClass = `${variant === "row" ? "hairline-top" : ""} ${
    hashId ? "scroll-mt-24" : ""
  } ${className}`;

  if (previewLines) {
    return (
      <div id={hashId} className={wrapperClass}>
        <div id={panelId} className={open ? "" : CLAMP[previewLines]}>
          {children}
        </div>
        {trigger}
      </div>
    );
  }

  return (
    <div id={hashId} className={wrapperClass}>
      {trigger}
      <Collapse open={open} id={panelId}>
        {children}
      </Collapse>
    </div>
  );
}
