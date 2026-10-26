"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";

// The first thing a keyboard user can reach: jumps past the navigation.
export default function SkipLink() {
  const { t } = useLanguage();
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-paper focus:px-4 focus:py-2 focus:text-ink"
    >
      {t.chrome.skipToContent}
    </a>
  );
}
