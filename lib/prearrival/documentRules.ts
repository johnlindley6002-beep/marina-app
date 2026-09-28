// Which documents Step 4 asks for, derived from the boat's flag, class,
// propulsion and the voyage, rather than one fixed checklist for everyone.

import type { MarinaClass } from "../../data/marinas";
import { isEU } from "./countries";
import { classifyByLengthAndBeam } from "./pricing";
import { getVoyageFlags, type DocumentKey, type PreArrivalDraft } from "./schema";

export type DocumentRequirement = {
  key: DocumentKey;
  label: string;
  required: boolean;
  reason: string;
};

const SMALL_CLASSES: MarinaClass[] = ["I", "IA", "II", "III", "IV"];

// Insurance is required for boat classes I to IV outright, for a motorised
// class V boat, and for a sailboat over 7 m in class V; smaller sailboats are
// the one case it is only requested, not required, on the marina's own side,
// though every foreign boat is treated as required regardless of class.
function isInsuranceRequired(draft: PreArrivalDraft): boolean {
  const lengthM = Number(draft.boatSpecs.lengthOverall) || 0;
  const marinaClass = classifyByLengthAndBeam(
    lengthM,
    Number(draft.boatSpecs.beam) || 0
  );
  const isForeign = draft.boatIdentity.flagCountry !== "Portugal";
  if (isForeign) return true;
  if (!marinaClass) return true;
  if (SMALL_CLASSES.includes(marinaClass)) return true;
  if (marinaClass === "V") {
    if (draft.boatSpecs.propulsion !== "sail") return true;
    return lengthM > 7;
  }
  return true;
}

export function getDocumentRequirements(
  draft: PreArrivalDraft
): DocumentRequirement[] {
  const isPortuguese = draft.boatIdentity.flagCountry === "Portugal";
  const voyageFlags = getVoyageFlags(draft.voyage);
  const isNonEUFlagged =
    !isPortuguese &&
    !!draft.boatIdentity.flagCountry &&
    !isEU(draft.boatIdentity.flagCountry);

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
      reason:
        "Optional here, but the marina will ask for it on arrival for a non-EU-flagged boat.",
    });
  }

  void voyageFlags; // reserved: a future rule may add a border-crossing document
  return list;
}

// True once every required document has a number or a mock upload; used to
// gate Review as a hard error (a missing required document is not merely a
// warning), separately from the Zod pass in schema.ts.
export function getMissingRequiredDocuments(
  draft: PreArrivalDraft
): DocumentRequirement[] {
  return getDocumentRequirements(draft).filter((req) => {
    if (!req.required) return false;
    const entry = draft.documents[req.key];
    return !entry.uploaded && !entry.number.trim();
  });
}
