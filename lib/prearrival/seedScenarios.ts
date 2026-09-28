// Eight edge-case scenarios for quickly testing the pre-arrival wizard and
// the marina-mediated reletting flow, without retyping a form by hand each
// time. Loaded from the hidden /dev/prearrival-scenarios page only; nothing
// here is linked from the site's normal navigation.

import {
  advanceRelettingStatus,
  decideReletting,
  getRelettingRequests,
  requestEarlyReturn,
  submitRelettingRequest,
  type RelettingRequest,
} from "../mockData";

function freshRequest(id: string): RelettingRequest | null {
  return getRelettingRequests("u-owner").find((r) => r.id === id) ?? null;
}
import { emptyDraft, type PreArrivalDraft, type Person } from "./schema";

function person(overrides: Partial<Person>): Person {
  return {
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
    idExpiryDate: "2030-01-01",
    idIssueDate: "2022-01-01",
    embarkationDate: "",
    guardianPersonIndex: null,
    ...overrides,
  };
}

function baseDraft(overrides: Partial<PreArrivalDraft>): PreArrivalDraft {
  const draft = emptyDraft();
  return {
    ...draft,
    owner: {
      ...draft.owner,
      fullName: "Skipper Example",
      idDocumentNumber: "P1234567",
      countryOfResidence: "Portugal",
      email: "skipper@example.com",
      phone: "+351910000000",
    },
    boatIdentity: {
      ...draft.boatIdentity,
      name: "Test Boat",
      registrationNumber: "REG-0001",
      flagCountry: "Portugal",
      portOfRegistry: "Cascais",
    },
    boatSpecs: { ...draft.boatSpecs, lengthOverall: "10", beam: "3.5", draught: "1.6" },
    voyage: {
      ...draft.voyage,
      lastPortName: "Lagos",
      lastPortCountry: "Portugal",
      nextPortName: "Cascais",
      nextPortCountry: "Portugal",
      arrivalDateTime: "2027-06-15T10:00",
      departureDateTime: "2027-06-20T10:00",
    },
    stay: { ...draft.stay, requestedArrival: "2027-06-15", requestedDeparture: "2027-06-20" },
    ...overrides,
  };
}

// 1. A solo sailor.
export function scenarioSoloSailor(): PreArrivalDraft {
  return baseDraft({
    people: [
      person({
        role: "skipper",
        familyName: "Alves",
        givenNames: "Rui",
        nationality: "Portugal",
        dateOfBirth: "1980-03-12",
      }),
    ],
  });
}

// 2. Twelve people, the wizard's own maximum.
export function scenarioTwelvePeople(): PreArrivalDraft {
  const people = Array.from({ length: 12 }, (_, i) =>
    person({
      role: i === 0 ? "skipper" : "crew",
      familyName: "Costa",
      givenNames: `Crew ${i + 1}`,
      nationality: "Portugal",
      dateOfBirth: "1990-01-01",
    })
  );
  return baseDraft({ people });
}

// 3. A minor on board, travelling with a guardian.
export function scenarioMinorOnBoard(): PreArrivalDraft {
  return baseDraft({
    people: [
      person({
        role: "skipper",
        familyName: "Santos",
        givenNames: "Marta",
        nationality: "Portugal",
        dateOfBirth: "1985-05-20",
      }),
      person({
        role: "guest",
        familyName: "Santos",
        givenNames: "Leo",
        nationality: "Portugal",
        dateOfBirth: "2016-08-01",
        guardianPersonIndex: 0,
      }),
    ],
  });
}

// 4. A non-EU flagged boat with an all-EU crew (Temporary Admission applies).
export function scenarioNonEUBoatEUCrew(): PreArrivalDraft {
  return baseDraft({
    boatIdentity: {
      ...emptyDraft().boatIdentity,
      name: "Liberty",
      registrationNumber: "US-4451",
      flagCountry: "United States",
      portOfRegistry: "Newport",
    },
    owner: {
      ...emptyDraft().owner,
      fullName: "James Carter",
      idDocumentNumber: "US998877",
      countryOfResidence: "France",
      email: "james@example.com",
      phone: "+33612345678",
    },
    people: [
      person({
        role: "skipper",
        familyName: "Carter",
        givenNames: "James",
        nationality: "France",
        dateOfBirth: "1975-11-02",
      }),
      person({
        role: "crew",
        familyName: "Dubois",
        givenNames: "Claire",
        nationality: "France",
        dateOfBirth: "1982-04-14",
      }),
    ],
  });
}

