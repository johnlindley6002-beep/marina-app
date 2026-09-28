import type { FacilityKey } from "../data/marinas";

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

type Dictionary = {
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
    eyebrow: string;
    heading: string;
    colClass: string;
    colLength: string;
    colLow: string;
    colHigh: string;
    caption: (vat: number) => string;
    upTo: (max: number) => string;
  };
  about: {
    eyebrow: string;
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
    };
  };
};

const baseTranslations: Record<"en" | "pt", Dictionary> = {
  en: {
    nav: {
      home: "Home",
      marinas: "Marinas",
      aboutUs: "About us",
      contact: "Contact",
      search: "Search",
      openMenu: "Open menu",
      closeMenu: "Close menu",
      myBoat: "My boat",
    },
    footer: {
      tagline: "Marina bookings, simplified.",
      company: "Company",
      product: "Product",
      contact: "Contact",
      aboutUs: "About us",
      marinas: "Marinas",
      copyright: (year) => `© ${year} aldock. All rights reserved.`,
    },
    home: {
      tagline: "Marina bookings, simplified.",
      valueProp: "Find and book a berth in Portugal's marinas.",
      browseMarinas: "Or browse marinas",
      aboutHeading: "A marina experience, reimagined",
      aboutBody:
        "aldock brings clarity to marina management, from berth reservations to guest communications. We believe booking a slip should feel as calm as a morning on the water.",
      contactHeading: "Get in touch",
      contactBody:
        "Questions about berths, bookings, or partnerships? We'd love to hear from you.",
      destinationLabel: "Where are you heading?",
      destinationPlaceholder: "Marina, region or country",
      addFilters: "Add dates and boat length",
      hideFilters: "Hide dates and boat length",
      findMarinas: "Find marinas",
      featuredHeading: "Featured marina",
      moreMarinas: "More marinas",
    },
    results: {
      heading: "Marinas",
      forQuery: (query) => `Marinas for “${query}”`,
      count: (n) => `${n} ${n === 1 ? "marina" : "marinas"}`,
      none: "No marinas match that search. Try a marina, region or country.",
      from: "from",
    },
    homeSearch: {
      arrival: "Arrival",
      departure: "Departure",
      boatLength: "Boat length (m)",
      searchButton: "Search berths",
    },
    countryPage: {
      heading: (country) => `Marinas in ${country}`,
      viewMarina: "View marina →",
    },
    breadcrumbs: {
      marinas: "Marinas",
    },
    berthSearch: {
      heading: "Available berths",
      subheading: (marinaName) =>
        `Check simulated availability at ${marinaName}.`,
      illustrative: "Berth availability shown is illustrative for now.",
      arrival: "Arrival",
      departure: "Departure",
      boatLength: "Boat length (m)",
      lengthPlaceholder: "e.g. 7",
      searchButton: "Search",
      errorLength: "Enter your boat's length in metres.",
      errorDates: "Choose an arrival and departure date.",
      errorDeparture: "Departure must be after arrival.",
      noClass: (cls) =>
        `No Class ${cls} berths modeled yet in this schematic. Larger vessel classes are coming in a future pass.`,
      noAvailable: "No available berths match your dates. Try different dates.",
      noFit:
        "No berth class fits a vessel this length in our current tariff (max 45 m). Please contact the marina directly.",
      seasonBoth: (low, high) =>
        `Your stay spans both seasons: ${low} night${low === 1 ? "" : "s"} low season, ${high} night${high === 1 ? "" : "s"} high season.`,
      seasonHigh: "Your dates fall in high season (Apr–Sep).",
      seasonLow: "Your dates fall in low season (Jan–Mar & Oct–Dec).",
      legendAvailable: "Available & fits",
      legendOccupied: "Occupied",
      legendUnfit: "Doesn't fit your boat",
      legendNeutral: "Not searched yet",
      hintBeforeSearch:
        "Enter your dates and boat length, then search to see berth availability.",
      priceBerthLine: (id, cls, nights) =>
        `Berth ${id} · Class ${cls} · ${nights} night${nights === 1 ? "" : "s"}`,
      vatNote: (rate) =>
        `+ ${rate}% VAT and utilities. Estimate, confirm with marina.`,
      ctaHeading: (marinaName) => `Questions about a berth at ${marinaName}?`,
      ctaButton: "Contact marina",
      mailSubject: "Berth request - Marina de Cascais",
      mailGreeting: "Hello,",
      mailIntro:
        "I'd like to enquire about berth availability at Marina de Cascais.",
      mailArrival: "Arrival",
      mailDeparture: "Departure",
      mailBoatLength: "Boat length",
      mailBerth: "Berth of interest",
      mailSignoff: "Thanks,",
    },
    rates: {
      eyebrow: "Rates",
      heading: "Transient berth rates",
      colClass: "Class",
      colLength: "Length range",
      colLow: "Low season €/night",
      colHigh: "High season €/night",
      caption: (vat) =>
        `Base rates per night, excl. ${vat}% VAT and utilities. Season: low = Jan–Mar & Oct–Dec, high = Apr–Sep.`,
      upTo: (max) => `Up to ${max} m`,
    },
    about: {
      eyebrow: "About",
    },
    contact: {
      heading: "Contact",
      phone: "Phone",
      email: "Email",
    },
    visiting: {
      heading: "Visiting the marina",
      hailing: "Hailing",
      vhfChannel: (n) => `VHF Channel ${n}`,
      officeHours: "Office hours",
      summer: "Summer",
      winter: "Winter",
      onArrival: "On arrival",
      byCar: "By car",
      byTrain: "By train",
      byAir: "By air",
      maxLength: "Max length",
      maxDraft: "Max draft",
    },
    keyFacts: {
      heading: "Key facts",
      berths: "Berths",
      maxLength: "Max length",
      maxDraft: "Max draft",
      coordinates: "Coordinates",
      address: "Address",
    },
    facilities: {
      heading: "Facilities",
      fuel: "Fuel dock",
      water: "Water",
      power: "Shore power",
      travelLift: "70-tonne travel lift",
      crane: "Crane",
      pumpOut: "Pump-out",
      laundry: "Laundry",
      security24h: "24-hour security",
      wifi: "Wifi",
      dryStorage: "Dry storage",
      repairs: "Repairs",
    },
    language: { label: "Language" },
    units: { label: "Units", metric: "Metres", imperial: "Feet" },
    dock: {
      open: "Contact marina",
      close: "Close",
      heading: "Contact the marina",
      call: "Call",
      vhf: "VHF channel",
      email: "Email",
      message: "Message the marina",
    },
    favourites: {
      save: "Save marina",
      saved: "Saved",
      savedHeading: "Your saved marinas",
    },
    preArrival: {
      cta: {
        arrivalActions: "Complete pre-arrival check-in",
        myBoat: "Start your pre-arrival check-in",
      },
      page: {
        title: "Pre-arrival check-in",
        subtitle:
          "Answer these once and arrival becomes confirm and go. Nothing is sent anywhere until you press Send at the end.",
        autosaveNote: "Saved on this device as you go.",
        resumeBanner: "Continuing where you left off.",
        startOver: "Start over",
        back: "Back",
        continueBtn: "Continue",
        stepOf: (step, total) => `Step ${step} of ${total}`,
        nightsCount: (n) => `${n} ${n === 1 ? "night" : "nights"}`,
        peopleOnBoard: (n) => `${n} ${n === 1 ? "person" : "people"} on board`,
      },
      steps: {
        boat: "Your boat",
        voyage: "Your voyage",
        crew: "Who is on board",
        documents: "Documents",
        stay: "Your stay",
        review: "Review and send",
      },
      boat: {
        heading: "Your boat",
        chooseSaved: "Choose a saved boat",
        chooseSavedPlaceholder: "Choose a saved boat…",
        orNewBoat: "Or enter a new boat",
        nameLabel: "Boat name",
        registrationLabel: "Registration number",
        flagLabel: "Flag country",
        portOfRegistryLabel: "Port of registry",
        zoneLabel: "Navigation zone",
        specificationsHeading: "Specifications",
        lengthLabel: "Length overall (m)",
        beamLabel: "Beam (m)",
        draughtLabel: "Draught (m)",
        propulsionLabel: "Propulsion",
        propulsionSail: "Sail",
        propulsionPower: "Power",
        propulsionBoth: "Sail and power",
        multihullLabel: "Multihull",
        classLabel: (cls) => `Berth class ${cls}`,
        indicativeNightly: (amount) => `About ${amount} a night, indicative`,
        vesselUseLabel: "Vessel use",
        ownerHeading: "About you",
        ownerNameLabel: "Full name",
        ownerIdLabel: "ID or passport number",
        ownerTaxNumberLabel: "Tax number (NIF), if resident in Portugal",
        ownerResidenceLabel: "Country of residence",
        ownerAddressLabel: "Address",
        ownerIsCompanyLabel: "The boat is owned by a company",
        ownerCompanyTaxIdLabel: "Company tax number (NIPC)",
        ownerEmailLabel: "Email",
        ownerPhoneLabel: "Phone",
      },
      voyage: {
        heading: "Your voyage",
        lastPortLabel: "Last port",
        lastPortCountryLabel: "Last port's country",
        nextPortLabel: "Next port",
        nextPortCountryLabel: "Next port's country",
        arrivalLabel: "Arrival date and time",
        departureLabel: "Departure date and time",
        infoOutsideSchengenTitle: "Arriving from outside Schengen",
        infoOutsideSchengenBody:
          "You must clear border control with the GNR on arrival. The marina will help. Everyone on board needs a valid passport.",
        infoNonEUFlagTitle: "Non-EU-flagged boat",
        infoNonEUFlagBody:
          "A non-EU-flagged boat can normally stay under EU Temporary Admission for up to 18 months without import VAT, for private use only, when the owner is resident outside the EU. It does not cover charter use.",
        infoNonEUFlagResidentWarning:
          "The owner given in Step 1 is resident in the EU, so Temporary Admission is not normally available. Check with customs.",
        infoNonEUMovementTitle: "Crossing to or from outside the EU",
        infoNonEUMovementBody:
          "The marina must report this movement to the maritime, border and customs authorities (Latitude 32). This form collects what is needed for that report.",
      },
      crew: {
        heading: "Who is on board",
        howManyLabel: "How many people on board?",
        allFreeMovementToggle: "All on board are EU, EEA or Swiss citizens",
        reuseLastCrewToggle: "Reuse crew from my last trip",
        sameSurnameToggle: "Same surname as person 1",
        sameNationalityToggle: "Same nationality as person 1",
        personTitle: (n) => `Person ${n}`,
        skipperDefaultNote: "Person 1 is the skipper by default.",
        statusComplete: "Complete",
        statusMissing: "Missing info",
        statusCheckDates: "Check dates",
        scanPassport: "Scan passport",
        scanComingSoon: "Coming soon, type the details for now",
        fullCrewListChip: "Full crew list required for this route",
        roleLabel: "Role",
        roleSkipper: "Skipper",
        roleCrew: "Crew",
        roleGuest: "Guest",
        familyNameLabel: "Family name",
        givenNamesLabel: "Given names",
        nationalityLabel: "Nationality",
        dateOfBirthLabel: "Date of birth",
        placeOfBirthLabel: "Place of birth",
        genderLabel: "Gender, as on ID",
        idTypeLabel: "ID type",
        idTypePassport: "Passport",
        idTypeNationalId: "National ID",
        idNumberLabel: "ID number",
        idIssuingStateLabel: "ID issuing state",
        idExpiryLabel: "ID expiry date",
        idIssueDateLabel: "ID issue date",
        embarkationDateLabel: "Embarkation date",
        guardianLabel: "Travelling with",
        guardianPlaceholder: "Choose the adult guardian…",
        removePerson: "Remove",
      },
      documents: {
        heading: "Documents",
        intro:
          "This list is built for your boat and voyage. Mark what you have, the physical document is still checked on arrival.",
        requiredChip: "Required",
        optionalChip: "Optional",
        useSaved: "Use saved document",
        uploadTile: "Add file (mock, stores the file name only)",
        numberLabel: "Number",
        expiryLabel: "Expiry date",
        issuingAuthorityLabel: "Issuing authority",
        insurerLabel: "Insurer",
        items: {
          registration: "Boat registration (livrete)",
          thirdPartyInsurance: "Third-party liability insurance",
          skipperLicence: "Skipper's certificate of competence",
          iucProof: "Proof of IUC (boat tax) payment",
          radioStationLicence: "Radio station licence",
          surveyCertificate: "Survey certificate",
          temporaryAdmissionEvidence: "Evidence of Temporary Admission",
        },
      },
      stay: {
        heading: "Your stay",
        arrivalLabel: "Arrival date",
        departureLabel: "Departure date",
        servicesHeading: "Services wanted",
        electricityLabel: "Electricity",
        waterLabel: "Water",
        pumpOutLabel: "Pump-out",
        fuelDockSlotLabel: "Fuel dock slot",
        craneLabel: "Crane",
        specialRequestsLabel: "Special requests",
        depositNote: "A deposit is paid at check-in and adjusted at departure.",
        billingNote: "Days run from 12:00 to 12:00.",
        priceHeading: "Indicative price",
        indicativeNote: "Indicative, confirmed by the marina.",
        askMarina: "Outside the standard classes, ask the marina for a quote.",
        seasonLow: "low season",
        seasonHigh: "high season",
        lineLabel: (nights, season, rate) =>
          `${nights} ${nights === 1 ? "night" : "nights"} · ${season} · ${rate}/night`,
        multihullNote: "Multihull surcharge applied.",
        subtotalLine: (subtotal, vat) => `Subtotal ${subtotal} + VAT ${vat}`,
      },
      review: {
        heading: "Review and send",
        edit: "Edit",
        peopleCount: (n) => `${n} ${n === 1 ? "person" : "people"}`,
        documentMissing: "Missing",
        documentNotProvided: "Not provided",
        consentsHeading: "Before you send this",
        gdprLabel:
          "I understand my data is used only to register this stay and to meet the marina's legal reporting duties.",
        termsLabel: "I accept the marina's regulation.",
        declarationLabel: "I declare the information given is true.",
        submit: "Send pre-arrival check-in",
      },
      confirmation: {
        heading: "Check-in received",
        referenceLabel: "Your reference",
        whatNextHeading: "What happens next",
        whatNextBody:
          "The marina reviews this before you arrive. At the office, quote your reference and confirm your berth.",
        bringHeading: "Bring these documents in person",
        backToMarina: "Back to the marina page",
      },
    },
  },
  pt: {
    nav: {
      home: "Início",
      marinas: "Marinas",
      aboutUs: "Sobre nós",
      contact: "Contactos",
      search: "Pesquisar",
      openMenu: "Abrir menu",
      closeMenu: "Fechar menu",
      myBoat: "O meu barco",
    },
    footer: {
      tagline: "Reserve a sua amarração, sem complicações",
      company: "Empresa",
      product: "Produto",
      contact: "Contactos",
      aboutUs: "Sobre nós",
      marinas: "Marinas",
      copyright: (year) => `© ${year} aldock. Todos os direitos reservados.`,
    },
    home: {
      tagline: "Reserve a sua amarração, sem complicações",
      valueProp:
        "Encontre e reserve a sua amarração nas marinas de Portugal.",
      browseMarinas: "Ou explore as marinas",
      aboutHeading: "A reserva de amarração, reinventada",
      aboutBody:
        "A aldock traz clareza à reserva de amarrações e à comunicação com quem visita a marina. Acreditamos que reservar um lugar deve ser tão sereno como uma manhã em águas calmas.",
      contactHeading: "Fale connosco",
      contactBody:
        "Dúvidas sobre amarrações, reservas ou parcerias? Teremos todo o gosto em ajudar.",
      destinationLabel: "Para onde navega?",
      destinationPlaceholder: "Marina, região ou país",
      addFilters: "Adicionar datas e comprimento",
      hideFilters: "Ocultar datas e comprimento",
      findMarinas: "Encontrar marinas",
      featuredHeading: "Marina em destaque",
      moreMarinas: "Mais marinas",
    },
    results: {
      heading: "Marinas",
      forQuery: (query) => `Marinas para “${query}”`,
      count: (n) => `${n} ${n === 1 ? "marina" : "marinas"}`,
      none: "Nenhuma marina corresponde à pesquisa. Experimente uma marina, uma região ou um país.",
      from: "desde",
    },
    homeSearch: {
      arrival: "Chegada",
      departure: "Partida",
      boatLength: "Comprimento fora a fora (m)",
      searchButton: "Procurar amarrações",
    },
    countryPage: {
      heading: (country) => `Marinas em ${country}`,
      viewMarina: "Ver marina →",
    },
    breadcrumbs: {
      marinas: "Marinas",
    },
    berthSearch: {
      heading: "Amarrações disponíveis",
      subheading: (marinaName) =>
        `Consulte a disponibilidade simulada de amarrações em ${marinaName}.`,
      illustrative:
        "A disponibilidade de amarrações apresentada é meramente ilustrativa, por agora.",
      arrival: "Chegada",
      departure: "Partida",
      boatLength: "Comprimento fora a fora (m)",
      lengthPlaceholder: "ex.: 7",
      searchButton: "Procurar",
      errorLength: "Indique o comprimento do seu barco em metros.",
      errorDates: "Escolha uma data de chegada e uma de partida.",
      errorDeparture: "A partida deve ser posterior à chegada.",
      noClass: (cls) =>
        `Ainda não há amarrações da Classe ${cls} neste esquema. As classes de embarcações maiores serão adicionadas em breve.`,
      noAvailable:
        "Não há amarrações disponíveis para estas datas. Experimente outras datas.",
      noFit:
        "Nenhuma classe de amarração serve uma embarcação com este comprimento no tarifário atual (máx. 45 m). Contacte a marina diretamente.",
      seasonBoth: (low, high) =>
        `A sua estadia abrange as duas épocas: ${low} noite${low === 1 ? "" : "s"} em época baixa e ${high} noite${high === 1 ? "" : "s"} em época alta.`,
      seasonHigh: "As suas datas caem na época alta (abr.–set.).",
      seasonLow: "As suas datas caem na época baixa (jan.–mar. e out.–dez.).",
      legendAvailable: "Disponível e adequada",
      legendOccupied: "Ocupada",
      legendUnfit: "Não serve o seu barco",
      legendNeutral: "Ainda sem pesquisa",
      hintBeforeSearch:
        "Indique as datas e o comprimento do barco e pesquise para ver a disponibilidade.",
      priceBerthLine: (id, cls, nights) =>
        `Amarração ${id} · Classe ${cls} · ${nights} noite${nights === 1 ? "" : "s"}`,
      vatNote: (rate) =>
        `+ IVA (${rate}%) e consumos. Valor estimado, a confirmar com a marina.`,
      ctaHeading: (marinaName) =>
        `Dúvidas sobre uma amarração em ${marinaName}?`,
      ctaButton: "Contactar a marina",
      mailSubject: "Pedido de amarração - Marina de Cascais",
      mailGreeting: "Boa tarde,",
      mailIntro:
        "Gostaria de saber mais sobre a disponibilidade de amarrações na Marina de Cascais.",
      mailArrival: "Chegada",
      mailDeparture: "Partida",
      mailBoatLength: "Comprimento fora a fora",
      mailBerth: "Amarração pretendida",
      mailSignoff: "Com os melhores cumprimentos,",
    },
    rates: {
      eyebrow: "Tarifário",
      heading: "Tarifas de trânsito",
      colClass: "Classe",
      colLength: "Comprimento",
      colLow: "Época baixa €/noite",
      colHigh: "Época alta €/noite",
      caption: (vat) =>
        `Tarifas base por noite, sem IVA (${vat}%) nem consumos. Época baixa: jan.–mar. e out.–dez. Época alta: abr.–set.`,
      upTo: (max) => `Até ${max} m`,
    },
    about: {
      eyebrow: "Sobre",
    },
    contact: {
      heading: "Contactos",
      phone: "Telefone",
      email: "Email",
    },
    visiting: {
      heading: "Visitar a marina",
      hailing: "Contacto rádio",
      vhfChannel: (n) => `Canal VHF ${n}`,
      officeHours: "Horário do escritório",
      summer: "Verão",
      winter: "Inverno",
      onArrival: "À chegada",
      byCar: "De carro",
      byTrain: "De comboio",
      byAir: "De avião",
      maxLength: "Comprimento máximo",
      maxDraft: "Calado máximo",
    },
    keyFacts: {
      heading: "Dados essenciais",
      berths: "Lugares de amarração",
      maxLength: "Comprimento máximo",
      maxDraft: "Calado máximo",
      coordinates: "Coordenadas",
      address: "Morada",
    },
    facilities: {
      heading: "Instalações e serviços",
      fuel: "Posto de combustível",
      water: "Água",
      power: "Eletricidade",
      travelLift: "Pórtico de 70 toneladas",
      crane: "Grua",
      pumpOut: "Recolha de águas residuais",
      laundry: "Lavandaria",
      security24h: "Segurança 24 horas",
      wifi: "Wi-Fi",
      dryStorage: "Estacionamento em área técnica",
      repairs: "Reparações",
    },
    language: { label: "Idioma" },
    units: { label: "Unidades", metric: "Metros", imperial: "Pés" },
    dock: {
      open: "Contactar a marina",
      close: "Fechar",
      heading: "Contactar a marina",
      call: "Ligar",
      vhf: "Canal VHF",
      email: "Email",
      message: "Enviar mensagem à marina",
    },
    favourites: {
      save: "Guardar marina",
      saved: "Guardada",
      savedHeading: "As suas marinas guardadas",
    },
    preArrival: {
      cta: {
        arrivalActions: "Preencher o pre-check-in de chegada",
        myBoat: "Iniciar o pre-check-in de chegada",
      },
      page: {
        title: "Pre-check-in de chegada",
        subtitle:
          "Responda uma vez e a chegada torna-se confirmar e seguir. Nada é enviado até premir Enviar no final.",
        autosaveNote: "Guardado neste dispositivo à medida que avança.",
        resumeBanner: "A continuar de onde ficou.",
        startOver: "Recomeçar",
        back: "Voltar",
        continueBtn: "Continuar",
        stepOf: (step, total) => `Passo ${step} de ${total}`,
        nightsCount: (n) => `${n} ${n === 1 ? "noite" : "noites"}`,
        peopleOnBoard: (n) => `${n} ${n === 1 ? "pessoa" : "pessoas"} a bordo`,
      },
      steps: {
        boat: "A sua embarcação",
        voyage: "A sua viagem",
        crew: "Quem está a bordo",
        documents: "Documentos",
        stay: "A sua estadia",
        review: "Rever e enviar",
      },
      boat: {
        heading: "A sua embarcação",
        chooseSaved: "Escolha uma embarcação guardada",
        chooseSavedPlaceholder: "Escolha uma embarcação guardada…",
        orNewBoat: "Ou introduza uma nova embarcação",
        nameLabel: "Nome da embarcação",
        registrationLabel: "Número de registo",
        flagLabel: "País de bandeira",
        portOfRegistryLabel: "Porto de registo",
        zoneLabel: "Zona de navegação",
        specificationsHeading: "Especificações",
        lengthLabel: "Comprimento fora a fora (m)",
        beamLabel: "Boca (m)",
        draughtLabel: "Calado (m)",
        propulsionLabel: "Propulsão",
        propulsionSail: "Vela",
        propulsionPower: "Motor",
        propulsionBoth: "Vela e motor",
        multihullLabel: "Multicasco",
        classLabel: (cls) => `Classe de posto de amarração ${cls}`,
        indicativeNightly: (amount) => `Cerca de ${amount} por noite, indicativo`,
        vesselUseLabel: "Utilização da embarcação",
        ownerHeading: "Sobre si",
        ownerNameLabel: "Nome completo",
        ownerIdLabel: "Número de identificação ou passaporte",
        ownerTaxNumberLabel: "NIF, se residente em Portugal",
        ownerResidenceLabel: "País de residência",
        ownerAddressLabel: "Morada",
        ownerIsCompanyLabel: "A embarcação pertence a uma empresa",
        ownerCompanyTaxIdLabel: "NIPC da empresa",
        ownerEmailLabel: "Email",
        ownerPhoneLabel: "Telefone",
      },
      voyage: {
        heading: "A sua viagem",
        lastPortLabel: "Último porto",
        lastPortCountryLabel: "País do último porto",
        nextPortLabel: "Próximo porto",
        nextPortCountryLabel: "País do próximo porto",
        arrivalLabel: "Data e hora de chegada",
        departureLabel: "Data e hora de partida",
        infoOutsideSchengenTitle: "A chegar de fora do espaço Schengen",
        infoOutsideSchengenBody:
          "Tem de efetuar o controlo fronteiriço com a GNR à chegada. A marina irá ajudar. Todos a bordo precisam de passaporte válido.",
        infoNonEUFlagTitle: "Embarcação com bandeira extra-UE",
        infoNonEUFlagBody:
          "Uma embarcação com bandeira extra-UE pode normalmente permanecer em Admissão Temporária da UE até 18 meses sem IVA de importação, apenas para uso privado, quando o proprietário reside fora da UE. Não cobre uso de charter.",
        infoNonEUFlagResidentWarning:
          "O proprietário indicado no Passo 1 reside na UE, pelo que a Admissão Temporária não está normalmente disponível. Confirme junto da alfândega.",
        infoNonEUMovementTitle: "A cruzar de ou para fora da UE",
        infoNonEUMovementBody:
          "A marina tem de comunicar este movimento às autoridades marítima, fronteiriça e aduaneira (Latitude 32). Este formulário recolhe o necessário para essa comunicação.",
      },
      crew: {
        heading: "Quem está a bordo",
        howManyLabel: "Quantas pessoas estão a bordo?",
        allFreeMovementToggle: "Todos a bordo são cidadãos UE, EEE ou suíços",
        reuseLastCrewToggle: "Reutilizar tripulação da última viagem",
        sameSurnameToggle: "Mesmo apelido da pessoa 1",
        sameNationalityToggle: "Mesma nacionalidade da pessoa 1",
        personTitle: (n) => `Pessoa ${n}`,
        skipperDefaultNote: "A pessoa 1 é o comandante por predefinição.",
        statusComplete: "Completo",
        statusMissing: "Falta informação",
        statusCheckDates: "Verificar datas",
        scanPassport: "Digitalizar passaporte",
        scanComingSoon: "Brevemente, por agora introduza os dados",
        fullCrewListChip: "Lista de tripulação completa exigida nesta rota",
        roleLabel: "Função",
        roleSkipper: "Comandante",
        roleCrew: "Tripulante",
        roleGuest: "Convidado",
        familyNameLabel: "Apelido",
        givenNamesLabel: "Nomes próprios",
        nationalityLabel: "Nacionalidade",
        dateOfBirthLabel: "Data de nascimento",
        placeOfBirthLabel: "Naturalidade",
        genderLabel: "Género, conforme no documento",
        idTypeLabel: "Tipo de documento",
        idTypePassport: "Passaporte",
        idTypeNationalId: "Cartão de cidadão",
        idNumberLabel: "Número do documento",
        idIssuingStateLabel: "País emissor do documento",
        idExpiryLabel: "Data de validade",
        idIssueDateLabel: "Data de emissão",
        embarkationDateLabel: "Data de embarque",
        guardianLabel: "Viaja com",
        guardianPlaceholder: "Escolha o adulto responsável…",
        removePerson: "Remover",
      },
      documents: {
        heading: "Documentos",
        intro:
          "Esta lista é construída para a sua embarcação e viagem. Assinale o que tem, o documento físico é sempre verificado à chegada.",
        requiredChip: "Obrigatório",
        optionalChip: "Opcional",
        useSaved: "Usar documento guardado",
        uploadTile: "Adicionar ficheiro (simulado, guarda apenas o nome)",
        numberLabel: "Número",
        expiryLabel: "Data de validade",
        issuingAuthorityLabel: "Entidade emissora",
        insurerLabel: "Seguradora",
        items: {
          registration: "Livrete da embarcação",
          thirdPartyInsurance: "Seguro de responsabilidade civil",
          skipperLicence: "Carta de navegador / comandante",
          iucProof: "Comprovativo de pagamento do IUC",
          radioStationLicence: "Licença de estação de rádio",
          surveyCertificate: "Certificado de vistoria",
          temporaryAdmissionEvidence: "Comprovativo de Admissão Temporária",
        },
      },
      stay: {
        heading: "A sua estadia",
        arrivalLabel: "Data de chegada",
        departureLabel: "Data de partida",
        servicesHeading: "Serviços pretendidos",
        electricityLabel: "Eletricidade",
        waterLabel: "Água",
        pumpOutLabel: "Despejo de águas residuais",
        fuelDockSlotLabel: "Reserva no posto de combustível",
        craneLabel: "Grua",
        specialRequestsLabel: "Pedidos especiais",
        depositNote: "O depósito é pago no check-in e ajustado na partida.",
        billingNote: "Os dias contam-se das 12:00 às 12:00.",
        priceHeading: "Preço indicativo",
        indicativeNote: "Indicativo, confirmado pela marina.",
        askMarina: "Fora das classes padrão, peça um orçamento à marina.",
        seasonLow: "época baixa",
        seasonHigh: "época alta",
        lineLabel: (nights, season, rate) =>
          `${nights} ${nights === 1 ? "noite" : "noites"} · ${season} · ${rate}/noite`,
        multihullNote: "Sobretaxa de multicasco aplicada.",
        subtotalLine: (subtotal, vat) => `Subtotal ${subtotal} + IVA ${vat}`,
      },
      review: {
        heading: "Rever e enviar",
        edit: "Editar",
        peopleCount: (n) => `${n} ${n === 1 ? "pessoa" : "pessoas"}`,
        documentMissing: "Em falta",
        documentNotProvided: "Não fornecido",
        consentsHeading: "Antes de enviar",
        gdprLabel:
          "Compreendo que os meus dados são usados apenas para registar esta estadia e cumprir as obrigações legais de comunicação da marina.",
        termsLabel: "Aceito o regulamento da marina.",
        declarationLabel: "Declaro que a informação prestada é verdadeira.",
        submit: "Enviar pre-check-in de chegada",
      },
      confirmation: {
        heading: "Pre-check-in recebido",
        referenceLabel: "A sua referência",
        whatNextHeading: "Próximos passos",
        whatNextBody:
          "A marina revê este pre-check-in antes da sua chegada. No cais, indique a referência e confirme o posto de amarração.",
        bringHeading: "Traga estes documentos pessoalmente",
        backToMarina: "Voltar à página da marina",
      },
    },
  },
};

