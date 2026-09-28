// The single source of truth for the pre-arrival check-in: one Zod schema per
// section, plus the combined draft. Inferred types are used everywhere else
// (the wizard steps, the mock store, the staff side later) instead of
// hand-written duplicates, so the shape only exists in one place.
//
// These schemas catch structural and hard-rule errors (see the "Errors" list
// in the brief). Softer, non-blocking guidance (passport expiring soon, the
// 90/180 day rule, and so on) is deliberately NOT here, so it can never block
// submission; see lib/prearrival/warnings.ts for that.

import { z } from "zod";
import { isEU, isSchengen } from "./countries";

export const PROPULSION = ["sail", "power", "sail_and_power"] as const;
export type Propulsion = (typeof PROPULSION)[number];

// Reuses the site's existing vessel-use selector (VesselUseFields.tsx)
// instead of a new enum, so the wizard and the enquiry form mean the same
// thing by "vessel use".
export const VESSEL_USES = ["private", "bareboat", "crewed", "commercial"] as const;
export type VesselUseValue = (typeof VESSEL_USES)[number];

export const PERSON_ROLES = ["skipper", "crew", "guest"] as const;
export type PersonRole = (typeof PERSON_ROLES)[number];

export const ID_TYPES = ["passport", "national_id"] as const;
export type IdType = (typeof ID_TYPES)[number];

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the date picker, or type YYYY-MM-DD.");
const isoDateTime = z
  .string()
  .min(1, "Choose a date and time.");
const optionalIsoDate = z.union([isoDate, z.literal("")]);

// ---------------------------------------------------------------------------
// Owner
// ---------------------------------------------------------------------------

export const ownerSchema = z
  .object({
    fullName: z.string().min(1, "Enter the owner's full name."),
    idDocumentNumber: z.string().min(1, "Enter an ID or passport number."),
    // NIF: required for a boat owner resident in Portugal, optional otherwise.
    taxNumber: z.string(),
    countryOfResidence: z.string().min(1, "Choose a country of residence."),
    address: z.string(),
    isCompany: z.boolean(),
    companyTaxId: z.string(),
    email: z.string().email("Enter a valid email address."),
    phone: z.string().min(3, "Enter a phone number."),
  })
  .superRefine((owner, ctx) => {
    if (owner.countryOfResidence !== "Portugal" && !owner.address.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["address"],
        message: "Enter an address, required for an owner resident outside Portugal.",
      });
    }
    if (owner.isCompany && !owner.companyTaxId.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["companyTaxId"],
        message: "Enter the company's tax number (NIPC).",
      });
    }
  });
export type Owner = z.infer<typeof ownerSchema>;

export const EMPTY_OWNER: Owner = {
  fullName: "",
  idDocumentNumber: "",
  taxNumber: "",
  countryOfResidence: "",
  address: "",
  isCompany: false,
  companyTaxId: "",
  email: "",
  phone: "",
};

// ---------------------------------------------------------------------------
// Boat identity and specs
// ---------------------------------------------------------------------------

export const boatIdentitySchema = z.object({
  name: z.string().min(1, "Enter the boat's name."),
  registrationNumber: z.string().min(1, "Enter the registration number."),
  flagCountry: z.string().min(1, "Choose the flag country."),
  portOfRegistry: z.string().min(1, "Enter the port of registry."),
  navigationZoneType: z.union([
    z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5),
  ]).nullable(),
  // Auto-built for a Portuguese boat; see buildPtIdentificationSet.
  ptIdentificationSet: z.string(),
});
export type BoatIdentity = z.infer<typeof boatIdentitySchema>;

export const EMPTY_BOAT_IDENTITY: BoatIdentity = {
  name: "",
  registrationNumber: "",
  flagCountry: "",
  portOfRegistry: "",
  navigationZoneType: null,
  ptIdentificationSet: "",
};

export const boatSpecsSchema = z.object({
  lengthOverall: z.string().refine((v) => Number(v) > 0, "Enter the length overall."),
  beam: z.string().refine((v) => Number(v) > 0, "Enter the beam."),
  draught: z.string().refine((v) => Number(v) > 0, "Enter the draught."),
  propulsion: z.enum(PROPULSION),
  isMultihull: z.boolean(),
  model: z.string(),
  hullNumber: z.string(),
  buildYear: z.string(),
  hullColour: z.string(),
  hullMaterial: z.string(),
  engineMake: z.string(),
  engineModel: z.string(),
  enginePowerKw: z.string(),
});
export type BoatSpecs = z.infer<typeof boatSpecsSchema>;

export const EMPTY_BOAT_SPECS: BoatSpecs = {
  lengthOverall: "",
  beam: "",
  draught: "",
  propulsion: "sail",
  isMultihull: false,
  model: "",
  hullNumber: "",
  buildYear: "",
  hullColour: "",
  hullMaterial: "",
  engineMake: "",
  engineModel: "",
  enginePowerKw: "",
};

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

