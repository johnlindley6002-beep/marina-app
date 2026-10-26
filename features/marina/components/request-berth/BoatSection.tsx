"use client";

import { EMPTY_DOCUMENTS } from "@/features/my-boat/lib/boatProfile";
import { COUNTRIES } from "@/lib/countries";
import BoatSwitcher from "@/features/my-boat/components/BoatSwitcher";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { inputClass, labelClass, errorClass, RequiredMark } from "./shared";
import type { VesselType } from "@/features/marina/lib/enquiry/types";

import type { RequestBerthCtx } from "./useRequestBerthForm";

export default function BoatSection({ ctx }: { ctx: RequestBerthCtx }) {
  const { docs, errors, form, setDocs, setField, setForm } = ctx;
  const { t } = useLanguage();
  const copy = t.enquiry.boat;
  return (
    <>
      <fieldset>
        <legend className="type-heading text-xl text-ink">{copy.legend}</legend>
        <BoatSwitcher
          current={{
            name: form.boatName,
            type: form.vesselType,
            loa: form.loa,
            beam: form.beam,
            draft: form.draft,
            flag: form.flagCountry,
            homePort: form.homePort,
            documents: docs,
          }}
          onSelect={(boat) => {
            setDocs(boat.documents ?? { ...EMPTY_DOCUMENTS });
            setForm((f) => ({
              ...f,
              boatName: boat.name,
              vesselType:
                (["sail", "motor", "catamaran", "other"] as const).find((v) => v === boat.type) ??
                "",
              loa: boat.loa,
              beam: boat.beam,
              draft: boat.draft,
              flagCountry: boat.flag,
              homePort: boat.homePort,
            }));
          }}
        />
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-sm">
            <span className={labelClass}>
              {copy.name}
              <RequiredMark />
            </span>
            <input
              type="text"
              value={form.boatName}
              aria-invalid={!!errors.boatName}
              aria-describedby={errors.boatName ? "err-boatName" : undefined}
              onChange={(e) => setField("boatName", e.target.value)}
              className={inputClass}
            />
            {errors.boatName ? (
              <p id="err-boatName" role="alert" className={errorClass}>
                {errors.boatName}
              </p>
            ) : null}
          </label>

          <label className="block text-sm">
            <span className={labelClass}>
              {copy.vesselType}
              <RequiredMark />
            </span>
            <select
              value={form.vesselType}
              aria-invalid={!!errors.vesselType}
              aria-describedby={errors.vesselType ? "err-vesselType" : undefined}
              onChange={(e) => setField("vesselType", e.target.value as VesselType | "")}
              className={inputClass}
            >
              <option value="">{t.enquiry.select}</option>
              {(Object.keys(copy.types) as VesselType[]).map((key) => (
                <option key={key} value={key}>
                  {copy.types[key]}
                </option>
              ))}
            </select>
            {errors.vesselType ? (
              <p id="err-vesselType" role="alert" className={errorClass}>
                {errors.vesselType}
              </p>
            ) : null}
            {form.vesselType === "catamaran" ? (
              <p className="mt-1 text-xs text-ink-muted">{copy.catamaranNote}</p>
            ) : null}
          </label>

          <label className="block text-sm">
            <span className={labelClass}>
              {copy.flag}
              <RequiredMark />
            </span>
            <select
              value={form.flagCountry}
              aria-invalid={!!errors.flagCountry}
              aria-describedby={errors.flagCountry ? "err-flagCountry" : undefined}
              onChange={(e) => setField("flagCountry", e.target.value)}
              className={inputClass}
            >
              <option value="">{t.enquiry.select}</option>
              {COUNTRIES.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
            {errors.flagCountry ? (
              <p id="err-flagCountry" role="alert" className={errorClass}>
                {errors.flagCountry}
              </p>
            ) : null}
          </label>

          <label className="block text-sm">
            <span className={labelClass}>{copy.selectedBerth}</span>
            <input
              type="text"
              value={form.berthId}
              onChange={(e) => setField("berthId", e.target.value)}
              placeholder={copy.berthPlaceholder}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-ink-muted">{copy.berthHint}</p>
          </label>
        </div>
      </fieldset>
    </>
  );
}
