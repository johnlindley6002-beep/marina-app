"use client";

import Disclosure from "@/components/ui/Disclosure";
import { COUNTRIES } from "@/lib/countries";
import type { PersonType } from "@/features/marina/lib/enquiry/types";
import { errorClass, inputClass, labelClass, RequiredMark } from "./shared";
import type { RequestBerthCtx } from "./useRequestBerthForm";

export default function CrewList({ ctx }: { ctx: RequestBerthCtx }) {
  const { addCrewRow, errors, form, listedCrew, listedGuests, removeCrewRow, updateCrew } = ctx;
  return (
    <div className="mt-6">
      <p className={labelClass}>
        {form.vesselUse === "crewed" ? "Crew and guest list" : "Crew list"}
        <RequiredMark />
      </p>
      {form.vesselUse === "crewed" ? (
        <p className="mt-2 text-xs text-ink-soft">
          List professional crew and guests or passengers separately: choose the type for each
          person. Border control treats them differently.
        </p>
      ) : null}
      <p className="mt-2 text-xs text-ink-muted">Required: name, nationality and role.</p>
      <Disclosure label="About the optional details" openLabel="Hide the optional details">
        <p className="pb-2 text-xs text-ink-muted">
          Date of birth, passport number and join date are optional. Passport numbers and other
          private details can be given to the marina staff in person instead.
        </p>
      </Disclosure>
      <div className="mt-3 space-y-4">
        {form.crew.map((member, index) => (
          <div
            key={index}
            className="grid gap-3 border border-hairline p-4 sm:grid-cols-2 lg:grid-cols-6"
          >
            {form.vesselUse === "crewed" ? (
              <select
                aria-label="Type of person"
                value={member.personType}
                onChange={(e) =>
                  updateCrew(index, {
                    personType: e.target.value as PersonType,
                  })
                }
                className={`${inputClass} mt-0 sm:col-span-2 lg:col-span-6`}
              >
                <option value="crew">Professional crew</option>
                <option value="guest">Guest or passenger</option>
              </select>
            ) : null}
            <input
              type="text"
              placeholder="Full name"
              value={member.fullName}
              onChange={(e) => updateCrew(index, { fullName: e.target.value })}
              className={`${inputClass} mt-0`}
            />
            <input
              type="date"
              aria-label="Date of birth (optional)"
              value={member.dateOfBirth}
              onChange={(e) => updateCrew(index, { dateOfBirth: e.target.value })}
              className={`${inputClass} mt-0`}
            />
            <select
              aria-label="Nationality"
              value={member.nationality}
              onChange={(e) => updateCrew(index, { nationality: e.target.value })}
              className={`${inputClass} mt-0`}
            >
              <option value="">Nationality…</option>
              {COUNTRIES.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Passport number (optional)"
              value={member.passportNumber}
              onChange={(e) => updateCrew(index, { passportNumber: e.target.value })}
              className={`${inputClass} mt-0`}
            />
            <input
              type="text"
              placeholder="Role on board"
              value={member.role}
              onChange={(e) => updateCrew(index, { role: e.target.value })}
              className={`${inputClass} mt-0`}
            />
            <div className="flex gap-2">
              <input
                type="date"
                aria-label="Join date (optional)"
                value={member.joinDate}
                onChange={(e) => updateCrew(index, { joinDate: e.target.value })}
                className={`${inputClass} mt-0`}
              />
              <button
                type="button"
                onClick={() => removeCrewRow(index)}
                disabled={form.crew.length === 1}
                className="px-2 text-xs font-medium text-ink-muted hover:text-error disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Remove crew member"
              >
                Remove
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
        {form.vesselUse === "crewed" ? "+ Add person" : "+ Add crew member"}
      </button>
      {form.vesselUse === "crewed" &&
      (listedCrew !== Number(form.professionalCrewCount) ||
        listedGuests !== Number(form.guestCount)) &&
      (form.professionalCrewCount || form.guestCount) ? (
        <p className="mt-2 text-xs text-ink-muted">
          Your list shows {listedCrew} professional crew and {listedGuests}{" "}
          {listedGuests === 1 ? "guest" : "guests"}, while you entered{" "}
          {form.professionalCrewCount || 0} and {form.guestCount || 0} above. Please check the
          numbers match.
        </p>
      ) : null}
    </div>
  );
}
