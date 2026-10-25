"use client";

import Disclosure from "@/components/ui/Disclosure";
import VesselUseFields, { isCommercialUse } from "@/features/marina/components/VesselUseFields";
import { inputClass, labelClass, errorClass, RequiredMark } from "./shared";

import type { RequestBerthCtx } from "./useRequestBerthForm";
import CrewList from "./CrewList";

export default function VesselStatusSection({ ctx }: { ctx: RequestBerthCtx }) {
  const { errors, form, marina, setField, setForm } = ctx;
  return (
    <>
      <fieldset>
        <legend className="type-heading text-xl text-ink">Vessel use and status</legend>
        <div className="mt-4">
          <VesselUseFields
            values={form}
            errors={errors}
            skipperName={form.skipperName}
            notes={marina.vesselStatusNotes.commercialUseNotes}
            disclaimer={marina.vesselStatusNotes.commercialUseDisclaimer}
            onChange={(key, value) => setForm((f) => ({ ...f, [key]: value }))}
          />
        </div>
        <div className="hairline-top mt-8 pt-6" />
        <p className="text-sm text-ink/75">
          Is your vessel EU-flagged AND is all crew EU/Schengen, arriving from another EU port?
          <RequiredMark />
        </p>
        <div className="mt-3 flex gap-3">
          <button
            type="button"
            onClick={() => setField("euStatus", "yes")}
            className={`min-h-11 px-6 text-sm font-medium ${
              form.euStatus === "yes"
                ? "bg-ink text-white"
                : "border border-hairline text-ink/75 hover:border-ink/40"
            }`}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => setField("euStatus", "no")}
            className={`min-h-11 px-6 text-sm font-medium ${
              form.euStatus === "no"
                ? "bg-ink text-white"
                : "border border-hairline text-ink/75 hover:border-ink/40"
            }`}
          >
            No
          </button>
        </div>
        {errors.euStatus ? (
          <p id="err-euStatus" role="alert" className={errorClass}>
            {errors.euStatus}
          </p>
        ) : null}

        {form.euStatus === "yes" ? (
          <div className="mt-4 space-y-1 text-sm text-ink/70">
            {marina.vesselStatusNotes.euReminders.map((note) => (
              <p key={note}>{note}</p>
            ))}
          </div>
        ) : null}

        {form.euStatus === "no" ? (
          <div className="mt-6 border-t border-hairline pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className={labelClass}>
                  Last port
                  <RequiredMark />
                </span>
                <input
                  type="text"
                  value={form.lastPort}
                  aria-invalid={!!errors.lastPort}
                  aria-describedby={errors.lastPort ? "err-lastPort" : undefined}
                  onChange={(e) => setField("lastPort", e.target.value)}
                  className={inputClass}
                />
                {errors.lastPort ? (
                  <p id="err-lastPort" role="alert" className={errorClass}>
                    {errors.lastPort}
                  </p>
                ) : null}
              </label>

              <label className="block text-sm">
                <span className={labelClass}>
                  Next port
                  <RequiredMark />
                </span>
                <input
                  type="text"
                  value={form.nextPort}
                  aria-invalid={!!errors.nextPort}
                  aria-describedby={errors.nextPort ? "err-nextPort" : undefined}
                  onChange={(e) => setField("nextPort", e.target.value)}
                  className={inputClass}
                />
                {errors.nextPort ? (
                  <p id="err-nextPort" role="alert" className={errorClass}>
                    {errors.nextPort}
                  </p>
                ) : null}
              </label>
            </div>

            <CrewList ctx={ctx} />

            <Disclosure
              className="mt-4"
              label="Border and customs notes"
              openLabel="Hide border and customs notes"
            >
              <div className="space-y-1 pb-2 text-xs text-ink/70">
                {[
                  ...marina.vesselStatusNotes.internationalNotes.slice(0, 1),
                  isCommercialUse(form.vesselUse)
                    ? marina.vesselStatusNotes.temporaryAdmission.commercial
                    : marina.vesselStatusNotes.temporaryAdmission.private,
                  ...marina.vesselStatusNotes.internationalNotes.slice(1),
                ].map((note) => (
                  <p key={note}>{note}</p>
                ))}
              </div>
            </Disclosure>
          </div>
        ) : null}
      </fieldset>
    </>
  );
}
