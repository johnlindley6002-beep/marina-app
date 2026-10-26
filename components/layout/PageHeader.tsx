"use client";

import type { ReactNode } from "react";
import { siteConfig } from "@/data/site";
import { useLanguage } from "@/components/providers/LanguageProvider";

// The title block of a task or back-office page: one type-title, an optional
// lead line, and the mock note while the site is a mockup. Every such page uses
// it, so their headings match.
export default function PageHeader({
  title,
  children,
  mock = false,
}: {
  title: string;
  children?: ReactNode;
  mock?: boolean;
}) {
  const { t } = useLanguage();
  return (
    <header>
      <h1 className="type-title text-ink">{title}</h1>
      {children ? <div className="measure mt-4 text-lg text-ink-soft">{children}</div> : null}
      {mock && siteConfig.mockMode ? (
        <p className="mt-3 text-sm text-ink-muted">{t.account.mockNote}</p>
      ) : null}
    </header>
  );
}
