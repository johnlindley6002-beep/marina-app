"use client";

import { useRef, useState } from "react";

type Props = {
  title: string;
  className?: string;
};

// Native share on devices that have it, otherwise copies the page link.
// The shared link is the page itself, without any dates or sizes typed in.
export default function ShareButton({ title, className = "" }: Props) {
  const [status, setStatus] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function announce(message: string) {
    setStatus(message);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus(""), 2500);
  }

  async function share() {
    const url = `${window.location.origin}${window.location.pathname}`;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title, url });
        return;
      }
    } catch (error) {
      // Closing the share sheet is not an error.
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(url);
      announce("Link copied");
    } catch {
      announce("Could not copy. Copy the address from your browser bar.");
    }
  }

  return (
    <>
      <button type="button" onClick={share} className={className}>
        <svg
          viewBox="0 0 20 20"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path
            d="M10 12.5V3m0 0L6.5 6.5M10 3l3.5 3.5M4.5 10v5.5h11V10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>{status === "Link copied" ? "Link copied" : "Share"}</span>
      </button>
      <span role="status" className="sr-only">
        {status}
      </span>
    </>
  );
}
