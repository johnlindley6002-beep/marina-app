"use client";

import { formatLength } from "@/lib/units";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { inputClass, labelClass, errorClass, RequiredMark } from "./shared";
import type { RequestBerthCtx } from "./useRequestBerthForm";

export default function VisitSection({ ctx }: { ctx: RequestBerthCtx }) {
  const { errors, form, nights, setField, units } = ctx;
  const { t } = useLanguage();
  const copy = t.enquiry.visit;
  return (
    <>
      <fieldset>
        <legend className="type-heading text-xl text-ink">{copy.legend}</legend>
        <p className="mt-4 text-sm text-ink-soft">
          <span className={labelClass}>{copy.stay}</span>
          {form.arrival
            ? `${form.arrival} → ${form.openEnded ? copy.openEnded : form.departure || "-"}`
            : copy.notSet}
          {nights ? ` · ${copy.nights(nights)}` : ""}
          {Number(form.loa) > 0 ? ` · ${copy.length(formatLength(Number(form.loa), units))}` : ""}
          {Number(form.beam) > 0 ? `, ${copy.beam(formatLength(Number(form.beam), units))}` : ""}
          {Number(form.draft) > 0 ? `, ${copy.draft(formatLength(Number(form.draft), units))}` : ""}
        </p>
        <p className="mt-1 text-xs text-ink-muted">
          {copy.editIn}{" "}
          <a href="#plan-your-stay" className="text-ink underline underline-offset-4">
            {copy.planYourStay}
          </a>
          .
        </p>
        <div className="mt-4 grid max-w-md gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className={labelClass}>
              {copy.eta}
              <RequiredMark />
            </span>
            <input
              type="time"
              value={form.eta}
              aria-invalid={!!errors.eta}
              aria-describedby={errors.eta ? "err-eta" : undefined}
              onChange={(e) => setField("eta", e.target.value)}
              className={inputClass}
            />
            {errors.eta ? (
              <p id="err-eta" role="alert" className={errorClass}>
                {errors.eta}
              </p>
            ) : null}
          </label>

          <label className="block text-sm">
            <span className={labelClass}>
              {copy.etd}
              {!form.openEnded ? <RequiredMark /> : null}
            </span>
            <input
              type="time"
              value={form.etd}
              aria-invalid={!!errors.etd}
              aria-describedby={errors.etd ? "err-etd" : undefined}
              onChange={(e) => setField("etd", e.target.value)}
              disabled={form.openEnded}
              className={`${inputClass} disabled:bg-paper-deep disabled:text-ink-muted`}
            />
            {errors.etd ? (
              <p id="err-etd" role="alert" className={errorClass}>
                {errors.etd}
              </p>
            ) : null}
          </label>
        </div>
      </fieldset>
    </>
  );
}
