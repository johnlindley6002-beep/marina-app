import {
  emptyDocuments,
  emptyDraft,
  type Person,
  type PreArrivalDraft,
} from "@/features/prearrival/lib/schema";

// A small crew member who is complete and unremarkable: an EU national with a
// passport that is valid for years. Tests change only the field they are about.
export function person(overrides: Partial<Person> = {}): Person {
  return {
    role: "crew",
    familyName: "Silva",
    givenNames: "Rita",
    nationality: "Portugal",
    dateOfBirth: "1985-04-12",
    placeOfBirth: "Lisbon",
    gender: "F",
    idType: "passport",
    idNumber: "PT1234567",
    idIssuingState: "Portugal",
    idExpiryDate: "2032-01-01",
    idIssueDate: "2022-01-01",
    embarkationDate: "2026-07-10",
    guardianPersonIndex: null,
    ...overrides,
  };
}

// A complete, valid draft for a Portuguese-flagged 9.5 m sailboat arriving from
// Lisbon on 10 July 2026 and leaving on 20 July 2026. Nothing in it should raise
// an error or a warning.
export function validDraft(overrides: Partial<PreArrivalDraft> = {}): PreArrivalDraft {
  const base = emptyDraft();
  const documents = emptyDocuments();
  documents.registration.number = "LIV-4411";
  documents.thirdPartyInsurance.number = "POL-9912";
  documents.thirdPartyInsurance.expiryDate = "2027-01-01";
  documents.skipperLicence.number = "CN-3321";
  documents.iucProof.number = "IUC-2026";
  return {
    ...base,
    owner: {
      fullName: "Rita Silva",
      idDocumentNumber: "PT1234567",
      taxNumber: "123456789",
      countryOfResidence: "Portugal",
      address: "",
      isCompany: false,
      companyTaxId: "",
      email: "rita@example.com",
      phone: "+351912345678",
    },
    boatIdentity: {
      name: "Mar Azul",
      registrationNumber: "LIV-4411",
      flagCountry: "Portugal",
      portOfRegistry: "Lisbon",
      navigationZoneType: 3,
      ptIdentificationSet: "MARAZUL-123456-APT",
      callSign: "",
    },
    boatSpecs: { ...base.boatSpecs, lengthOverall: "9.5", beam: "3.5", draught: "1.6" },
    documents,
    voyage: {
      lastPortName: "Lisbon",
      lastPortCountry: "Portugal",
      nextPortName: "Sines",
      nextPortCountry: "Portugal",
      arrivalDateTime: "2026-07-10T10:00",
      departureDateTime: "2026-07-20T10:00",
    },
    people: [person({ role: "skipper" })],
    stay: {
      ...base.stay,
      requestedArrival: "2026-07-10",
      requestedDeparture: "2026-07-20",
      depositAcknowledged: true,
    },
    consents: { gdprConsent: true, termsAccepted: true, declarationTrue: true },
    ...overrides,
  };
}
