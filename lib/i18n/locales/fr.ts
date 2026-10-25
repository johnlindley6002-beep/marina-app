import type { DeepPartial, Dictionary } from "../types";

export const fr: DeepPartial<Dictionary> = {
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
    valueProp: "Trouvez et réservez votre place de port dans les marinas du Portugal.",
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
