"use client";

import { useState } from "react";
import { loadFrequentCrew, type FrequentPerson } from "../../../../../lib/boatProfile";
import { getLastSubmittedCrew } from "../../../../../lib/mockData";
import { EMPTY_PERSON, getVoyageFlags } from "../../../../../lib/prearrival/schema";
import { getExtraErrors, getWarnings } from "../../../../../lib/prearrival/warnings";
import { useLanguage } from "../../../../components/LanguageProvider";
import type { StepProps } from "./PreArrivalWizard";
import PersonCard from "./PersonCard";
import type { PersonStatus } from "./WizardBits";

function statusFor(index: number, draft: StepProps["draft"]): PersonStatus {
  const person = draft.people[index];
  const prefix = `people.${index}`;
  const hasError = getExtraErrors(draft).some((f) => f.path?.startsWith(prefix));
  if (hasError) return "check-dates";
  const missingRequired =
    !person.familyName.trim() ||
    !person.givenNames.trim() ||
    !person.nationality.trim() ||
    !person.dateOfBirth ||
    !person.idNumber.trim() ||
    !person.idExpiryDate;
  if (missingRequired) return "missing";
  const hasWarning = getWarnings(draft).some((f) => f.path?.startsWith(prefix));
  if (hasWarning) return "check-dates";
  return "complete";
}

export default function StepCrew({ draft, setDraft, focusPersonIndex }: StepProps & { focusPersonIndex?: number | null }) {
  const { t } = useLanguage();
  const copy = t.preArrival.crew;
  const flags = getVoyageFlags(draft.voyage);
  const fullCrewListMode = flags.crossesExternalBorder;
  const [frequentCrew] = useState<FrequentPerson[]>(() => loadFrequentCrew());

  function setCount(count: number) {
    setDraft((d) => {
      const people = d.people.slice(0, count);
      while (people.length < count) {
        people.push({
          ...EMPTY_PERSON,
          role: people.length === 0 ? "skipper" : "crew",
        });
      }
      if (!people.some((p) => p.role === "skipper") && people.length > 0) {
        people[0] = { ...people[0], role: "skipper" };
      }
      return { ...d, people };
    });
  }

  function removePerson(index: number) {
    setDraft((d) => {
      const people = d.people.filter((_, i) => i !== index);
      if (people.length > 0 && !people.some((p) => p.role === "skipper")) {
        people[0] = { ...people[0], role: "skipper" };
      }
      return { ...d, people };
    });
  }

  function applyAllFreeMovement() {
    setDraft((d) => ({
      ...d,
      people: d.people.map((p) => (p.nationality.trim() ? p : { ...p, nationality: "Portugal" })),
    }));
  }

  function applyReuseLastCrew() {
    const lastCrew = getLastSubmittedCrew();
    if (lastCrew.length === 0) return;
    setDraft((d) => ({ ...d, people: lastCrew.map((p) => ({ ...p })) }));
  }

  // Fills the first blank person card with a remembered crew member, or adds
  // one if every card already has a name, up to the 12-person limit.
  function applyFrequentPerson(fp: FrequentPerson) {
    setDraft((d) => {
      const fill = {
        familyName: fp.familyName,
        givenNames: fp.givenNames,
        nationality: fp.nationality,
        dateOfBirth: fp.dateOfBirth,
        idType: fp.idType,
      };
      const blankIndex = d.people.findIndex((p) => !p.familyName.trim() && !p.givenNames.trim());
      if (blankIndex >= 0) {
        return {
          ...d,
          people: d.people.map((p, i) => (i === blankIndex ? { ...p, ...fill } : p)),
        };
      }
      if (d.people.length >= 12) return d;
      return {
        ...d,
        people: [...d.people, { ...EMPTY_PERSON, ...fill, role: "crew" }],
      };
    });
  }

  return (
    <div>
      <div className="mt-6 max-w-xs">
        <label htmlFor="crew-count" className="block text-sm">
          <span className="field-label">{copy.howManyLabel}</span>
          <select
            id="crew-count"
            value={draft.people.length}
            onChange={(e) => setCount(Number(e.target.value))}
            className="field"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" onClick={applyAllFreeMovement} className="chip">
          {copy.allFreeMovementToggle}
        </button>
        <button type="button" onClick={applyReuseLastCrew} className="chip">
          {copy.reuseLastCrewToggle}
        </button>
      </div>

      {fullCrewListMode ? (
        <p className="mt-4">
          <span className="chip border-ink/40 text-ink/75">{copy.fullCrewListChip}</span>
        </p>
      ) : null}

      {frequentCrew.length > 0 ? (
        <div className="mt-4">
          <p className="field-label">{copy.frequentCrewLabel}</p>
          <ul className="flex flex-wrap gap-2">
            {frequentCrew.map((fp) => (
              <li key={fp.key}>
                <button type="button" onClick={() => applyFrequentPerson(fp)} className="chip">
                  {[fp.givenNames, fp.familyName].filter(Boolean).join(" ")}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="mt-6 max-w-xl text-xs text-ink/65">{t.preArrival.privacyNote}</p>

      <ul className="mt-6">
        {draft.people.map((person, index) => (
          <PersonCard
            key={index}
            index={index}
            person={person}
            status={statusFor(index, draft)}
            fullCrewListMode={fullCrewListMode}
            draft={draft}
            setDraft={setDraft}
            onRemove={() => removePerson(index)}
            canRemove={draft.people.length > 1}
            initialOpen={index === 0 || index === focusPersonIndex}
          />
        ))}
      </ul>
    </div>
  );
}
