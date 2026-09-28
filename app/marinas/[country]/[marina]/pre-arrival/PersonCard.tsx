"use client";

import { useState } from "react";
import { COUNTRIES } from "../../../../../lib/countries";
import { isMinor, type Person } from "../../../../../lib/prearrival/schema";
import { useLanguage } from "../../../../components/LanguageProvider";
import type { StepProps } from "./PreArrivalWizard";
import { Field, StatusPill, type PersonStatus } from "./WizardBits";

type Props = {
  index: number;
  person: Person;
  status: PersonStatus;
  fullCrewListMode: boolean;
  draft: StepProps["draft"];
  setDraft: StepProps["setDraft"];
  onRemove: () => void;
  canRemove: boolean;
};

export default function PersonCard({
  index,
  person,
  status,
  fullCrewListMode,
  draft,
  setDraft,
  onRemove,
  canRemove,
}: Props) {
  const { t } = useLanguage();
  const copy = t.preArrival.crew;
  const [open, setOpen] = useState(index === 0);
  const panelId = `person-${index}-panel`;

  function update(patch: Partial<Person>) {
    setDraft((d) => ({
      ...d,
      people: d.people.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    }));
  }

  const arrivalDate = draft.voyage.arrivalDateTime.slice(0, 10);
  const minor = isMinor(person, arrivalDate);

  return (
    <li className="hairline-top py-6 first:border-t-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex min-h-11 flex-1 items-center gap-3 text-left"
        >
          <span className="font-medium text-ink">
            {copy.personTitle(index + 1)}
            {person.givenNames || person.familyName
              ? `, ${[person.givenNames, person.familyName].filter(Boolean).join(" ")}`
              : ""}
          </span>
          <StatusPill
            status={status}
            labels={{
              complete: copy.statusComplete,
              missing: copy.statusMissing,
              "check-dates": copy.statusCheckDates,
            }}
          />
        </button>
        {canRemove ? (
          <button type="button" onClick={onRemove} className="btn-quiet text-sm">
            {copy.removePerson}
          </button>
        ) : null}
      </div>
      {index === 0 ? <p className="mt-1 text-xs text-ink/65">{copy.skipperDefaultNote}</p> : null}

      {open ? (
        <div id={panelId} className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label={copy.roleLabel} htmlFor={`p${index}-role`}>
              <select
                id={`p${index}-role`}
                value={person.role}
                onChange={(e) => update({ role: e.target.value as Person["role"] })}
                className="field"
                disabled={index === 0}
              >
                <option value="skipper">{copy.roleSkipper}</option>
                <option value="crew">{copy.roleCrew}</option>
                <option value="guest">{copy.roleGuest}</option>
              </select>
            </Field>
            <Field label={copy.familyNameLabel} htmlFor={`p${index}-family`} required>
              <div className="flex gap-2">
                <input
                  id={`p${index}-family`}
                  type="text"
                  value={person.familyName}
                  onChange={(e) => update({ familyName: e.target.value })}
                  className="field"
                />
                {index > 0 ? (
                  <button
                    type="button"
                    onClick={() => update({ familyName: draft.people[0].familyName })}
                    className="shrink-0 whitespace-nowrap text-xs text-ink/65 underline underline-offset-4"
                  >
                    {copy.sameSurnameToggle}
                  </button>
                ) : null}
              </div>
            </Field>
            <Field label={copy.givenNamesLabel} htmlFor={`p${index}-given`} required>
              <input
                id={`p${index}-given`}
                type="text"
                value={person.givenNames}
                onChange={(e) => update({ givenNames: e.target.value })}
                className="field"
              />
            </Field>
            <Field label={copy.nationalityLabel} htmlFor={`p${index}-nat`} required>
              <div className="flex gap-2">
                <select
                  id={`p${index}-nat`}
                  value={person.nationality}
                  onChange={(e) => update({ nationality: e.target.value })}
                  className="field"
                >
                  <option value="">Select…</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                {index > 0 ? (
                  <button
                    type="button"
                    onClick={() => update({ nationality: draft.people[0].nationality })}
                    className="shrink-0 whitespace-nowrap text-xs text-ink/65 underline underline-offset-4"
                  >
                    {copy.sameNationalityToggle}
                  </button>
                ) : null}
              </div>
            </Field>
            <Field label={copy.dateOfBirthLabel} htmlFor={`p${index}-dob`} required>
              <input
                id={`p${index}-dob`}
                type="date"
                value={person.dateOfBirth}
                onChange={(e) => update({ dateOfBirth: e.target.value })}
                className="field"
              />
            </Field>
            <Field label={copy.idTypeLabel} htmlFor={`p${index}-idtype`}>
              <select
                id={`p${index}-idtype`}
                value={person.idType}
                onChange={(e) => update({ idType: e.target.value as Person["idType"] })}
                className="field"
              >
                <option value="passport">{copy.idTypePassport}</option>
                <option value="national_id">{copy.idTypeNationalId}</option>
              </select>
            </Field>
            <Field label={copy.idNumberLabel} htmlFor={`p${index}-idnum`} required>
              <input
                id={`p${index}-idnum`}
                type="text"
                value={person.idNumber}
                onChange={(e) => update({ idNumber: e.target.value })}
                className="field"
              />
            </Field>
            <Field label={copy.idExpiryLabel} htmlFor={`p${index}-idexp`} required>
              <input
                id={`p${index}-idexp`}
                type="date"
                value={person.idExpiryDate}
                onChange={(e) => update({ idExpiryDate: e.target.value })}
                className="field"
              />
            </Field>
            <Field label={copy.idIssueDateLabel} htmlFor={`p${index}-idissue`}>
              <input
                id={`p${index}-idissue`}
                type="date"
                value={person.idIssueDate}
                onChange={(e) => update({ idIssueDate: e.target.value })}
                className="field"
              />
            </Field>

            {fullCrewListMode ? (
              <>
                <Field label={copy.placeOfBirthLabel} htmlFor={`p${index}-pob`}>
                  <input
                    id={`p${index}-pob`}
                    type="text"
                    value={person.placeOfBirth}
                    onChange={(e) => update({ placeOfBirth: e.target.value })}
                    className="field"
                  />
                </Field>
                <Field label={copy.genderLabel} htmlFor={`p${index}-gender`}>
                  <input
                    id={`p${index}-gender`}
                    type="text"
                    value={person.gender}
                    onChange={(e) => update({ gender: e.target.value })}
                    className="field"
                  />
                </Field>
                <Field label={copy.idIssuingStateLabel} htmlFor={`p${index}-idstate`}>
                  <select
                    id={`p${index}-idstate`}
                    value={person.idIssuingState}
                    onChange={(e) => update({ idIssuingState: e.target.value })}
                    className="field"
                  >
                    <option value="">Select…</option>
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={copy.embarkationDateLabel} htmlFor={`p${index}-embark`}>
                  <input
                    id={`p${index}-embark`}
                    type="date"
                    value={person.embarkationDate}
                    onChange={(e) => update({ embarkationDate: e.target.value })}
                    className="field"
                  />
                </Field>
              </>
            ) : null}
          </div>

          {minor ? (
            <div className="mt-4 max-w-xs">
              <Field label={copy.guardianLabel} htmlFor={`p${index}-guardian`}>
                <select
                  id={`p${index}-guardian`}
                  value={person.guardianPersonIndex ?? ""}
                  onChange={(e) =>
                    update({ guardianPersonIndex: e.target.value === "" ? null : Number(e.target.value) })
                  }
                  className="field"
                >
                  <option value="">{copy.guardianPlaceholder}</option>
                  {draft.people.map((p, i) =>
                    i === index ? null : (
                      <option key={i} value={i}>
                        {copy.personTitle(i + 1)}
                        {p.givenNames ? `, ${p.givenNames}` : ""}
                      </option>
                    )
                  )}
                </select>
              </Field>
            </div>
          ) : null}

          <button
            type="button"
            disabled
            title={copy.scanComingSoon}
            className="btn-secondary mt-4 opacity-60"
          >
            {copy.scanPassport}
            <span className="ml-2 text-xs text-ink/65">{copy.scanComingSoon}</span>
          </button>
        </div>
      ) : null}
    </li>
  );
}
