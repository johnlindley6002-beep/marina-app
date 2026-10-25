"use client";

import { inputClass, labelClass, errorClass, RequiredMark } from "./shared";
import type { RequestBerthCtx } from "./useRequestBerthForm";

export default function SkipperSection({ ctx }: { ctx: RequestBerthCtx }) {
  const { errors, form, rememberSkipper, setField, setRememberSkipper } = ctx;
  return (
    <>
      <fieldset>
        <legend className="type-heading text-xl text-ink">Skipper &amp; contact</legend>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-sm">
            <span className={labelClass}>
              Skipper full name
              <RequiredMark />
            </span>
            <input
              type="text"
              value={form.skipperName}
              aria-invalid={!!errors.skipperName}
              aria-describedby={errors.skipperName ? "err-skipperName" : undefined}
              onChange={(e) => setField("skipperName", e.target.value)}
              className={inputClass}
            />
            {errors.skipperName ? (
              <p id="err-skipperName" role="alert" className={errorClass}>
                {errors.skipperName}
              </p>
            ) : null}
          </label>

          <label className="block text-sm">
            <span className={labelClass}>
              Phone
              <RequiredMark />
            </span>
            <input
              type="tel"
              value={form.phone}
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? "err-phone" : undefined}
              onChange={(e) => setField("phone", e.target.value)}
              className={inputClass}
            />
            {errors.phone ? (
              <p id="err-phone" role="alert" className={errorClass}>
                {errors.phone}
              </p>
            ) : null}
          </label>

          <label className="block text-sm">
            <span className={labelClass}>
              Email
              <RequiredMark />
            </span>
            <input
              type="email"
              value={form.email}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "err-email" : undefined}
              onChange={(e) => setField("email", e.target.value)}
              className={inputClass}
            />
            {errors.email ? (
              <p id="err-email" role="alert" className={errorClass}>
                {errors.email}
              </p>
            ) : null}
          </label>

          <label className="block text-sm">
            <span className={labelClass}>Home port</span>
            <input
              type="text"
              value={form.homePort}
              onChange={(e) => setField("homePort", e.target.value)}
              className={inputClass}
            />
          </label>

          <label className="block text-sm">
            <span className={labelClass}>
              People on board
              <RequiredMark />
            </span>
            <input
              type="number"
              min="1"
              step="1"
              value={form.peopleOnBoard}
              aria-invalid={!!errors.peopleOnBoard}
              aria-describedby={errors.peopleOnBoard ? "err-peopleOnBoard" : undefined}
              onChange={(e) => setField("peopleOnBoard", e.target.value)}
              className={inputClass}
            />
            {errors.peopleOnBoard ? (
              <p id="err-peopleOnBoard" role="alert" className={errorClass}>
                {errors.peopleOnBoard}
              </p>
            ) : null}
          </label>
        </div>
        <label className="mt-4 flex items-start gap-3 text-sm text-ink/75">
          <input
            type="checkbox"
            checked={rememberSkipper}
            onChange={(e) => setRememberSkipper(e.target.checked)}
            className="mt-1"
          />
          <span>
            Remember my name, phone and email on this device for next time. You can change or remove
            them in My boat.
          </span>
        </label>
      </fieldset>
    </>
  );
}
