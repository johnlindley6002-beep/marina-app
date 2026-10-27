// The reception check-in: which documents to see for a boat, and the checks
// on the boat and guest details staff correct at the desk.

import { isEU } from "@/lib/countries";

export type ChecklistKey =
  | "registration"
  | "insurance"
  | "skipperLicence"
  | "vhfLicence"
  | "crewList"
  | "passports"
  | "borderCheck"
  | "customs";

// Asked of every boat.
const BASE: ChecklistKey[] = [
  "registration",
  "insurance",
  "skipperLicence",
  "vhfLicence",
  "crewList",
];

// Added when the boat or anyone aboard is from outside the EU: passports,
// border control for the people and customs for the boat.
const NON_EU_EXTRA: ChecklistKey[] = ["passports", "borderCheck", "customs"];

// Whether the boat counts as EU for the checklist. The guest's own answer
// ("EU flag and EU crew": yes or no) wins; without one, the flag decides; with
// neither, the boat is treated as non-EU so nothing is skipped.
export function isEuBoat(boat: { euStatus: "yes" | "no" | ""; flagCountry: string }): boolean {
  if (boat.euStatus === "yes") return true;
  if (boat.euStatus === "no") return false;
  return boat.flagCountry !== "" && isEU(boat.flagCountry);
}

export function checklistFor(eu: boolean): ChecklistKey[] {
  return eu ? BASE : [...BASE, ...NON_EU_EXTRA];
}

// Every document on the list has been seen.
export function checklistComplete(eu: boolean, checked: string[]): boolean {
  return checklistFor(eu).every((key) => checked.includes(key));
}

export type BoatDetails = {
  boatName: string;
  loa: string;
  beam: string;
  draft: string;
};

export type BoatDetailsErrors = Partial<Record<keyof BoatDetails, "required" | "number">>;

// A length in metres: empty, or a positive number up to 100 m. A comma is
// accepted as the decimal mark ("9,5").
export function parseMetres(value: string): number | null | "invalid" {
  const trimmed = value.trim().replace(",", ".");
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isFinite(n) && n > 0 && n <= 100 ? n : "invalid";
}

export function validateBoatDetails(details: BoatDetails): BoatDetailsErrors {
  const errors: BoatDetailsErrors = {};
  if (details.boatName.trim() === "") errors.boatName = "required";
  for (const key of ["loa", "beam", "draft"] as const) {
    if (parseMetres(details[key]) === "invalid") errors[key] = "number";
  }
  return errors;
}
