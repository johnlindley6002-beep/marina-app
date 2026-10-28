import type { FacilityKey } from "@/data/marinas";
import type { enquiry } from "./locales/en/enquiry";
import type { account } from "./locales/en/account";
import type { accounts } from "./locales/en/accounts";
import type { myBoat } from "./locales/en/myBoat";
import type { chrome } from "./locales/en/chrome";
import type { marinaPage } from "./locales/en/marinaPage";
import type { stay } from "./locales/en/stay";

export type Locale = "en" | "pt" | "es" | "fr";

export const LOCALES: Locale[] = ["en", "pt", "es", "fr"];

export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  pt: "Português",
  es: "Español",
  fr: "Français",
};

// Locales that have full marina prose / facility text (see marinaContent
// and data/marinas.ts). Others fall back to English for that content.
export function contentLocale(locale: Locale): "en" | "pt" {
  return locale === "pt" ? "pt" : "en";
}

export type Dictionary = {
  nav: {
    home: string;
    marinas: string;
    aboutUs: string;
    contact: string;
    search: string;
    openMenu: string;
    closeMenu: string;
    myBoat: string;
  };
  footer: {
    tagline: string;
    company: string;
    product: string;
    contact: string;
    aboutUs: string;
    marinas: string;
    copyright: (year: number) => string;
  };
  home: {
    tagline: string;
    valueProp: string;
    browseMarinas: string;
    aboutHeading: string;
    aboutBody: string;
    contactHeading: string;
    contactBody: string;
    destinationLabel: string;
    destinationPlaceholder: string;
    addFilters: string;
    hideFilters: string;
    findMarinas: string;
    featuredHeading: string;
    moreMarinas: string;
  };
  results: {
    heading: string;
    forQuery: (query: string) => string;
    count: (n: number) => string;
    none: string;
    from: string;
  };
  homeSearch: {
    arrival: string;
    departure: string;
    boatLength: string;
    searchButton: string;
  };
  countryPage: {
    heading: (country: string) => string;
    viewMarina: string;
  };
  breadcrumbs: {
    marinas: string;
  };
  berthSearch: {
    heading: string;
    subheading: (marinaName: string) => string;
    illustrative: string;
    arrival: string;
    departure: string;
    boatLength: string;
    lengthPlaceholder: string;
    searchButton: string;
    errorLength: string;
    errorDates: string;
    errorDeparture: string;
    noClass: (cls: string) => string;
    noAvailable: string;
    noFit: string;
    seasonBoth: (low: number, high: number) => string;
    seasonHigh: string;
    seasonLow: string;
    legendAvailable: string;
    legendOccupied: string;
    legendUnfit: string;
    legendNeutral: string;
    hintBeforeSearch: string;
    priceBerthLine: (id: string, cls: string, nights: number) => string;
    vatNote: (rate: number) => string;
    ctaHeading: (marinaName: string) => string;
    ctaButton: string;
    mailSubject: string;
    mailGreeting: string;
    mailIntro: string;
    mailArrival: string;
    mailDeparture: string;
    mailBoatLength: string;
    mailBerth: string;
    mailSignoff: string;
  };
  rates: {
    heading: string;
    colClass: string;
    colLength: string;
    colLow: string;
    colHigh: string;
    caption: (vat: number) => string;
    upTo: (max: number) => string;
  };
  contact: {
    heading: string;
    phone: string;
    email: string;
  };
  visiting: {
    heading: string;
    hailing: string;
    vhfChannel: (n: number) => string;
    officeHours: string;
    summer: string;
    winter: string;
    onArrival: string;
    byCar: string;
    byTrain: string;
    byAir: string;
    maxLength: string;
    maxDraft: string;
  };
  keyFacts: {
    heading: string;
    berths: string;
    maxLength: string;
    maxDraft: string;
    coordinates: string;
    address: string;
  };
  facilities: { heading: string } & Record<FacilityKey, string>;
  language: { label: string };
  units: { label: string; metric: string; imperial: string };
  dock: {
    open: string;
    close: string;
    heading: string;
    call: string;
    vhf: string;
    email: string;
    message: string;
  };
  favourites: { save: string; saved: string; savedHeading: string };
  preArrival: {
    cta: {
      arrivalActions: string;
      myBoat: string;
    };
    privacyNote: string;
    upcoming: {
      heading: string;
      newBoat: string;
      datesNotSet: string;
      draftLabel: string;
      referenceLabel: (code: string) => string;
      reviewBtn: string;
      continueBtn: string;
      nothingOutstanding: string;
      idExpiring: (name: string, days: number) => string;
      insuranceExpiring: (days: number) => string;
    };
    page: {
      title: string;
      subtitle: string;
      autosaveNote: string;
      resumeBanner: string;
      startOver: string;
      back: string;
      continueBtn: string;
      stepOf: (step: number, total: number) => string;
      nightsCount: (n: number) => string;
      peopleOnBoard: (n: number) => string;
    };
    steps: {
      boat: string;
      voyage: string;
      crew: string;
      documents: string;
      stay: string;
      review: string;
    };
    boat: {
      heading: string;
      chooseSaved: string;
      chooseSavedPlaceholder: string;
      orNewBoat: string;
      nameLabel: string;
      registrationLabel: string;
      flagLabel: string;
      callSignLabel: string;
      portOfRegistryLabel: string;
      zoneLabel: string;
      specificationsHeading: string;
      lengthLabel: string;
      beamLabel: string;
      draughtLabel: string;
      propulsionLabel: string;
      propulsionSail: string;
      propulsionPower: string;
      propulsionBoth: string;
      multihullLabel: string;
      classLabel: (cls: string) => string;
      indicativeNightly: (amount: string) => string;
      vesselUseLabel: string;
      ownerHeading: string;
      ownerNameLabel: string;
      ownerIdLabel: string;
      ownerTaxNumberLabel: string;
      ownerResidenceLabel: string;
      ownerAddressLabel: string;
      ownerIsCompanyLabel: string;
      ownerCompanyTaxIdLabel: string;
      ownerEmailLabel: string;
      ownerPhoneLabel: string;
    };
    voyage: {
      heading: string;
      lastPortLabel: string;
      lastPortCountryLabel: string;
      nextPortLabel: string;
      nextPortCountryLabel: string;
      arrivalLabel: string;
      departureLabel: string;
      infoOutsideSchengenTitle: string;
      infoOutsideSchengenBody: string;
      infoNonEUFlagTitle: string;
      infoNonEUFlagBody: string;
      infoNonEUFlagResidentWarning: string;
      infoNonEUMovementTitle: string;
      infoNonEUMovementBody: string;
    };
    crew: {
      heading: string;
      howManyLabel: string;
      allFreeMovementToggle: string;
      reuseLastCrewToggle: string;
      frequentCrewLabel: string;
      sameSurnameToggle: string;
      sameNationalityToggle: string;
      personTitle: (n: number) => string;
      skipperDefaultNote: string;
      statusComplete: string;
      statusMissing: string;
      statusCheckDates: string;
      scanPassport: string;
      scanComingSoon: string;
      fullCrewListChip: string;
      roleLabel: string;
      roleSkipper: string;
      roleCrew: string;
      roleGuest: string;
      familyNameLabel: string;
      givenNamesLabel: string;
      nationalityLabel: string;
      dateOfBirthLabel: string;
      placeOfBirthLabel: string;
      genderLabel: string;
      idTypeLabel: string;
      idTypePassport: string;
      idTypeNationalId: string;
      idNumberLabel: string;
      idIssuingStateLabel: string;
      idExpiryLabel: string;
      idIssueDateLabel: string;
      embarkationDateLabel: string;
      guardianLabel: string;
      guardianPlaceholder: string;
      removePerson: string;
    };
    documents: {
      heading: string;
      intro: string;
      requiredChip: string;
      optionalChip: string;
      useSaved: string;
      uploadTile: string;
      numberLabel: string;
      expiryLabel: string;
      issuingAuthorityLabel: string;
      insurerLabel: string;
      items: {
        registration: string;
        thirdPartyInsurance: string;
        skipperLicence: string;
        iucProof: string;
        radioStationLicence: string;
        surveyCertificate: string;
        temporaryAdmissionEvidence: string;
      };
    };
    stay: {
      heading: string;
      arrivalLabel: string;
      departureLabel: string;
      servicesHeading: string;
      electricityLabel: string;
      waterLabel: string;
      pumpOutLabel: string;
      fuelDockSlotLabel: string;
      craneLabel: string;
      specialRequestsLabel: string;
      depositNote: string;
      billingNote: string;
      priceHeading: string;
      indicativeNote: string;
      askMarina: string;
      seasonLow: string;
      seasonHigh: string;
      lineLabel: (nights: number, season: string, rate: string) => string;
      multihullNote: string;
      subtotalLine: (subtotal: string, vat: string) => string;
    };
    review: {
      heading: string;
      edit: string;
      peopleCount: (n: number) => string;
      documentMissing: string;
      documentNotProvided: string;
      consentsHeading: string;
      gdprLabel: string;
      termsLabel: string;
      declarationLabel: string;
      submit: string;
    };
    confirmation: {
      heading: string;
      referenceLabel: string;
      whatNextHeading: string;
      whatNextBody: string;
      bringHeading: string;
      backToMarina: string;
      saveOfferHeading: string;
      saveOfferBody: string;
      saveOfferBtn: string;
      savedNote: string;
    };
    generatedDocs: {
      declarationBtn: string;
      crewListBtn: string;
      preparing: string;
      authorityNote: string;
      authorityJsonBtn: string;
      authorityCsvBtn: string;
    };
  };
  stay: typeof stay;
  marinaPage: typeof marinaPage;
  chrome: typeof chrome;
  myBoat: typeof myBoat;
  account: typeof account;
  enquiry: typeof enquiry;
  accounts: typeof accounts;
};