type DeepPartial<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

function mergeDictionary(
  base: Dictionary,
  override: DeepPartial<Dictionary>
): Dictionary {
  const merge = (b: unknown, o: unknown): unknown => {
    if (o === undefined) return b;
    if (
      o &&
      b &&
      typeof o === "object" &&
      typeof b === "object" &&
      !Array.isArray(o)
    ) {
      const result: Record<string, unknown> = { ...(b as object) };
      for (const key of Object.keys(o)) {
        result[key] = merge(
          (b as Record<string, unknown>)[key],
          (o as Record<string, unknown>)[key]
        );
      }
      return result;
    }
    return o;
  };
  return merge(base, override) as Dictionary;
}

// TODO(i18n): ES and FR cover navigation, footer, home, search, rates
// headings, results, the shared contact/units/favourites labels, and (for
// preArrival) the page chrome, step names and the three calm voyage info
// panels. The rest of preArrival (every field label) falls back to English
// until fully translated, the same as everything else not listed here.
const es: DeepPartial<Dictionary> = {
  nav: {
    home: "Inicio",
    marinas: "Marinas",
    aboutUs: "Sobre nosotros",
    contact: "Contacto",
    search: "Buscar",
    openMenu: "Abrir menú",
    closeMenu: "Cerrar menú",
    myBoat: "Mi barco",
  },
  footer: {
    tagline: "Reserva tu amarre, sin complicaciones",
    company: "Empresa",
    product: "Producto",
    contact: "Contacto",
    aboutUs: "Sobre nosotros",
    marinas: "Marinas",
    copyright: (year) => `© ${year} aldock. Todos los derechos reservados.`,
  },
  home: {
    tagline: "Reserva tu amarre, sin complicaciones",
    valueProp: "Encuentra y reserva tu amarre en las marinas de Portugal.",
    browseMarinas: "O explora las marinas",
    aboutHeading: "La reserva de amarres, reinventada",
    aboutBody:
      "aldock aporta claridad a la reserva de amarres y a la comunicación con quienes visitan la marina. Creemos que reservar un amarre debería ser tan tranquilo como una mañana en aguas calmas.",
    contactHeading: "Hablemos",
    contactBody:
      "¿Dudas sobre amarres, reservas o colaboraciones? Estaremos encantados de ayudarte.",
    destinationLabel: "¿Hacia dónde navegas?",
    destinationPlaceholder: "Marina, región o país",
    addFilters: "Añadir fechas y eslora",
    hideFilters: "Ocultar fechas y eslora",
    findMarinas: "Buscar marinas",
    featuredHeading: "Marina destacada",
    moreMarinas: "Más marinas",
  },
  results: {
    heading: "Marinas",
    forQuery: (query) => `Marinas para «${query}»`,
    count: (n) => `${n} ${n === 1 ? "marina" : "marinas"}`,
    none: "Ninguna marina coincide con tu búsqueda. Prueba con una marina, una región o un país.",
    from: "desde",
  },
  homeSearch: {
    arrival: "Llegada",
    departure: "Salida",
    boatLength: "Eslora total (m)",
    searchButton: "Buscar amarres",
  },
  countryPage: {
    heading: (country) => `Marinas en ${country}`,
    viewMarina: "Ver marina →",
  },
  breadcrumbs: { marinas: "Marinas" },
  berthSearch: {
    heading: "Amarres disponibles",
    arrival: "Llegada",
    departure: "Salida",
    boatLength: "Eslora total (m)",
    searchButton: "Buscar",
    illustrative:
      "La disponibilidad de amarres que se muestra es solo ilustrativa por ahora.",
    ctaButton: "Contactar con la marina",
  },
  rates: {
    eyebrow: "Tarifas",
    heading: "Tarifas de tránsito",
    colClass: "Clase",
    colLength: "Eslora",
    colLow: "Temporada baja €/noche",
    colHigh: "Temporada alta €/noche",
  },
  contact: { heading: "Contacto", phone: "Teléfono", email: "Correo electrónico" },
  facilities: { heading: "Instalaciones y servicios" },
  language: { label: "Idioma" },
  units: { label: "Unidades", metric: "Metros", imperial: "Pies" },
  dock: {
    open: "Contactar con la marina",
    close: "Cerrar",
    heading: "Contactar con la marina",
    call: "Llamar",
    vhf: "Canal VHF",
    email: "Correo electrónico",
    message: "Escribir a la marina",
  },
  favourites: {
    save: "Guardar marina",
    saved: "Guardada",
    savedHeading: "Tus marinas guardadas",
  },
  preArrival: {
    cta: {
      arrivalActions: "Completar el registro previo a la llegada",
      myBoat: "Iniciar el registro previo a la llegada",
    },
    page: {
      title: "Registro previo a la llegada",
      subtitle:
        "Responda una vez y la llegada será confirmar y listo. No se envía nada hasta que pulse Enviar al final.",
      autosaveNote: "Guardado en este dispositivo a medida que avanza.",
      resumeBanner: "Continuando donde lo dejó.",
      startOver: "Empezar de nuevo",
      back: "Atrás",
      continueBtn: "Continuar",
      stepOf: (step, total) => `Paso ${step} de ${total}`,
    },
    steps: {
      boat: "Su embarcación",
      voyage: "Su travesía",
      crew: "Quién va a bordo",
      documents: "Documentos",
      stay: "Su estancia",
      review: "Revisar y enviar",
    },
    voyage: {
      infoOutsideSchengenTitle: "Llegada desde fuera de Schengen",
      infoOutsideSchengenBody:
        "Debe pasar el control fronterizo con la GNR a la llegada. La marina le ayudará. Todos a bordo necesitan pasaporte válido.",
      infoNonEUFlagTitle: "Embarcación con pabellón no comunitario",
      infoNonEUFlagBody:
        "Una embarcación con pabellón no comunitario puede permanecer en Admisión Temporal de la UE hasta 18 meses sin IVA de importación, solo para uso privado, si el propietario reside fuera de la UE. No cubre el chárter.",
      infoNonEUFlagResidentWarning:
        "El propietario indicado en el paso 1 reside en la UE, por lo que la Admisión Temporal no suele estar disponible. Consulte con aduanas.",
      infoNonEUMovementTitle: "Cruce hacia o desde fuera de la UE",
      infoNonEUMovementBody:
        "La marina debe comunicar este movimiento a las autoridades marítima, fronteriza y aduanera (Latitude 32). Este formulario recoge lo necesario para ese aviso.",
    },
  },
};

