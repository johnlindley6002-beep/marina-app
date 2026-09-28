// Non-blocking guidance and the small set of extra hard errors that need more
// than one field to check (an expiry date against the trip's departure date,
// for instance). Warnings never stop submission; errors do. Kept separate
// from schema.ts's Zod pass so that distinction cannot blur by accident.

import { isEU, isFreeMovementNational } from "./countries";
import { isMinor, type PreArrivalDraft } from "./schema";
import { getMissingRequiredDocuments } from "./documentRules";

export type Flag = { message: string; path?: string };

const DAY_MS = 86_400_000;
function daysBetween(a: string, b: string): number {
  const da = new Date(a).getTime();
  const db = new Date(b).getTime();
  if (Number.isNaN(da) || Number.isNaN(db)) return NaN;
  return Math.round((db - da) / DAY_MS);
}

// ---------------------------------------------------------------------------
// Errors beyond the Zod schema: these block Review just as much as a Zod
// issue would, but need cross-field or cross-section context Zod does not
// have on its own (a document's expiry against the voyage's departure).
// ---------------------------------------------------------------------------

export function getExtraErrors(draft: PreArrivalDraft): Flag[] {
  const errors: Flag[] = [];
  const departure =
    draft.voyage.departureDateTime.slice(0, 10) || draft.stay.requestedDeparture;

  for (const [index, person] of draft.people.entries()) {
    if (person.idExpiryDate && departure && person.idExpiryDate < departure) {
      errors.push({
        message: `${person.givenNames || `Person ${index + 1}`}'s ID expires before the planned departure.`,
        path: `people.${index}.idExpiryDate`,
      });
    }
  }

  const insurance = draft.documents.thirdPartyInsurance;
  if (insurance.expiryDate && departure && insurance.expiryDate < departure) {
    errors.push({
      message: "The insurance expires before the planned departure.",
      path: "documents.thirdPartyInsurance.expiryDate",
    });
  }

  for (const req of getMissingRequiredDocuments(draft)) {
    errors.push({
      message: `${req.label} is required.`,
      path: `documents.${req.key}`,
    });
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Warnings: shown calmly, never block Continue or Send.
// ---------------------------------------------------------------------------

export function getWarnings(draft: PreArrivalDraft): Flag[] {
  const warnings: Flag[] = [];
  const departure =
    draft.voyage.departureDateTime.slice(0, 10) || draft.stay.requestedDeparture;

  for (const [index, person] of draft.people.entries()) {
    const label = person.givenNames || `Person ${index + 1}`;
    const freeMovement = isFreeMovementNational(person.nationality);

    if (!freeMovement && person.idExpiryDate && departure) {
      const daysLeft = daysBetween(departure, person.idExpiryDate);
      if (!Number.isNaN(daysLeft) && daysLeft < 90) {
        warnings.push({
          message: `${label}'s passport expires within 3 months of departure. Some countries require 3 months' validity beyond travel.`,
          path: `people.${index}.idExpiryDate`,
        });
      }
    }
    if (!freeMovement && person.idIssueDate) {
      const ageDays = daysBetween(person.idIssueDate, departure || person.idExpiryDate);
      if (!Number.isNaN(ageDays) && ageDays > 365 * 10) {
        warnings.push({
          message: `${label}'s passport was issued more than 10 years ago. Some countries do not accept this.`,
          path: `people.${index}.idIssueDate`,
        });
      }
    }

    if (
      isMinor(person, draft.voyage.arrivalDateTime.slice(0, 10) || departure) &&
      person.guardianPersonIndex === null
    ) {
      warnings.push({
        message: `${label} is a minor. Choose the adult travelling as their guardian.`,
        path: `people.${index}.guardianPersonIndex`,
      });
    }

    if (!freeMovement) {
      const arrival = draft.voyage.arrivalDateTime.slice(0, 10);
      if (arrival && departure) {
        const stayDays = daysBetween(arrival, departure);
        if (!Number.isNaN(stayDays) && stayDays > 90) {
          warnings.push({
            message: `${label} is staying over 90 days. Non-EU nationals are usually limited to 90 days in any 180-day period in the Schengen area.`,
            path: `people.${index}`,
          });
        }
      }
    }
  }

  const flagCountry = draft.boatIdentity.flagCountry;
  const nonEUFlagged = !!flagCountry && !isEU(flagCountry);
  if (nonEUFlagged) {
    if (draft.owner.countryOfResidence && isEU(draft.owner.countryOfResidence)) {
      warnings.push({
        message:
          "The boat is flagged outside the EU but the owner is resident in the EU. Temporary Admission is not normally available in that case; check with customs.",
        path: "owner.countryOfResidence",
      });
    }
    if (draft.vesselUse !== "private") {
      warnings.push({
        message:
          "This is a non-EU-flagged boat used for charter or commercial purposes. Temporary Admission does not apply; different VAT and customs rules apply, so contact the marina.",
        path: "vesselUse",
      });
    }
  }

  return warnings;
}
