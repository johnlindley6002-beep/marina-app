// The boat exists in two shapes: the saved boat in My boat (SavedBoat, a flat
// profile) and the pre-arrival draft (BoatIdentity, BoatSpecs and Documents from
// the Zod schema). Every conversion between them lives here, so the two cannot
// drift apart in different components.

import type { BoatDocuments, SavedBoat } from "@/features/my-boat/lib/boatProfile";
import { emptyDocuments, type Documents, type PreArrivalDraft, type Propulsion } from "./schema";

export function propulsionForBoatType(type: string): {
  propulsion: Propulsion;
  isMultihull: boolean;
} {
  if (type === "motor") return { propulsion: "power", isMultihull: false };
  if (type === "catamaran") return { propulsion: "sail_and_power", isMultihull: true };
  return { propulsion: "sail", isMultihull: false };
}

export function boatTypeForSpecs(propulsion: string, isMultihull: boolean): string {
  if (isMultihull) return "catamaran";
  return propulsion === "power" ? "motor" : "sail";
}

function documentsFromWallet(wallet: BoatDocuments, current: Documents): Documents {
  return {
    ...emptyDocuments(),
    registration: { ...current.registration, number: wallet.registrationNumber },
    thirdPartyInsurance: {
      ...current.thirdPartyInsurance,
      number: wallet.insurancePolicy,
      insurer: wallet.insuranceProvider,
      expiryDate: wallet.insuranceExpiry,
    },
    skipperLicence: { ...current.skipperLicence, number: wallet.competenceCertificate },
    radioStationLicence: { ...current.radioStationLicence, number: wallet.vhfLicence },
  };
}

// Fill the draft's boat sections from a boat saved in My boat.
export function applySavedBoatToDraft(draft: PreArrivalDraft, boat: SavedBoat): PreArrivalDraft {
  return {
    ...draft,
    boatId: boat.id,
    boatIdentity: {
      ...draft.boatIdentity,
      name: boat.name,
      flagCountry: boat.flag,
      registrationNumber:
        draft.documents.registration.number || boat.documents?.registrationNumber || "",
      portOfRegistry: draft.boatIdentity.portOfRegistry || boat.homePort,
    },
    boatSpecs: {
      ...draft.boatSpecs,
      lengthOverall: boat.loa,
      beam: boat.beam,
      draught: boat.draft,
      ...propulsionForBoatType(boat.type),
    },
    documents: boat.documents
      ? documentsFromWallet(boat.documents, draft.documents)
      : draft.documents,
  };
}

// The boat in a submitted draft, as a profile to save to My boat.
export function draftToSavedBoat(draft: PreArrivalDraft): Omit<SavedBoat, "id"> {
  const { boatIdentity, boatSpecs, documents } = draft;
  return {
    name: boatIdentity.name,
    type: boatTypeForSpecs(boatSpecs.propulsion, boatSpecs.isMultihull),
    loa: boatSpecs.lengthOverall,
    beam: boatSpecs.beam,
    draft: boatSpecs.draught,
    flag: boatIdentity.flagCountry,
    homePort: boatIdentity.portOfRegistry,
    documents: {
      registrationNumber: documents.registration.number,
      insuranceProvider: documents.thirdPartyInsurance.insurer,
      insurancePolicy: documents.thirdPartyInsurance.number,
      insuranceExpiry: documents.thirdPartyInsurance.expiryDate,
      competenceCertificate: documents.skipperLicence.number,
      vhfLicence: documents.radioStationLicence.number,
    },
  };
}
