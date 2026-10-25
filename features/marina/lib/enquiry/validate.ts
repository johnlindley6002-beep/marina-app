import { isCommercialUse } from "@/features/marina/components/VesselUseFields";
import type { FormData } from "./types";

export type Errors = Partial<Record<keyof FormData, string>> & { crew?: string };

export function validate(form: FormData): Errors {
  const errors: Errors = {};

  if (!form.arrival) errors.arrival = "Choose your arrival date in Plan your stay.";
  if (!form.eta) errors.eta = "Enter your expected arrival time, for example 15:30.";

  if (!form.openEnded) {
    if (!form.departure)
      errors.departure = "Choose your departure date in Plan your stay, or tick open-ended stay.";
    if (!form.etd) errors.etd = "Enter your expected departure time, for example 10:00.";
    if (form.arrival && form.departure && form.departure <= form.arrival) {
      errors.departure =
        "Departure must be after arrival. Choose a later departure date in Plan your stay.";
    }
  }

  if (!form.boatName.trim()) errors.boatName = "Enter your boat's name.";
  if (!form.vesselType)
    errors.vesselType = "Choose a vessel type: sail, motor, catamaran or other.";
  if (!form.loa || Number(form.loa) <= 0)
    errors.loa = "Enter your boat's length overall, for example 12.5.";
  if (!form.beam || Number(form.beam) <= 0)
    errors.beam = "Enter your boat's beam, for example 4.2.";
  if (!form.draft || Number(form.draft) <= 0)
    errors.draft = "Enter your boat's draft, for example 1.8.";
  if (!form.flagCountry) errors.flagCountry = "Choose the country your boat is registered in.";

  if (!form.skipperName.trim()) errors.skipperName = "Enter the skipper's full name.";
  if (!form.phone.trim())
    errors.phone = "Enter a phone number the marina can reach you on, including the country code.";
  if (!form.email.trim()) {
    errors.email = "Enter your email address so the marina can reply.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Enter an email address like name@example.com.";
  }
  if (!form.peopleOnBoard || Number(form.peopleOnBoard) <= 0) {
    errors.peopleOnBoard = "Enter how many people will be on board (1 or more).";
  }

  if (form.shorePower && !form.amperage) {
    errors.amperage = "Choose a shore power amperage in Price estimate & extras.";
  }

  if (!form.vesselUse) {
    errors.vesselUse =
      "Choose how the vessel will be used: private pleasure, charter or commercial.";
  } else if (isCommercialUse(form.vesselUse)) {
    if (!form.operatingEntity.trim()) {
      errors.operatingEntity = "Enter the charter operator or owning company name.";
    }
    if (!form.companyRegistration.trim()) {
      errors.companyRegistration = "Enter the company registration or VAT (NIF) number.";
    }
    if (form.vesselUse !== "bareboat") {
      if (!form.contractName.trim()) {
        errors.contractName = "Enter the name of the responsible contracting party.";
      }
      if (!form.contractRole.trim()) {
        errors.contractRole = "Enter their role, for example operator or company representative.";
      }
    }
    if (!form.insuranceConfirmed) {
      errors.insuranceConfirmed =
        "Tick to confirm commercial third-party liability insurance is in place.";
    }
    if (form.vesselUse === "crewed") {
      if (!(Number(form.professionalCrewCount) >= 1)) {
        errors.professionalCrewCount = "Enter how many professional crew are on board (1 or more).";
      }
      if (!(Number(form.guestCount) >= 1)) {
        errors.guestCount = "Enter how many guests or passengers are on board (1 or more).";
      }
    }
  }

  if (!form.euStatus)
    errors.euStatus = "Answer Yes or No so the marina knows which paperwork applies.";
  if (form.euStatus === "no") {
    if (!form.lastPort.trim()) errors.lastPort = "Enter the port you are arriving from.";
    if (!form.nextPort.trim()) errors.nextPort = "Enter the port you are heading to next.";
    const hasCompleteCrewRow = form.crew.some(
      (c) => c.fullName.trim() && c.nationality && c.role.trim()
    );
    if (!hasCompleteCrewRow) {
      errors.crew = "Add at least one crew member with a name, nationality and role.";
    }
  }

  return errors;
}
