import { isCommercialUse } from "@/features/marina/components/VesselUseFields";
import type { Dictionary } from "@/lib/i18n";
import type { FormData } from "./types";

export type Errors = Partial<Record<keyof FormData, string>> & { crew?: string };

export function validate(form: FormData, text: Dictionary["enquiry"]["errors"]): Errors {
  const errors: Errors = {};

  if (!form.arrival) errors.arrival = text.arrival;
  if (!form.eta) errors.eta = text.eta;

  if (!form.openEnded) {
    if (!form.departure) errors.departure = text.departure;
    if (!form.etd) errors.etd = text.etd;
    if (form.arrival && form.departure && form.departure <= form.arrival) {
      errors.departure = text.departureBefore;
    }
  }

  if (!form.boatName.trim()) errors.boatName = text.boatName;
  if (!form.vesselType) errors.vesselType = text.vesselType;
  if (!form.loa || Number(form.loa) <= 0) errors.loa = text.loa;
  if (!form.beam || Number(form.beam) <= 0) errors.beam = text.beam;
  if (!form.draft || Number(form.draft) <= 0) errors.draft = text.draft;
  if (!form.flagCountry) errors.flagCountry = text.flagCountry;

  if (!form.skipperName.trim()) errors.skipperName = text.skipperName;
  if (!form.phone.trim()) errors.phone = text.phone;
  if (!form.email.trim()) {
    errors.email = text.emailMissing;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = text.emailInvalid;
  }
  if (!form.peopleOnBoard || Number(form.peopleOnBoard) <= 0) {
    errors.peopleOnBoard = text.peopleOnBoard;
  }

  if (form.shorePower && !form.amperage) {
    errors.amperage = text.amperage;
  }

  if (!form.vesselUse) {
    errors.vesselUse = text.vesselUse;
  } else if (isCommercialUse(form.vesselUse)) {
    if (!form.operatingEntity.trim()) {
      errors.operatingEntity = text.operatingEntity;
    }
    if (!form.companyRegistration.trim()) {
      errors.companyRegistration = text.companyRegistration;
    }
    if (form.vesselUse !== "bareboat") {
      if (!form.contractName.trim()) {
        errors.contractName = text.contractName;
      }
      if (!form.contractRole.trim()) {
        errors.contractRole = text.contractRole;
      }
    }
    if (!form.insuranceConfirmed) {
      errors.insuranceConfirmed = text.insuranceConfirmed;
    }
    if (form.vesselUse === "crewed") {
      if (!(Number(form.professionalCrewCount) >= 1)) {
        errors.professionalCrewCount = text.professionalCrewCount;
      }
      if (!(Number(form.guestCount) >= 1)) {
        errors.guestCount = text.guestCount;
      }
    }
  }

  if (!form.euStatus) errors.euStatus = text.euStatus;
  if (form.euStatus === "no") {
    if (!form.lastPort.trim()) errors.lastPort = text.lastPort;
    if (!form.nextPort.trim()) errors.nextPort = text.nextPort;
    const hasCompleteCrewRow = form.crew.some(
      (c) => c.fullName.trim() && c.nationality && c.role.trim()
    );
    if (!hasCompleteCrewRow) {
      errors.crew = text.crew;
    }
  }

  return errors;
}
