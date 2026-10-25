import type { Marina } from "@/data/marinas";
import type { BoatDocuments } from "@/features/my-boat/lib/boatProfile";
import { EMPTY_ENQUIRY_DOCUMENTS } from "@/lib/data";
import type { FormData } from "./types";

// What the "Rebook this stay" shortcut remembers about the last enquiry.
export function toLastEnquiry(form: FormData, marina: Marina) {
  return {
    marinaId: marina.id,
    countrySlug: marina.countrySlug,
    marinaName: marina.name,
    savedAt: new Date().toISOString(),
    arrival: form.arrival,
    eta: form.eta,
    departure: form.openEnded ? "" : form.departure,
    etd: form.openEnded ? "" : form.etd,
    openEnded: form.openEnded,
    boatName: form.boatName,
    vesselType: form.vesselType,
    loa: form.loa,
    beam: form.beam,
    draft: form.draft,
    flag: form.flagCountry,
    homePort: form.homePort,
    berthId: form.berthId,
    services: {
      shorePower: form.shorePower,
      amperage: form.amperage,
      water: form.water,
      helpMooring: form.helpMooring,
      helpSlipping: form.helpSlipping,
      pumpOut: form.pumpOut,
      fuel: form.fuel,
      laundry: form.laundry,
    },
  };
}

// What the staff back office receives when an enquiry is sent. The email the
// boater's own mail app sends is still the record; this lets staff act in
// real time as well.
export function toEnquiryInput(form: FormData, marina: Marina, docs: BoatDocuments | null) {
  return {
    marinaId: marina.id,
    arrival: form.arrival,
    eta: form.eta,
    departure: form.openEnded ? "" : form.departure,
    etd: form.openEnded ? "" : form.etd,
    openEnded: form.openEnded,
    boatName: form.boatName,
    vesselType: form.vesselType,
    loa: form.loa,
    beam: form.beam,
    draft: form.draft,
    flagCountry: form.flagCountry,
    requestedBerthId: form.berthId,
    skipperName: form.skipperName,
    phone: form.phone,
    email: form.email,
    homePort: form.homePort,
    peopleOnBoard: form.peopleOnBoard,
    services: {
      shorePower: form.shorePower,
      amperage: form.amperage,
      water: form.water,
      helpMooring: form.helpMooring,
      helpSlipping: form.helpSlipping,
      pumpOut: form.pumpOut,
      fuel: form.fuel,
      laundry: form.laundry,
    },
    vesselUse: form.vesselUse,
    operatingEntity: form.operatingEntity,
    companyRegistration: form.companyRegistration,
    contractName: form.contractName,
    contractRole: form.contractRole,
    euStatus: form.euStatus,
    lastPort: form.lastPort,
    nextPort: form.nextPort,
    crew: form.crew,
    documents: docs ?? { ...EMPTY_ENQUIRY_DOCUMENTS },
  };
}
