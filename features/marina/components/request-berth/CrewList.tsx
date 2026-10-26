"use client";

import Disclosure from "@/components/ui/Disclosure";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { COUNTRIES } from "@/lib/countries";
import type { PersonType } from "@/features/marina/lib/enquiry/types";
import { errorClass, inputClass, labelClass, RequiredMark } from "./shared";
import type { RequestBerthCtx } from "./useRequestBerthForm";

export default function CrewList({ ctx }: { ctx: RequestBerthCtx }) {
  const { addCrewRow, errors, form, listedCrew, listedGuests, removeCrewRow, updateCrew } = ctx;
  const { t } = useLanguage();
  const copy = t.enquiry.crew;
  return (
    <div className="mt-6">
      <p className={labelClass}>
        {form.vesselUse === "crewed" ? copy.crewedHeading : copy.listHeading}
        <RequiredMark />
      </p>
      {form.vesselUse === "crewed" ? (
        <p className="mt-2 text-xs text-ink-soft">{copy.crewedNote}</p>
      ) : null}
      <p className="mt-2 text-xs text-ink-muted">{copy.required}</p>
      <Disclosure label={copy.optionalLabel} openLabel={copy.hideOptional}>
        <p className="pb-2 text-xs text-ink-muted">{copy.optionalBody}</p>
      </Disclosure>
      <div className="mt-3 space-y-4">
        {form.crew.map((member, index) => (
          <div
            key={index}
            className="grid gap-3 border border-hairline p-4 sm:grid-cols-2 lg:grid-cols-6"
          >
            {form.vesselUse === "crewed" ? (
              <select
                aria-label={copy.personType}
                value={member.personType}
                onChange={(e) =>
                  updateCrew(index, {
                    personType: e.target.value as PersonType,
                  })
                }
                className={`${inputClass} mt-0 sm:col-span-2 lg:col-span-6`}
              >
                <option value="crew">{copy.professional}</option>
                <option value="guest">{copy.guest}</option>
              </select>
            ) : null}
            <input
              type="text"
              placeholder={copy.fullName}
              value={member.fullName}
              onChange={(e) => updateCrew(index, { fullName: e.target.value })}
              className={`${inputClass} mt-0`}
            />
            <input
              type="date"
              aria-label={copy.dob}
              value={member.dateOfBirth}
              onChange={(e) => updateCrew(index, { dateOfBirth: e.target.value })}
              className={`${inputClass} mt-0`}
            />
            <select
              aria-label={copy.nationality}
              value={member.nationality}
              onChange={(e) => updateCrew(index, { nationality: e.target.value })}
              className={`${inputClass} mt-0`}
            >
              <option value="">{copy.nationalityPlaceholder}</option>
              {COUNTRIES.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder={copy.passport}
              value={member.passportNumber}
              onChange={(e) => updateCrew(index, { passportNumber: e.target.value })}
              className={`${inputClass} mt-0`}
            />
            <input
              type="text"
              placeholder={copy.role}
              value={member.role}
              onChange={(e) => updateCrew(index, { role: e.target.value })}
              className={`${inputClass} mt-0`}
            />
            <div className="flex gap-2">
              <input
                type="date"
                aria-label={copy.joinDate}
                value={member.joinDate}
                onChange={(e) => updateCrew(index, { joinDate: e.target.value })}
                className={`${inputClass} mt-0`}
              />
              <button
                type="button"
                onClick={() => removeCrewRow(index)}
                disabled={form.crew.length === 1}
                className="px-2 text-xs font-medium text-ink-muted hover:text-error disabled:cursor-not-allowed disabled:opacity-40"
                aria-label={copy.removeLabel}
              >
                {copy.remove}
              </button>
            </div>
          </div>
        ))}
      </div>
      {errors.crew ? (
        <p id="err-crew" role="alert" className={errorClass}>
          {errors.crew}
        </p>
      ) : null}
      <button
        type="button"
        onClick={addCrewRow}
        className="mt-3 text-sm font-medium text-ink underline underline-offset-4 hover:text-ink-2"
      >
        {form.vesselUse === "crewed" ? copy.addPerson : copy.addCrew}
      </button>
      {form.vesselUse === "crewed" &&
      (listedCrew !== Number(form.professionalCrewCount) ||
        listedGuests !== Number(form.guestCount)) &&
      (form.professionalCrewCount || form.guestCount) ? (
        <p className="mt-2 text-xs text-ink-muted">
          {copy.mismatch(
            listedCrew,
            listedGuests,
            form.professionalCrewCount || "0",
            form.guestCount || "0"
          )}
        </p>
      ) : null}
    </div>
  );
}
