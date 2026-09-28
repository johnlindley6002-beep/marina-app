// A DRAFT export of the fields a marina reports to the maritime, border and
// customs authorities (Latitude 32) for a boat moving from or to outside the
// EU. This is illustrative only: the official field list is confirmed with
// the marina, not invented here. See getVoyageFlags for when this applies.

import type { PreArrivalCheckIn } from "../mockData";
import { getVoyageFlags } from "../prearrival/schema";

type FlatRow = Record<string, string>;

function boatFields(checkIn: PreArrivalCheckIn): FlatRow {
  const { boatIdentity, boatSpecs } = checkIn.draft;
  return {
    boatName: boatIdentity.name,
    registrationNumber: boatIdentity.registrationNumber,
    flagCountry: boatIdentity.flagCountry,
    portOfRegistry: boatIdentity.portOfRegistry,
    lengthOverallM: boatSpecs.lengthOverall,
    beamM: boatSpecs.beam,
    propulsion: boatSpecs.propulsion,
  };
}

function voyageFields(checkIn: PreArrivalCheckIn): FlatRow {
  const { voyage } = checkIn.draft;
  const flags = getVoyageFlags(voyage);
  return {
    lastPort: voyage.lastPortName,
    lastPortCountry: voyage.lastPortCountry,
    nextPort: voyage.nextPortName,
    nextPortCountry: voyage.nextPortCountry,
    arrival: voyage.arrivalDateTime,
    departure: voyage.departureDateTime,
    crossesExternalBorder: String(flags.crossesExternalBorder),
    fromOrToNonEU: String(flags.fromOrToNonEU),
  };
}

export type AuthorityReportDraft = {
  format: "draft";
  note: string;
  referenceCode: string;
  boat: FlatRow;
  voyage: FlatRow;
  crew: FlatRow[];
};

export function buildAuthorityReportDraft(checkIn: PreArrivalCheckIn): AuthorityReportDraft {
  return {
    format: "draft",
    note: "Draft format. The official Latitude 32 field list will be confirmed with the marina.",
    referenceCode: checkIn.referenceCode,
    boat: boatFields(checkIn),
    voyage: voyageFields(checkIn),
    crew: checkIn.draft.people.map((p, i) => ({
      no: String(i + 1),
      familyName: p.familyName,
      givenNames: p.givenNames,
      role: p.role,
      nationality: p.nationality,
      dateOfBirth: p.dateOfBirth,
      placeOfBirth: p.placeOfBirth,
      idType: p.idType,
      idNumber: p.idNumber,
      idIssuingState: p.idIssuingState,
      idExpiryDate: p.idExpiryDate,
    })),
  };
}

export function buildAuthorityReportJson(checkIn: PreArrivalCheckIn): string {
  return JSON.stringify(buildAuthorityReportDraft(checkIn), null, 2);
}

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function buildAuthorityReportCsv(checkIn: PreArrivalCheckIn): string {
  const draft = buildAuthorityReportDraft(checkIn);
  const boatVoyage = [
    ["section", "field", "value"],
    ...Object.entries(draft.boat).map(([k, v]) => ["boat", k, v]),
    ...Object.entries(draft.voyage).map(([k, v]) => ["voyage", k, v]),
  ];
  const crewHeader = [
    "no",
    "familyName",
    "givenNames",
    "role",
    "nationality",
    "dateOfBirth",
    "placeOfBirth",
    "idType",
    "idNumber",
    "idIssuingState",
    "idExpiryDate",
  ];
  const crewRows = draft.crew.map((row) => crewHeader.map((key) => row[key] ?? ""));
  const lines = [
    `# ${draft.note}`,
    `# reference,${draft.referenceCode}`,
    ...boatVoyage.map((row) => row.map(csvCell).join(",")),
    "",
    crewHeader.join(","),
    ...crewRows.map((row) => row.map(csvCell).join(",")),
  ];
  return lines.join("\n");
}