const documentEntrySchema = z.object({
  number: z.string(),
  issuingAuthority: z.string(),
  expiryDate: optionalIsoDate,
  fileName: z.string(),
  uploaded: z.boolean(),
});
export type DocumentEntry = z.infer<typeof documentEntrySchema>;

export const EMPTY_DOCUMENT_ENTRY: DocumentEntry = {
  number: "",
  issuingAuthority: "",
  expiryDate: "",
  fileName: "",
  uploaded: false,
};

export const documentsSchema = z.object({
  registration: documentEntrySchema,
  thirdPartyInsurance: documentEntrySchema.extend({ insurer: z.string() }),
  skipperLicence: documentEntrySchema,
  iucProof: documentEntrySchema,
  radioStationLicence: documentEntrySchema,
  surveyCertificate: documentEntrySchema,
  temporaryAdmissionEvidence: documentEntrySchema,
});
export type Documents = z.infer<typeof documentsSchema>;

// A function, not a constant: every call returns fresh objects, so two boats
// (or a boat and the schema's own default) never share the same document
// entry by reference.
export function emptyDocuments(): Documents {
  return {
    registration: { ...EMPTY_DOCUMENT_ENTRY },
    thirdPartyInsurance: { ...EMPTY_DOCUMENT_ENTRY, insurer: "" },
    skipperLicence: { ...EMPTY_DOCUMENT_ENTRY },
    iucProof: { ...EMPTY_DOCUMENT_ENTRY },
    radioStationLicence: { ...EMPTY_DOCUMENT_ENTRY },
    surveyCertificate: { ...EMPTY_DOCUMENT_ENTRY },
    temporaryAdmissionEvidence: { ...EMPTY_DOCUMENT_ENTRY },
  };
}

export type DocumentKey = keyof Documents;

// ---------------------------------------------------------------------------
// Voyage
// ---------------------------------------------------------------------------

export const voyageSchema = z
  .object({
    lastPortName: z.string().min(1, "Enter the last port."),
    lastPortCountry: z.string().min(1, "Choose the last port's country."),
    nextPortName: z.string().min(1, "Enter the next port."),
    nextPortCountry: z.string().min(1, "Choose the next port's country."),
    arrivalDateTime: isoDateTime,
    departureDateTime: z.string(),
  })
  .refine(
    (v) =>
      !v.departureDateTime ||
      !v.arrivalDateTime ||
      v.departureDateTime > v.arrivalDateTime,
    { message: "Departure must be after arrival.", path: ["departureDateTime"] }
  );
export type Voyage = z.infer<typeof voyageSchema>;

export const EMPTY_VOYAGE: Voyage = {
  lastPortName: "",
  lastPortCountry: "",
  nextPortName: "",
  nextPortCountry: "",
  arrivalDateTime: "",
  departureDateTime: "",
};

export type VoyageFlags = {
  arrivingFromOutsideSchengen: boolean;
  leavingToOutsideSchengen: boolean;
  crossesExternalBorder: boolean;
  fromOrToNonEU: boolean;
};

export function getVoyageFlags(voyage: Voyage): VoyageFlags {
  const fromOutsideSchengen =
    !!voyage.lastPortCountry && !isSchengen(voyage.lastPortCountry);
  const toOutsideSchengen =
    !!voyage.nextPortCountry && !isSchengen(voyage.nextPortCountry);
  return {
    arrivingFromOutsideSchengen: fromOutsideSchengen,
    leavingToOutsideSchengen: toOutsideSchengen,
    crossesExternalBorder: fromOutsideSchengen || toOutsideSchengen,
    fromOrToNonEU:
      (!!voyage.lastPortCountry && !isEU(voyage.lastPortCountry)) ||
      (!!voyage.nextPortCountry && !isEU(voyage.nextPortCountry)),
  };
}

// ---------------------------------------------------------------------------
// People on board
// ---------------------------------------------------------------------------

export const personSchema = z.object({
  role: z.enum(PERSON_ROLES),
  familyName: z.string().min(1, "Enter a family name."),
  givenNames: z.string().min(1, "Enter given names."),
  nationality: z.string().min(1, "Choose a nationality."),
  dateOfBirth: isoDate,
  placeOfBirth: z.string(),
  gender: z.string(),
  idType: z.enum(ID_TYPES),
  idNumber: z.string().min(1, "Enter an ID number."),
  idIssuingState: z.string(),
  idExpiryDate: isoDate,
  idIssueDate: optionalIsoDate,
  embarkationDate: z.string(),
  guardianPersonIndex: z.number().nullable(),
});
export type Person = z.infer<typeof personSchema>;