const fr: DeepPartial<Dictionary> = {
  nav: {
    home: "Accueil",
    marinas: "Marinas",
    aboutUs: "À propos",
    contact: "Contact",
    search: "Rechercher",
    openMenu: "Ouvrir le menu",
    closeMenu: "Fermer le menu",
    myBoat: "Mon bateau",
  },
  footer: {
    tagline: "Réservez votre place de port, en toute simplicité",
    company: "Société",
    product: "Produit",
    contact: "Contact",
    aboutUs: "À propos",
    marinas: "Marinas",
    copyright: (year) => `© ${year} aldock. Tous droits réservés.`,
  },
  home: {
    tagline: "Réservez votre place de port, en toute simplicité",
    valueProp:
      "Trouvez et réservez votre place de port dans les marinas du Portugal.",
    browseMarinas: "Ou parcourez les marinas",
    aboutHeading: "La réservation de place de port, réinventée",
    aboutBody:
      "aldock apporte de la clarté à la réservation des places de port et aux échanges avec les plaisanciers de passage. Nous pensons que réserver une place devrait être aussi paisible qu'un matin sur une eau calme.",
    contactHeading: "Parlons-en",
    contactBody:
      "Une question sur une place de port, une réservation ou un partenariat ? Nous serons ravis de vous répondre.",
    destinationLabel: "Où faites-vous route ?",
    destinationPlaceholder: "Marina, région ou pays",
    addFilters: "Ajouter dates et longueur",
    hideFilters: "Masquer dates et longueur",
    findMarinas: "Trouver une marina",
    featuredHeading: "Marina à la une",
    moreMarinas: "Autres marinas",
  },
  results: {
    heading: "Marinas",
    forQuery: (query) => `Marinas pour « ${query} »`,
    count: (n) => `${n} ${n === 1 ? "marina" : "marinas"}`,
    none: "Aucune marina ne correspond à votre recherche. Essayez une marina, une région ou un pays.",
    from: "dès",
  },
  homeSearch: {
    arrival: "Arrivée",
    departure: "Départ",
    boatLength: "Longueur hors tout (m)",
    searchButton: "Chercher une place",
  },
  countryPage: {
    heading: (country) => `Marinas : ${country}`,
    viewMarina: "Voir la marina →",
  },
  breadcrumbs: { marinas: "Marinas" },
  berthSearch: {
    heading: "Places de port disponibles",
    arrival: "Arrivée",
    departure: "Départ",
    boatLength: "Longueur hors tout (m)",
    searchButton: "Chercher",
    illustrative:
      "La disponibilité des places affichée est donnée à titre indicatif pour le moment.",
    ctaButton: "Contacter la capitainerie",
  },
  rates: {
    eyebrow: "Tarifs",
    heading: "Tarifs de passage",
    colClass: "Classe",
    colLength: "Longueur",
    colLow: "Basse saison, €/nuit",
    colHigh: "Haute saison, €/nuit",
  },
  contact: { heading: "Contact", phone: "Téléphone", email: "E-mail" },
  facilities: { heading: "Services et équipements" },
  language: { label: "Langue" },
  units: { label: "Unités", metric: "Mètres", imperial: "Pieds" },
  dock: {
    open: "Contacter la capitainerie",
    close: "Fermer",
    heading: "Contacter la capitainerie",
    call: "Appeler",
    vhf: "Canal VHF",
    email: "E-mail",
    message: "Écrire à la capitainerie",
  },
  favourites: {
    save: "Enregistrer la marina",
    saved: "Enregistrée",
    savedHeading: "Vos marinas enregistrées",
  },
  preArrival: {
    cta: {
      arrivalActions: "Compléter le pré-enregistrement d'arrivée",
      myBoat: "Démarrer le pré-enregistrement d'arrivée",
    },
    page: {
      title: "Pré-enregistrement d'arrivée",
      subtitle:
        "Répondez une fois, et l'arrivée devient un simple contrôle. Rien n'est envoyé avant d'appuyer sur Envoyer à la fin.",
      autosaveNote: "Enregistré sur cet appareil au fur et à mesure.",
      resumeBanner: "Reprise là où vous en étiez.",
      startOver: "Recommencer",
      back: "Retour",
      continueBtn: "Continuer",
      stepOf: (step, total) => `Étape ${step} sur ${total}`,
    },
    steps: {
      boat: "Votre bateau",
      voyage: "Votre traversée",
      crew: "Qui est à bord",
      documents: "Documents",
      stay: "Votre séjour",
      review: "Vérifier et envoyer",
    },
    voyage: {
      infoOutsideSchengenTitle: "Arrivée depuis hors de l'espace Schengen",
      infoOutsideSchengenBody:
        "Vous devez passer le contrôle frontalier avec la GNR à l'arrivée. La capitainerie vous aidera. Chaque personne à bord doit avoir un passeport valide.",
      infoNonEUFlagTitle: "Bateau battant pavillon hors UE",
      infoNonEUFlagBody:
        "Un bateau battant pavillon hors UE peut rester en Admission Temporaire de l'UE jusqu'à 18 mois sans TVA à l'importation, pour un usage privé uniquement, si le propriétaire réside hors de l'UE. Cela ne couvre pas la location.",
      infoNonEUFlagResidentWarning:
        "Le propriétaire indiqué à l'étape 1 réside dans l'UE, l'Admission Temporaire n'est donc normalement pas disponible. Vérifiez auprès des douanes.",
      infoNonEUMovementTitle: "Traversée vers ou depuis hors de l'UE",
      infoNonEUMovementBody:
        "La capitainerie doit déclarer ce mouvement aux autorités maritime, frontalière et douanière (Latitude 32). Ce formulaire recueille ce qui est nécessaire pour cette déclaration.",
    },
  },
};