// 5. An EU boat arriving from Gibraltar (outside Schengen) with a UK skipper
// (Schengen-relevant, but the UK is neither EU nor Schengen).
export function scenarioGibraltarUKSkipper(): PreArrivalDraft {
  return baseDraft({
    boatIdentity: {
      ...emptyDraft().boatIdentity,
      name: "Windward",
      registrationNumber: "PT-7711",
      flagCountry: "Portugal",
      portOfRegistry: "Cascais",
    },
    voyage: {
      lastPortName: "Gibraltar",
      lastPortCountry: "United Kingdom",
      nextPortName: "Cascais",
      nextPortCountry: "Portugal",
      arrivalDateTime: "2027-06-15T10:00",
      departureDateTime: "2027-06-20T10:00",
    },
    people: [
      person({
        role: "skipper",
        familyName: "Hughes",
        givenNames: "Oliver",
        nationality: "United Kingdom",
        dateOfBirth: "1978-09-09",
      }),
    ],
  });
}

// 6. A multihull whose stay crosses the low/high season boundary (1 April).
export function scenarioMultihullSeasonBoundary(): PreArrivalDraft {
  return baseDraft({
    boatSpecs: {
      ...emptyDraft().boatSpecs,
      lengthOverall: "11",
      beam: "6",
      draught: "1.2",
      propulsion: "sail",
      isMultihull: true,
    },
    voyage: {
      lastPortName: "Faro",
      lastPortCountry: "Portugal",
      nextPortName: "Cascais",
      nextPortCountry: "Portugal",
      arrivalDateTime: "2027-03-28T10:00",
      departureDateTime: "2027-04-05T10:00",
    },
    stay: {
      ...emptyDraft().stay,
      requestedArrival: "2027-03-28",
      requestedDeparture: "2027-04-05",
    },
    people: [
      person({
        role: "skipper",
        familyName: "Ferreira",
        givenNames: "Tiago",
        nationality: "Portugal",
        dateOfBirth: "1988-02-02",
      }),
    ],
  });
}

export const DRAFT_SCENARIOS = [
  { key: "solo-sailor", label: "1. Solo sailor", build: scenarioSoloSailor },
  { key: "twelve-people", label: "2. Twelve people", build: scenarioTwelvePeople },
  { key: "minor-on-board", label: "3. Minor on board", build: scenarioMinorOnBoard },
  { key: "non-eu-boat-eu-crew", label: "4. Non-EU flagged boat, EU crew", build: scenarioNonEUBoatEUCrew },
  { key: "gibraltar-uk-skipper", label: "5. EU boat from Gibraltar, UK skipper", build: scenarioGibraltarUKSkipper },
  { key: "multihull-season", label: "6. Multihull crossing the season boundary", build: scenarioMultihullSeasonBoundary },
] as const;

// 7. A holder away for three weeks in August, relet for 10 nights.
export function seedHolderAwayReletTenNights(): RelettingRequest | null {
  const submitted = submitRelettingRequest("u-owner", {
    berthId: "G-14",
    startDate: "2027-08-01",
    endDate: "2027-08-22",
    boatRemovalConfirmed: true,
    reletConsent: true,
    outsideArrangementConfirmed: true,
    termsAccepted: true,
    readinessConfirmed: true,
  });
  if (!submitted.ok) return null;
  const id = submitted.request.id;
  if (!decideReletting("u-staff", id, "approve", "Seed scenario").ok) return null;
  if (!advanceRelettingStatus("u-staff", id).ok) return null; // approved -> listed
  if (!advanceRelettingStatus("u-staff", id, { nightsBooked: 10 }).ok) return null; // listed -> booked
  return freshRequest(id);
}

// 8. A holder who returns early while their berth is currently let.
export function seedHolderReturnsEarlyWhileLet(): RelettingRequest | null {
  const submitted = submitRelettingRequest("u-owner", {
    berthId: "G-14",
    startDate: "2027-09-01",
    endDate: "2027-09-21",
    boatRemovalConfirmed: true,
    reletConsent: true,
    outsideArrangementConfirmed: true,
    termsAccepted: true,
    readinessConfirmed: true,
  });
  if (!submitted.ok) return null;
  const id = submitted.request.id;
  if (!decideReletting("u-staff", id, "approve", "Seed scenario").ok) return null;
  if (!advanceRelettingStatus("u-staff", id).ok) return null; // approved -> listed
  if (!advanceRelettingStatus("u-staff", id, { nightsBooked: 12 }).ok) return null; // listed -> booked
  const early = requestEarlyReturn("u-owner", id);
  return early.ok ? early.request : null;
}