export const EMPTY_PERSON: Person = {
  role: "crew",
  familyName: "",
  givenNames: "",
  nationality: "",
  dateOfBirth: "",
  placeOfBirth: "",
  gender: "",
  idType: "passport",
  idNumber: "",
  idIssuingState: "",
  idExpiryDate: "",
  idIssueDate: "",
  embarkationDate: "",
  guardianPersonIndex: null,
};

export function isMinor(person: Person, onDate: string): boolean {
  if (!person.dateOfBirth || !onDate) return false;
  const birth = new Date(person.dateOfBirth);
  const at = new Date(onDate);
  if (Number.isNaN(birth.getTime()) || Number.isNaN(at.getTime())) return false;
  let age = at.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    at.getMonth() < birth.getMonth() ||
    (at.getMonth() === birth.getMonth() && at.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return age < 18;
}

export const peopleSchema = z
  .array(personSchema)
  .min(1, "Add at least one person on board.")
  .max(12, "This form covers up to 12 people; contact the marina for a larger group.")
  .refine(
    (people) => people.filter((p) => p.role === "skipper").length === 1,
    { message: "Exactly one person must be the skipper." }
  );

// ---------------------------------------------------------------------------
// Stay
// ---------------------------------------------------------------------------

export const servicesWantedSchema = z.object({
  electricityAmps: z.union([z.literal(0), z.literal(16), z.literal(32), z.literal(63)]),
  water: z.boolean(),
  pumpOut: z.boolean(),
  fuelDockSlot: z.boolean(),
  crane: z.boolean(),
});
export type ServicesWanted = z.infer<typeof servicesWantedSchema>;

export const EMPTY_SERVICES_WANTED: ServicesWanted = {
  electricityAmps: 0,
  water: false,
  pumpOut: false,
  fuelDockSlot: false,
  crane: false,
};

export const staySchema = z.object({
  requestedArrival: isoDate,
  requestedDeparture: isoDate,
  specialRequests: z.string(),
  servicesWanted: servicesWantedSchema,
  depositAcknowledged: z.boolean(),
});
export type Stay = z.infer<typeof staySchema>;

export const EMPTY_STAY: Stay = {
  requestedArrival: "",
  requestedDeparture: "",
  specialRequests: "",
  servicesWanted: { ...EMPTY_SERVICES_WANTED },
  depositAcknowledged: false,
};

// ---------------------------------------------------------------------------
// Consents
// ---------------------------------------------------------------------------

export const consentsSchema = z.object({
  gdprConsent: z
    .boolean()
    .refine((v) => v, "Confirm you understand how your data is used."),
  termsAccepted: z
    .boolean()
    .refine((v) => v, "Accept the marina regulation to continue."),
  declarationTrue: z
    .boolean()
    .refine((v) => v, "Confirm the declaration is true."),
});
export type Consents = z.infer<typeof consentsSchema>;

export const EMPTY_CONSENTS: Consents = {
  gdprConsent: false,
  termsAccepted: false,
  declarationTrue: false,
};

// ---------------------------------------------------------------------------
// The whole draft
// ---------------------------------------------------------------------------

export type PreArrivalDraft = {
  boatId: string | null;
  owner: Owner;
  boatIdentity: BoatIdentity;
  boatSpecs: BoatSpecs;
  vesselUse: VesselUseValue;
  documents: Documents;
  voyage: Voyage;
  people: Person[];
  fullCrewListMode: boolean;
  stay: Stay;
  consents: Consents;
};

export function emptyDraft(): PreArrivalDraft {
  return {
    boatId: null,
    owner: { ...EMPTY_OWNER },
    boatIdentity: { ...EMPTY_BOAT_IDENTITY },
    boatSpecs: { ...EMPTY_BOAT_SPECS },
    vesselUse: "private",
    documents: emptyDocuments(),
    voyage: { ...EMPTY_VOYAGE },
    people: [{ ...EMPTY_PERSON, role: "skipper" }],
    fullCrewListMode: false,
    stay: { ...EMPTY_STAY, servicesWanted: { ...EMPTY_SERVICES_WANTED } },
    consents: { ...EMPTY_CONSENTS },
  };
}

export const draftSchema = z.object({
  owner: ownerSchema,
  boatIdentity: boatIdentitySchema,
  boatSpecs: boatSpecsSchema,
  vesselUse: z.enum(VESSEL_USES),
  voyage: voyageSchema,
  people: peopleSchema,
  stay: staySchema,
  consents: consentsSchema,
});

export type FieldErrors = Record<string, string>;

// Flattens a ZodError into "section.field" -> message, matching how the step
// components address their own fields, so each step can show only its own
// errors without re-deriving anything from the ZodError shape itself.
export function flattenIssues(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}
