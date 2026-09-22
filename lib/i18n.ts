import type { FacilityKey } from "../data/marinas";

export type Locale = "en" | "pt";

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
    aboutEyebrow: string;
    aboutHeading: string;
    aboutBody: string;
    exploreEyebrow: string;
    exploreHeading: string;
    cardMarinasTitle: string;
    cardMarinasDesc: string;
    cardAboutTitle: string;
    cardAboutDesc: string;
    cardContactTitle: string;
    cardContactDesc: string;
    contactEyebrow: string;
    contactHeading: string;
    contactBody: string;
  };
  homeSearch: {
    arrival: string;
    departure: string;
    boatLength: string;
    searchButton: string;
  };
  marinasList: {
    eyebrow: string;
    heading: string;
    viewMarinas: string;
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
  hero: {
    photoLabel: string;
  };
};

export const translations: Record<Locale, Dictionary> = {
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
      aboutEyebrow: "About us",
      aboutHeading: "A marina experience, reimagined",
      aboutBody:
        "aldock brings clarity to marina management — from berth reservations to guest communications. We believe booking a slip should feel as calm as a morning on the water.",
      exploreEyebrow: "Explore",
      exploreHeading: "Find your way around",
      cardMarinasTitle: "Marinas",
      cardMarinasDesc: "Browse marinas by country and find your next berth.",
      cardAboutTitle: "About us",
      cardAboutDesc: "What aldock is, and why we're building it.",
      cardContactTitle: "Contact",
      cardContactDesc: "Questions about bookings or partnerships? Reach out.",
      contactEyebrow: "Contact",
      contactHeading: "Get in touch",
      contactBody:
        "Questions about berths, bookings, or partnerships? We'd love to hear from you.",
    },
    homeSearch: {
      arrival: "Arrival",
      departure: "Departure",
      boatLength: "Boat length (m)",
      searchButton: "Search berths",
    },
    marinasList: {
      eyebrow: "Marinas",
      heading: "Choose a country",
      viewMarinas: "View marinas →",
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
    hero: {
      photoLabel: "Photo",
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
      aboutEyebrow: "Sobre nós",
      aboutHeading: "Uma experiência de marina, reinventada",
      aboutBody:
        "A aldock traz clareza à gestão de marinas — desde reservas de lugares de amarração até à comunicação com os visitantes. Acreditamos que reservar um lugar deve ser tão tranquilo como uma manhã em água calma.",
      exploreEyebrow: "Explorar",
      exploreHeading: "Oriente-se",
      cardMarinasTitle: "Marinas",
      cardMarinasDesc:
        "Explore marinas por país e encontre o seu próximo lugar de amarração.",
      cardAboutTitle: "Sobre nós",
      cardAboutDesc: "O que é a aldock e porque a estamos a construir.",
      cardContactTitle: "Contacto",
      cardContactDesc: "Dúvidas sobre reservas ou parcerias? Contacte-nos.",
      contactEyebrow: "Contacto",
      contactHeading: "Fale connosco",
      contactBody:
        "Dúvidas sobre lugares de amarração, reservas ou parcerias? Adoraríamos ouvi-lo.",
    },
    homeSearch: {
      arrival: "Chegada",
      departure: "Partida",
      boatLength: "Comprimento do barco (m)",
      searchButton: "Procurar lugares",
    },
    marinasList: {
      eyebrow: "Marinas",
      heading: "Escolha um país",
      viewMarinas: "Ver marinas →",
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
    hero: {
      photoLabel: "Foto",
    },
  },
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
