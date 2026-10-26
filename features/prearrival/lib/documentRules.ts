// Which documents Step 4 asks for, derived from the boat's flag, class,
// propulsion and the voyage, rather than one fixed checklist for everyone.

import { isEU } from "@/lib/countries";
import { getVoyageFlags, type DocumentKey, type PreArrivalDraft } from "./schema";

export type DocumentRequirement = {
  key: DocumentKey;
  label: string;
  required: boolean;
  reason: string;
};

// Third-party insurance is required for a Portuguese-flagged boat by its
// navigation zone (DL 93/2018, art. 33): zones 1 to 4 always; zone 5 when the
// boat is motorised (power, or sail and power), or is a sailboat over 7 m. A
// zone 5 sailboat of 7 m or less with no engine is the one case it is not
// required. A foreign-flagged boat, or a Portuguese one with no zone chosen
// yet, is treated as required, because the marina asks every visitor for it.
const ZONE_5_SAIL_LIMIT_M = 7;

function isInsuranceRequired(draft: PreArrivalDraft): boolean {
  const zone = draft.boatIdentity.navigationZoneType;
  const isPortuguese = draft.boatIdentity.flagCountry === "Portugal";
  if (!isPortuguese || zone === null) return true;
  if (zone <= 4) return true;
  if (draft.boatSpecs.propulsion !== "sail") return true;
  return (Number(draft.boatSpecs.lengthOverall) || 0) > ZONE_5_SAIL_LIMIT_M;
}

export function getDocumentRequirements(draft: PreArrivalDraft): DocumentRequirement[] {
  const isPortuguese = draft.boatIdentity.flagCountry === "Portugal";
  const voyageFlags = getVoyageFlags(draft.voyage);
  const isNonEUFlagged =
    !isPortuguese && !!draft.boatIdentity.flagCountry && !isEU(draft.boatIdentity.flagCountry);

  const list: DocumentRequirement[] = [
    {
      key: "registration",
      label: "Boat registration (livrete)",
      required: true,
      reason: "Required for every boat.",
    },
    {
      key: "thirdPartyInsurance",
      label: "Third-party liability insurance",
      required: isInsuranceRequired(draft),
      reason: isInsuranceRequired(draft)
        ? "Required for this boat's class, or requested by the marina for a foreign-flagged boat."
        : "Not required for this small sailboat, but worth bringing anyway.",
    },
    {
      key: "skipperLicence",
      label: "Skipper's certificate of competence",
      required: true,
      reason: "Required for every boat.",
    },
  ];

  if (isPortuguese) {
    list.push({
      key: "iucProof",
      label: "Proof of IUC (boat tax) payment",
      required: true,
      reason: "Required for a Portuguese-flagged boat.",
    });
  }

  list.push({
    key: "radioStationLicence",
    label: "Radio station licence",
    required: false,
    reason: "Optional, if the boat carries VHF.",
  });
  list.push({
    key: "surveyCertificate",
    label: "Survey certificate",
    required: false,
    reason: "Optional, if the boat has one.",
  });

  if (isNonEUFlagged) {
    list.push({
      key: "temporaryAdmissionEvidence",
      label: "Evidence of Temporary Admission (customs)",
      required: false,
      reason: "Optional here, but the marina will ask for it on arrival for a non-EU-flagged boat.",
    });
  }

  void voyageFlags; // reserved: a future rule may add a border-crossing document
  return list;
}

// True once every required document has a number or a mock upload; used to
// gate Review as a hard error (a missing required document is not merely a
// warning), separately from the Zod pass in schema.ts.
export function getMissingRequiredDocuments(draft: PreArrivalDraft): DocumentRequirement[] {
  return getDocumentRequirements(draft).filter((req) => {
    if (!req.required) return false;
    const entry = draft.documents[req.key];
    return !entry.uploaded && !entry.number.trim();
  });
}
