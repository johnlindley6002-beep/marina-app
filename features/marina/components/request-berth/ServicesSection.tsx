"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";
import type { RequestBerthCtx } from "./useRequestBerthForm";

export default function ServicesSection({ ctx }: { ctx: RequestBerthCtx }) {
  const { form, setField } = ctx;
  const { t } = useLanguage();
  const copy = t.enquiry.services;
  return (
    <>
      <fieldset>
        <legend className="type-heading text-xl text-ink">{copy.legend}</legend>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={form.helpMooring}
              onChange={(e) => setField("helpMooring", e.target.checked)}
            />
            {copy.helpMooring}
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={form.helpSlipping}
              onChange={(e) => setField("helpSlipping", e.target.checked)}
            />
            {copy.helpSlipping}
          </label>
        </div>
        <p className="mt-4 text-xs text-ink-muted">
          {copy.extras}
          {[
            form.shorePower ? copy.shorePower(form.amperage) : "",
            form.water ? copy.water : "",
            form.pumpOut ? copy.pumpOut : "",
            form.fuel ? copy.fuel : "",
            form.laundry ? copy.laundry : "",
          ]
            .filter(Boolean)
            .join(", ") || copy.none}
          .
        </p>
      </fieldset>
    </>
  );
}
