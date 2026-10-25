import { SEASON_LABELS, type Marina, type Quote } from "@/data/marinas";
import { type BoatDocuments } from "@/features/my-boat/lib/boatProfile";
import { isCommercialUse, VESSEL_USE_LABELS } from "@/features/marina/components/VesselUseFields";
import { type FormData, type CrewMember, type PersonType, VESSEL_TYPE_LABELS } from "./types";

export function formatEurShort(amount: number): string {
  if (amount >= 1_000_000) return `€${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `€${(amount / 1_000).toFixed(0)}K`;
  return `€${amount}`;
}

export function formatEur(amount: number): string {
  return `€${amount.toFixed(2)}`;
}

export function buildSummary(
  form: FormData,
  marina: Marina,
  nights: number | null,
  quote: Quote | null,
  docs: BoatDocuments | null
): string {
  const lines: string[] = [];

  lines.push(`BERTH ENQUIRY - ${marina.name.toUpperCase()}`);
  lines.push("");

  lines.push("YOUR VISIT");
  lines.push(`Arrival: ${form.arrival} (ETA ${form.eta})`);
  if (form.openEnded) {
    lines.push("Departure: open-ended stay");
  } else {
    lines.push(`Departure: ${form.departure} (ETD ${form.etd})`);
    if (nights) lines.push(`Nights: ${nights}`);
  }
  lines.push("");

  lines.push("YOUR BOAT");
  lines.push(`Boat name: ${form.boatName}`);
  lines.push(`Vessel type: ${form.vesselType ? VESSEL_TYPE_LABELS[form.vesselType] : ""}`);
  lines.push(`Length overall: ${form.loa} m`);
  lines.push(`Beam: ${form.beam} m`);
  lines.push(`Draft: ${form.draft} m`);
  lines.push(`Flag: ${form.flagCountry}`);
  if (form.berthId.trim()) lines.push(`Selected berth: ${form.berthId}`);
  lines.push("");

  lines.push("SKIPPER & CONTACT");
  lines.push(`Skipper: ${form.skipperName}`);
  lines.push(`Phone: ${form.phone}`);
  lines.push(`Email: ${form.email}`);
  if (form.homePort.trim()) lines.push(`Home port: ${form.homePort}`);
  lines.push(`People on board: ${form.peopleOnBoard}`);
  lines.push("");

  const services: string[] = [];
  if (form.shorePower) services.push(`Shore power (${form.amperage}A)`);
  if (form.water) services.push("Water");
  if (form.helpMooring) services.push("Help mooring on arrival");
  if (form.helpSlipping) services.push("Help slipping lines on departure");
  if (form.pumpOut) services.push("Pump-out");
  if (form.fuel) services.push("Fuel on arrival");
  if (form.laundry) services.push("Laundry");
  if (services.length > 0) {
    lines.push("SERVICES NEEDED");
    lines.push(...services);
    lines.push("");
  }

  if (quote) {
    lines.push("ESTIMATE (excl. VAT and utilities, to be confirmed by the marina)");
    lines.push(`Berth class: ${quote.marinaClass}`);
    quote.berthLines.forEach((l) =>
      lines.push(
        `${l.nights} night(s) × ${formatEur(l.rateEur)} (${SEASON_LABELS[l.season]}) = ${formatEur(l.subtotalEur)}`
      )
    );
    quote.addOnLines.forEach((l) => {
      const parts = [l.amountEur !== null ? formatEur(l.amountEur) : "", l.note ?? ""];
      lines.push(`${l.label}: ${parts.filter(Boolean).join(" - ")}`);
    });
    lines.push(`Estimated total: ${formatEur(quote.estimatedTotalEur)}`);
    lines.push("");
  }

  if (docs) {
    const docLines = [
      docs.registrationNumber && `Registration number: ${docs.registrationNumber}`,
      docs.insuranceProvider && `Insurance provider: ${docs.insuranceProvider}`,
      docs.insurancePolicy && `Insurance policy: ${docs.insurancePolicy}`,
      docs.insuranceExpiry && `Insurance expiry: ${docs.insuranceExpiry}`,
      docs.competenceCertificate && `Competence certificate: ${docs.competenceCertificate}`,
      docs.vhfLicence && `VHF licence: ${docs.vhfLicence}`,
    ].filter(Boolean) as string[];
    if (docLines.length > 0) {
      lines.push("DOCUMENTS (originals to be shown on arrival)");
      lines.push(...docLines);
      lines.push("");
    }
  }

  lines.push("VESSEL USE");
  lines.push(`Use: ${form.vesselUse ? VESSEL_USE_LABELS[form.vesselUse] : ""}`);
  lines.push("");
  if (isCommercialUse(form.vesselUse)) {
    lines.push("COMMERCIAL / CHARTER DETAILS");
    lines.push(`Operating entity: ${form.operatingEntity.trim()}`);
    lines.push(`Company registration / VAT (NIF): ${form.companyRegistration.trim()}`);
    lines.push(
      `Responsible contracting party: ${
        form.vesselUse === "bareboat"
          ? `${form.skipperName.trim()} (bareboat charterer, skipper)`
          : `${form.contractName.trim()} (${form.contractRole.trim()})`
      }`
    );
    lines.push("Commercial third-party liability insurance: confirmed");
    if (form.vesselUse === "crewed") {
      lines.push(`Professional crew on board: ${form.professionalCrewCount}`);
      lines.push(`Guests / passengers on board: ${form.guestCount}`);
    }
    lines.push("");
  }

  lines.push("VESSEL STATUS");
  lines.push(
    `EU-flagged & EU/Schengen crew, arriving from another EU port: ${
      form.euStatus === "yes" ? "Yes" : "No"
    }`
  );
  if (form.euStatus === "no") {
    lines.push(`Last port: ${form.lastPort}`);
    lines.push(`Next port: ${form.nextPort}`);
    const completeCrew = form.crew.filter((c) => c.fullName.trim());
    const crewLine = (c: CrewMember, i: number) => {
      const parts = [
        c.fullName,
        c.dateOfBirth && `DOB ${c.dateOfBirth}`,
        c.nationality,
        c.passportNumber.trim() && `Passport ${c.passportNumber.trim()}`,
        c.role.trim(),
        c.joinDate && `Joined ${c.joinDate}`,
      ].filter(Boolean);
      return `${i + 1}. ${parts.join(" - ")}`;
    };
    if (form.vesselUse === "crewed") {
      // Crew and guests are listed separately: immigration treats them differently.
      const groups: [string, PersonType][] = [
        ["PROFESSIONAL CREW", "crew"],
        ["GUESTS / PASSENGERS", "guest"],
      ];
      groups.forEach(([title, type]) => {
        const list = completeCrew.filter((c) => c.personType === type);
        if (list.length > 0) {
          lines.push("");
          lines.push(title);
          list.forEach((c, i) => lines.push(crewLine(c, i)));
        }
      });
    } else if (completeCrew.length > 0) {
      lines.push("");
      lines.push("CREW LIST");
      completeCrew.forEach((c, i) => lines.push(crewLine(c, i)));
    }
  }

  return lines.join("\n").trim();
}
