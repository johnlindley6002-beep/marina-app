import type { Marina, Quote } from "@/data/marinas";
import { type BoatDocuments } from "@/features/my-boat/lib/boatProfile";
import { isCommercialUse } from "@/features/marina/components/VesselUseFields";
import { formatEuros } from "@/lib/i18n/format";
import { mailText } from "@/lib/i18n/mail";
import type { Locale } from "@/lib/i18n/types";
import { type FormData, type CrewMember, type PersonType } from "./types";

// The plain-text enquiry that opens in the visitor's email app, addressed to
// the marina. It is written in English or Portuguese (see lib/i18n/mail.ts).
export function buildSummary(
  form: FormData,
  marina: Marina,
  nights: number | null,
  quote: Quote | null,
  docs: BoatDocuments | null,
  locale: Locale
): string {
  const m = mailText(locale);
  const e = m.enquiry;
  const money = (amount: number) => formatEuros(amount, locale === "pt" ? "pt" : "en");
  const lines: string[] = [];

  lines.push(e.title(marina.name.toUpperCase()));
  lines.push("");

  lines.push(e.visit);
  lines.push(e.arrival(form.arrival, form.eta));
  if (form.openEnded) {
    lines.push(e.departureOpen);
  } else {
    lines.push(e.departure(form.departure, form.etd));
    if (nights) lines.push(e.nights(nights));
  }
  lines.push("");

  lines.push(e.yourBoat);
  lines.push(e.boatName(form.boatName));
  lines.push(e.vesselType(form.vesselType ? m.vesselType[form.vesselType] : ""));
  lines.push(m.boat.length(form.loa));
  lines.push(m.boat.beam(form.beam));
  lines.push(m.boat.draft(form.draft));
  lines.push(m.boat.flag(form.flagCountry));
  if (form.berthId.trim()) lines.push(e.selectedBerth(form.berthId));
  lines.push("");

  lines.push(e.skipperAndContact);
  lines.push(e.skipper(form.skipperName));
  lines.push(e.phone(form.phone));
  lines.push(e.email(form.email));
  if (form.homePort.trim()) lines.push(m.boat.homePort(form.homePort));
  lines.push(e.people(form.peopleOnBoard));
  lines.push("");

  const services: string[] = [];
  if (form.shorePower) services.push(e.shorePower(form.amperage));
  if (form.water) services.push(e.water);
  if (form.helpMooring) services.push(e.helpMooring);
  if (form.helpSlipping) services.push(e.helpSlipping);
  if (form.pumpOut) services.push(e.pumpOut);
  if (form.fuel) services.push(e.fuel);
  if (form.laundry) services.push(e.laundry);
  if (services.length > 0) {
    lines.push(e.servicesNeeded);
    lines.push(...services);
    lines.push("");
  }

  if (quote) {
    const addOnNames = {
      shorePower: e.shorePower(form.amperage),
      water: e.water,
      pumpOut: e.pumpOut,
      fuel: e.fuel,
      laundry: e.laundry,
    };
    lines.push(e.estimate);
    lines.push(e.berthClass(quote.marinaClass));
    quote.berthLines.forEach((l) =>
      lines.push(e.berthLine(l.nights, money(l.rateEur), m.season[l.season], money(l.subtotalEur)))
    );
    quote.addOnLines.forEach((l) => {
      lines.push(`${addOnNames[l.kind]}${l.amountEur !== null ? `: ${money(l.amountEur)}` : ""}`);
    });
    lines.push(e.estimatedTotal(money(quote.estimatedTotalEur)));
    lines.push("");
  }

  if (docs) {
    const docLines = [
      docs.registrationNumber && e.registrationNumber(docs.registrationNumber),
      docs.insuranceProvider && e.insuranceProvider(docs.insuranceProvider),
      docs.insurancePolicy && e.insurancePolicy(docs.insurancePolicy),
      docs.insuranceExpiry && e.insuranceExpiry(docs.insuranceExpiry),
      docs.competenceCertificate && e.competence(docs.competenceCertificate),
      docs.vhfLicence && e.vhfLicence(docs.vhfLicence),
    ].filter(Boolean) as string[];
    if (docLines.length > 0) {
      lines.push(e.documents);
      lines.push(...docLines);
      lines.push("");
    }
  }

  lines.push(e.vesselUse);
  lines.push(e.use(form.vesselUse ? m.vesselUse[form.vesselUse] : ""));
  lines.push("");
  if (isCommercialUse(form.vesselUse)) {
    lines.push(e.commercial);
    lines.push(e.operatingEntity(form.operatingEntity.trim()));
    lines.push(e.companyRegistration(form.companyRegistration.trim()));
    lines.push(
      form.vesselUse === "bareboat"
        ? e.bareboatParty(form.skipperName.trim())
        : e.otherParty(form.contractName.trim(), form.contractRole.trim())
    );
    lines.push(e.insuranceConfirmed);
    if (form.vesselUse === "crewed") {
      lines.push(e.professionalCrew(form.professionalCrewCount));
      lines.push(e.guests(form.guestCount));
    }
    lines.push("");
  }

  lines.push(e.vesselStatus);
  lines.push(e.euStatus(form.euStatus === "yes"));
  if (form.euStatus === "no") {
    lines.push(e.lastPort(form.lastPort));
    lines.push(e.nextPort(form.nextPort));
    const completeCrew = form.crew.filter((c) => c.fullName.trim());
    const crewLine = (c: CrewMember, i: number) => {
      const parts = [
        c.fullName,
        c.dateOfBirth && e.crewDob(c.dateOfBirth),
        c.nationality,
        c.passportNumber.trim() && e.crewPassport(c.passportNumber.trim()),
        c.role.trim(),
        c.joinDate && e.crewJoined(c.joinDate),
      ].filter(Boolean);
      return `${i + 1}. ${parts.join(" - ")}`;
    };
    if (form.vesselUse === "crewed") {
      // Crew and guests are listed separately: immigration treats them differently.
      const groups: [string, PersonType][] = [
        [e.professionalCrewTitle, "crew"],
        [e.guestsTitle, "guest"],
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
      lines.push(e.crewListTitle);
      completeCrew.forEach((c, i) => lines.push(crewLine(c, i)));
    }
  }

  return lines.join("\n").trim();
}