export const translations: Record<Locale, Dictionary> = {
  en: baseTranslations.en,
  pt: baseTranslations.pt,
  es: mergeDictionary(baseTranslations.en, es),
  fr: mergeDictionary(baseTranslations.en, fr),
};

// Marina-specific prose, bilingual. Structured per marina id so more
// marinas can be added to the dictionary later. Kept separate from
// data/marinas.ts, which holds language-agnostic real values (address,
// phone, rates, coordinates, etc).
export const marinaContent = {
  cascais: {
    description: {
      en: "Marina de Cascais is a full-service marina on the Bay of Cascais, just five minutes from the town centre and the largest on the Portuguese Riviera. With around 650 berths for vessels up to 36 metres, it pairs sheltered, modern moorings with a complete range of nautical services alongside the restaurants and shops of the waterfront.",
      pt: "A Marina de Cascais é uma marina completa na Baía de Cascais, a apenas cinco minutos do centro da vila e a maior da Riviera Portuguesa. Com cerca de 650 lugares de amarração para embarcações até 36 metros, combina um fundeadouro abrigado e moderno com uma gama completa de serviços náuticos, junto aos restaurantes e lojas da marginal.",
    },
    arrivalInstructions: {
      en: "On arrival, berth on the Reception pier and report to the marina office.",
      pt: "À chegada, atraque no cais de receção e dirija-se ao escritório da marina.",
    },
    gettingThere: {
      byCar: {
        en: "Via the A5 motorway, Cascais exit",
        pt: "Pela autoestrada A5, saída Cascais",
      },
      byTrain: {
        en: "Cascais train station, then a short walk to the marina",
        pt: "Estação de comboios de Cascais, seguido de uma curta caminhada até à marina",
      },
      byAir: {
        en: "~35 km from Lisbon Humberto Delgado Airport",
        pt: "~35 km do Aeroporto Humberto Delgado, em Lisboa",
      },
    },
  },
} as const;
