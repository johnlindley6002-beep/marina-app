import type { FacilityKey } from "../data/marinas";

export type Locale = "en" | "pt" | "fr" | "de" | "es" | "it";

export const LOCALES: Locale[] = ["en", "pt", "fr", "de", "es", "it"];

export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  pt: "Português",
  fr: "Français",
  de: "Deutsch",
  es: "Español",
  it: "Italiano",
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
        "aldock brings clarity to marina management — from berth reservations to guest communications. We believe booking a slip should feel as calm as a morning on the water.",
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
      heading: "Find a berth",
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
        `No Class ${cls} berths modeled yet in this schematic — larger vessel classes are coming in a future pass.`,
      noAvailable: "No available berths match your dates — try different dates.",
      noFit:
        "No berth class fits a vessel this length in our current tariff (max 45 m) — please contact the marina directly.",
      seasonBoth: (low, high) =>
        `Your stay spans both seasons — ${low} night${low === 1 ? "" : "s"} low season, ${high} night${high === 1 ? "" : "s"} high season.`,
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
        `+ ${rate}% VAT and utilities — estimate, confirm with marina.`,
      ctaHeading: (marinaName) => `Questions about a berth at ${marinaName}?`,
      ctaButton: "Contact marina",
      mailSubject: "Berth request — Marina de Cascais",
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
  },
  pt: {
    nav: {
      home: "Início",
      marinas: "Marinas",
      aboutUs: "Sobre nós",
      contact: "Contacto",
      search: "Pesquisar",
      openMenu: "Abrir menu",
      closeMenu: "Fechar menu",
    },
    footer: {
      tagline: "Reservas de marina, simplificadas.",
      company: "Empresa",
      product: "Produto",
      contact: "Contacto",
      aboutUs: "Sobre nós",
      marinas: "Marinas",
      copyright: (year) => `© ${year} aldock. Todos os direitos reservados.`,
    },
    home: {
      tagline: "Reservas de marina, simplificadas.",
      valueProp:
        "Encontre e reserve um lugar de amarração nas marinas de Portugal.",
      browseMarinas: "Ou explore as marinas",
      aboutHeading: "Uma experiência de marina, reinventada",
      aboutBody:
        "A aldock traz clareza à gestão de marinas — desde reservas de lugares de amarração até à comunicação com os visitantes. Acreditamos que reservar um lugar deve ser tão tranquilo como uma manhã em água calma.",
      contactHeading: "Fale connosco",
      contactBody:
        "Dúvidas sobre lugares de amarração, reservas ou parcerias? Adoraríamos ouvi-lo.",
      destinationLabel: "Para onde vai?",
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
      none: "Nenhuma marina corresponde à pesquisa. Experimente uma marina, região ou país.",
      from: "desde",
    },
    homeSearch: {
      arrival: "Chegada",
      departure: "Partida",
      boatLength: "Comprimento do barco (m)",
      searchButton: "Procurar lugares",
    },
    countryPage: {
      heading: (country) => `Marinas em ${country}`,
      viewMarina: "Ver marina →",
    },
    breadcrumbs: {
      marinas: "Marinas",
    },
    berthSearch: {
      heading: "Encontrar um lugar de amarração",
      subheading: (marinaName) =>
        `Consulte a disponibilidade simulada em ${marinaName}.`,
      illustrative: "A disponibilidade apresentada é meramente ilustrativa, por agora.",
      arrival: "Chegada",
      departure: "Partida",
      boatLength: "Comprimento do barco (m)",
      lengthPlaceholder: "ex. 7",
      searchButton: "Procurar",
      errorLength: "Indique o comprimento do seu barco em metros.",
      errorDates: "Escolha uma data de chegada e de partida.",
      errorDeparture: "A partida deve ser posterior à chegada.",
      noClass: (cls) =>
        `Ainda não existem lugares da Classe ${cls} neste esquema — classes de embarcações maiores serão adicionadas brevemente.`,
      noAvailable: "Não há lugares disponíveis para estas datas — tente outras datas.",
      noFit:
        "Nenhuma classe de lugar é adequada a uma embarcação com este comprimento no nosso tarifário atual (máx. 45 m) — contacte a marina diretamente.",
      seasonBoth: (low, high) =>
        `A sua estadia abrange as duas épocas — ${low} noite${low === 1 ? "" : "s"} em época baixa, ${high} noite${high === 1 ? "" : "s"} em época alta.`,
      seasonHigh: "As suas datas correspondem à época alta (abr.–set.).",
      seasonLow: "As suas datas correspondem à época baixa (jan.–mar. e out.–dez.).",
      legendAvailable: "Disponível e compatível",
      legendOccupied: "Ocupado",
      legendUnfit: "Não compatível com o seu barco",
      legendNeutral: "Ainda sem pesquisa",
      hintBeforeSearch:
        "Indique as suas datas e o comprimento do barco e pesquise para ver a disponibilidade.",
      priceBerthLine: (id, cls, nights) =>
        `Lugar ${id} · Classe ${cls} · ${nights} noite${nights === 1 ? "" : "s"}`,
      vatNote: (rate) =>
        `+ ${rate}% de IVA e consumos — estimativa, a confirmar com a marina.`,
      ctaHeading: (marinaName) => `Tem dúvidas sobre um lugar em ${marinaName}?`,
      ctaButton: "Contactar a marina",
      mailSubject: "Pedido de lugar de amarração — Marina de Cascais",
      mailGreeting: "Boa tarde,",
      mailIntro:
        "Gostaria de saber mais sobre a disponibilidade de lugares na Marina de Cascais.",
      mailArrival: "Chegada",
      mailDeparture: "Partida",
      mailBoatLength: "Comprimento do barco",
      mailBerth: "Lugar de interesse",
      mailSignoff: "Obrigado,",
    },
    rates: {
      eyebrow: "Tarifário",
      heading: "Tarifas de trânsito",
      colClass: "Classe",
      colLength: "Intervalo de comprimento",
      colLow: "Época baixa €/noite",
      colHigh: "Época alta €/noite",
      caption: (vat) =>
        `Tarifas base por noite, sem IVA (${vat}%) nem consumos. Época: baixa = jan.–mar. e out.–dez.; alta = abr.–set.`,
      upTo: (max) => `Até ${max} m`,
    },
    about: {
      eyebrow: "Sobre",
    },
    contact: {
      heading: "Contacto",
      phone: "Telefone",
      email: "Email",
    },
    visiting: {
      heading: "Visitar a marina",
      hailing: "Chamada rádio",
      vhfChannel: (n) => `Canal VHF ${n}`,
      officeHours: "Horário de funcionamento",
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
      heading: "Dados principais",
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
      pumpOut: "Pump-out",
      laundry: "Lavandaria",
      security24h: "Segurança 24 horas",
      wifi: "Wifi",
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

// TODO(i18n): FR / DE / ES / IT cover navigation, footer, home CTAs, the
// search labels, rate-table headings and the new contact/units/favourites
// labels. Everything else falls back to English until fully translated.
// TODO(i18n): nautical wording (berth, VHF, transient rates) should get a
// native-speaker check.
const fr: DeepPartial<Dictionary> = {
  nav: {
    home: "Accueil",
    marinas: "Marinas",
    aboutUs: "À propos",
    contact: "Contact",
    search: "Rechercher",
    openMenu: "Ouvrir le menu",
    closeMenu: "Fermer le menu",
  },
  footer: {
    tagline: "Réservations de marina, simplifiées.",
    company: "Société",
    product: "Produit",
    contact: "Contact",
    aboutUs: "À propos",
    marinas: "Marinas",
    copyright: (year) => `© ${year} aldock. Tous droits réservés.`,
  },
  home: {
    tagline: "Réservations de marina, simplifiées.",
    valueProp:
      "Trouvez et réservez un emplacement dans les marinas du Portugal.",
    browseMarinas: "Ou parcourez les marinas",
    destinationLabel: "Où allez-vous ?",
    destinationPlaceholder: "Marina, région ou pays",
    addFilters: "Ajouter dates et longueur",
    hideFilters: "Masquer dates et longueur",
    findMarinas: "Trouver des marinas",
    featuredHeading: "Marina à la une",
    moreMarinas: "Autres marinas",
  },
  results: {
    heading: "Marinas",
    forQuery: (query) => `Marinas pour « ${query} »`,
    count: (n) => `${n} ${n === 1 ? "marina" : "marinas"}`,
    none: "Aucune marina ne correspond. Essayez une marina, une région ou un pays.",
    from: "dès",
  },
  homeSearch: {
    arrival: "Arrivée",
    departure: "Départ",
    boatLength: "Longueur du bateau (m)",
    searchButton: "Rechercher un emplacement",
  },
  countryPage: {
    heading: (country) => `Marinas : ${country}`,
    viewMarina: "Voir la marina →",
  },
  breadcrumbs: { marinas: "Marinas" },
  berthSearch: {
    heading: "Trouver un emplacement",
    arrival: "Arrivée",
    departure: "Départ",
    boatLength: "Longueur du bateau (m)",
    searchButton: "Rechercher",
    illustrative:
      "La disponibilité des emplacements affichée est à titre indicatif pour le moment.",
    ctaButton: "Contacter la marina",
  },
  rates: {
    eyebrow: "Tarifs",
    heading: "Tarifs des places de passage",
    colClass: "Classe",
    colLength: "Longueur",
    colLow: "Basse saison €/nuit",
    colHigh: "Haute saison €/nuit",
  },
  contact: { heading: "Contact", phone: "Téléphone", email: "E-mail" },
  facilities: { heading: "Services et équipements" },
  language: { label: "Langue" },
  units: { label: "Unités", metric: "Mètres", imperial: "Pieds" },
  dock: {
    open: "Contacter la marina",
    close: "Fermer",
    heading: "Contacter la marina",
    call: "Appeler",
    vhf: "Canal VHF",
    email: "E-mail",
    message: "Écrire à la marina",
  },
  favourites: {
    save: "Enregistrer la marina",
    saved: "Enregistrée",
    savedHeading: "Vos marinas enregistrées",
  },
};

const de: DeepPartial<Dictionary> = {
  nav: {
    home: "Startseite",
    marinas: "Marinas",
    aboutUs: "Über uns",
    contact: "Kontakt",
    search: "Suche",
    openMenu: "Menü öffnen",
    closeMenu: "Menü schließen",
  },
  footer: {
    tagline: "Marina-Buchungen, einfach gemacht.",
    company: "Unternehmen",
    product: "Produkt",
    contact: "Kontakt",
    aboutUs: "Über uns",
    marinas: "Marinas",
    copyright: (year) => `© ${year} aldock. Alle Rechte vorbehalten.`,
  },
  home: {
    tagline: "Marina-Buchungen, einfach gemacht.",
    valueProp:
      "Finden und buchen Sie einen Liegeplatz in Portugals Marinas.",
    browseMarinas: "Oder Marinas durchsuchen",
    destinationLabel: "Wohin soll es gehen?",
    destinationPlaceholder: "Marina, Region oder Land",
    addFilters: "Daten und Bootslänge hinzufügen",
    hideFilters: "Daten und Bootslänge ausblenden",
    findMarinas: "Marinas finden",
    featuredHeading: "Empfohlene Marina",
    moreMarinas: "Weitere Marinas",
  },
  results: {
    heading: "Marinas",
    forQuery: (query) => `Marinas für „${query}“`,
    count: (n) => `${n} ${n === 1 ? "Marina" : "Marinas"}`,
    none: "Keine Marina passt zur Suche. Versuchen Sie eine Marina, Region oder ein Land.",
    from: "ab",
  },
  homeSearch: {
    arrival: "Ankunft",
    departure: "Abreise",
    boatLength: "Bootslänge (m)",
    searchButton: "Liegeplätze suchen",
  },
  countryPage: {
    heading: (country) => `Marinas in ${country}`,
    viewMarina: "Marina ansehen →",
  },
  breadcrumbs: { marinas: "Marinas" },
  berthSearch: {
    heading: "Liegeplatz finden",
    arrival: "Ankunft",
    departure: "Abreise",
    boatLength: "Bootslänge (m)",
    searchButton: "Suchen",
    illustrative:
      "Die angezeigte Liegeplatzverfügbarkeit ist vorerst nur beispielhaft.",
    ctaButton: "Marina kontaktieren",
  },
  rates: {
    eyebrow: "Preise",
    heading: "Preise für Gastliegeplätze",
    colClass: "Klasse",
    colLength: "Längenbereich",
    colLow: "Nebensaison €/Nacht",
    colHigh: "Hauptsaison €/Nacht",
  },
  contact: { heading: "Kontakt", phone: "Telefon", email: "E-Mail" },
  facilities: { heading: "Ausstattung und Service" },
  language: { label: "Sprache" },
  units: { label: "Einheiten", metric: "Meter", imperial: "Fuß" },
  dock: {
    open: "Marina kontaktieren",
    close: "Schließen",
    heading: "Marina kontaktieren",
    call: "Anrufen",
    vhf: "UKW-Kanal",
    email: "E-Mail",
    message: "Marina anschreiben",
  },
  favourites: {
    save: "Marina merken",
    saved: "Gemerkt",
    savedHeading: "Ihre gemerkten Marinas",
  },
};

const es: DeepPartial<Dictionary> = {
  nav: {
    home: "Inicio",
    marinas: "Marinas",
    aboutUs: "Sobre nosotros",
    contact: "Contacto",
    search: "Buscar",
    openMenu: "Abrir menú",
    closeMenu: "Cerrar menú",
  },
  footer: {
    tagline: "Reservas de marina, simplificadas.",
    company: "Empresa",
    product: "Producto",
    contact: "Contacto",
    aboutUs: "Sobre nosotros",
    marinas: "Marinas",
    copyright: (year) => `© ${year} aldock. Todos los derechos reservados.`,
  },
  home: {
    tagline: "Reservas de marina, simplificadas.",
    valueProp: "Encuentra y reserva un amarre en las marinas de Portugal.",
    browseMarinas: "O explora las marinas",
    destinationLabel: "¿A dónde vas?",
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
    none: "Ninguna marina coincide con la búsqueda. Prueba con una marina, región o país.",
    from: "desde",
  },
  homeSearch: {
    arrival: "Llegada",
    departure: "Salida",
    boatLength: "Eslora del barco (m)",
    searchButton: "Buscar amarres",
  },
  countryPage: {
    heading: (country) => `Marinas en ${country}`,
    viewMarina: "Ver marina →",
  },
  breadcrumbs: { marinas: "Marinas" },
  berthSearch: {
    heading: "Encontrar un amarre",
    arrival: "Llegada",
    departure: "Salida",
    boatLength: "Eslora del barco (m)",
    searchButton: "Buscar",
    illustrative:
      "La disponibilidad de amarres mostrada es meramente ilustrativa por ahora.",
    ctaButton: "Contactar con la marina",
  },
  rates: {
    eyebrow: "Tarifas",
    heading: "Tarifas de amarre en tránsito",
    colClass: "Clase",
    colLength: "Rango de eslora",
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
};

const it: DeepPartial<Dictionary> = {
  nav: {
    home: "Home",
    marinas: "Marine",
    aboutUs: "Chi siamo",
    contact: "Contatti",
    search: "Cerca",
    openMenu: "Apri il menu",
    closeMenu: "Chiudi il menu",
  },
  footer: {
    tagline: "Prenotazioni in marina, semplificate.",
    company: "Azienda",
    product: "Prodotto",
    contact: "Contatti",
    aboutUs: "Chi siamo",
    marinas: "Marine",
    copyright: (year) => `© ${year} aldock. Tutti i diritti riservati.`,
  },
  home: {
    tagline: "Prenotazioni in marina, semplificate.",
    valueProp:
      "Trova e prenota un posto barca nelle marine del Portogallo.",
    browseMarinas: "Oppure sfoglia le marine",
    destinationLabel: "Dove stai andando?",
    destinationPlaceholder: "Marina, regione o paese",
    addFilters: "Aggiungi date e lunghezza",
    hideFilters: "Nascondi date e lunghezza",
    findMarinas: "Trova marine",
    featuredHeading: "Marina in evidenza",
    moreMarinas: "Altre marine",
  },
  results: {
    heading: "Marine",
    forQuery: (query) => `Marine per «${query}»`,
    count: (n) => `${n} ${n === 1 ? "marina" : "marine"}`,
    none: "Nessuna marina corrisponde alla ricerca. Prova con una marina, una regione o un paese.",
    from: "da",
  },
  homeSearch: {
    arrival: "Arrivo",
    departure: "Partenza",
    boatLength: "Lunghezza della barca (m)",
    searchButton: "Cerca posti barca",
  },
  countryPage: {
    heading: (country) => `Marine in ${country}`,
    viewMarina: "Vedi la marina →",
  },
  breadcrumbs: { marinas: "Marine" },
  berthSearch: {
    heading: "Trova un posto barca",
    arrival: "Arrivo",
    departure: "Partenza",
    boatLength: "Lunghezza della barca (m)",
    searchButton: "Cerca",
    illustrative:
      "La disponibilità dei posti barca mostrata è per ora solo indicativa.",
    ctaButton: "Contatta la marina",
  },
  rates: {
    eyebrow: "Tariffe",
    heading: "Tariffe posti barca di transito",
    colClass: "Classe",
    colLength: "Intervallo di lunghezza",
    colLow: "Bassa stagione €/notte",
    colHigh: "Alta stagione €/notte",
  },
  contact: { heading: "Contatti", phone: "Telefono", email: "E-mail" },
  facilities: { heading: "Servizi e strutture" },
  language: { label: "Lingua" },
  units: { label: "Unità", metric: "Metri", imperial: "Piedi" },
  dock: {
    open: "Contatta la marina",
    close: "Chiudi",
    heading: "Contatta la marina",
    call: "Chiama",
    vhf: "Canale VHF",
    email: "E-mail",
    message: "Scrivi alla marina",
  },
  favourites: {
    save: "Salva marina",
    saved: "Salvata",
    savedHeading: "Le tue marine salvate",
  },
};

export const translations: Record<Locale, Dictionary> = {
  en: baseTranslations.en,
  pt: baseTranslations.pt,
  fr: mergeDictionary(baseTranslations.en, fr),
  de: mergeDictionary(baseTranslations.en, de),
  es: mergeDictionary(baseTranslations.en, es),
  it: mergeDictionary(baseTranslations.en, it),
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
