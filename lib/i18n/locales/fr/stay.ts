import type { Dictionary } from "../../types";
import { plural } from "../../format";

const night = (n: number) => plural("fr", n, { one: "nuit", other: "nuits" });

export const stay: Dictionary["stay"] = {
  season: {
    low: "Basse saison (de janvier à mars et d'octobre à décembre)",
    high: "Haute saison (d'avril à septembre)",
    both: "les deux saisons",
  },
  plan: {
    heading: "Préparez votre séjour",
    intro:
      "Les dates et les dimensions du bateau déterminent le plan, l'estimation et la demande ci-dessous.",
    arrivalDate: "Date d'arrivée",
    departureDate: "Date de départ",
    lengthOverall: (unit) => `Longueur hors tout (${unit})`,
    lengthHint: "Bout-dehors, bossoirs et annexe compris",
    beam: (unit) => `Largeur (${unit})`,
    draft: (unit) => `Tirant d'eau (${unit})`,
    dimensionError: "Saisissez un nombre supérieur à 0, par exemple 12,5.",
    departureAfterArrival:
      "Le départ doit être postérieur à l'arrivée. Choisissez une date de départ plus tardive.",
    openEnded: "Séjour sans date de départ",
    sizesDiffer: (boat) => `Ces dimensions diffèrent de celles enregistrées pour ${boat}.`,
    updateSavedBoat: "Mettre à jour le bateau enregistré",
    usingSaved: (boat) => `Votre bateau enregistré est utilisé : ${boat}.`,
    manageBoat: "Gérer dans Mon bateau",
    saveLead: "Enregistrez votre bateau dans",
    saveLink: "Mon bateau",
    saveTail: "et ces dimensions seront préremplies la prochaine fois.",
    stayOpenEnded: "Séjour sans date de départ, tarifé et recherché à la nuit.",
    stayBothSeasons: (nights, low, high) =>
      `${nights} nuits, sur les deux saisons (${low} en basse saison, ${high} en haute saison).`,
    staySingleSeason: (nights, season) => `${nights} ${night(nights)}, ${season}.`,
    stayEnterDates: "Saisissez vos dates d'arrivée et de départ.",
    stayLabel: "Séjour : ",
  },
  decision: {
    fitQuestion: "Mon bateau a-t-il sa place ?",
    spaceQuestion: "Y a-t-il de la place ?",
    costQuestion: "Combien ça coûte ?",
    notChecked: "Non vérifié",
    notCheckedYet: "Pas encore vérifié",
    askMarina: "Demandez à la capitainerie",
    notEstimatedYet: "Pas encore estimé",
    enterDimensions: "Saisissez la longueur, la largeur et le tirant d'eau.",
    fitYes: "Oui, il rentre",
    fitNo: "Non, pas sur les places standard",
    fitDetail: (cls, length) =>
      `Place de classe ${cls} pour ${length}. La largeur et le tirant d'eau respectent les limites de la marina.`,
    fitMegaYacht: "C'est la place réservée aux méga-yachts, sur le ponton extérieur.",
    reasonLength: "Plus long que les places standard. Contactez la capitainerie.",
    reasonBeam: (beam) =>
      `Votre largeur de ${beam} dépasse celle de la place standard pour cette longueur. Contactez la capitainerie.`,
    reasonDraft: (draft, max) =>
      `Votre tirant d'eau de ${draft} dépasse le maximum de la marina, ${max}. Contactez la capitainerie.`,
    spaceNoFit: "Les places standard ne conviennent pas à votre bateau.",
    enterDatesAndLength: "Saisissez vos dates et la longueur hors tout.",
    outsideClasses: "Votre longueur est hors des classes de places standard.",
    noPlan: (cls) =>
      `Le plan de démonstration n'affiche pas encore de places de classe ${cls}. La capitainerie confirme la disponibilité par e-mail.`,
    spaceYes: "Oui, des places sont disponibles",
    spaceNone: "Aucune place affichée pour votre taille",
    availabilityNote:
      "Données de démonstration, pas en temps réel. La capitainerie confirme la disponibilité par e-mail.",
    costContact: "Contactez la capitainerie pour un devis.",
    costAbout: (amount) => `Environ ${amount}`,
    costAboutFirstNight: (amount) => `Environ ${amount} pour la première nuit`,
    nightlyRate: "Tarif à la nuit",
    nightsCount: (n) => `${n} ${night(n)}`,
    costDetail: (period, cls, vat) =>
      `${period}, classe ${cls}, hors TVA de ${vat} % et consommations.`,
    seeBreakdown: "Voir le détail",
    costOutsideClasses:
      "Votre longueur est hors des classes standard. Contactez la capitainerie pour un devis.",
    promptDates:
      "Ajoutez vos dates pour voir si le bateau rentre, s'il y a de la place et le prix.",
    promptDatesAndLength:
      "Ajoutez vos dates et la longueur hors tout pour voir si le bateau rentre, s'il y a de la place et le prix.",
    promptLength:
      "Ajoutez la longueur hors tout pour voir si le bateau rentre, s'il y a de la place et le prix.",
  },
  estimate: {
    heading: "Votre estimation",
    fromLine: (price) =>
      `À partir de ${price} la nuit, selon la longueur du bateau et la saison. Ajoutez vos dates et la longueur hors tout pour obtenir votre estimation.`,
    extras: "Options",
    extrasHint: "Choisissez ce dont vous avez besoin. Chaque option s'ajoute au détail ci-dessous.",
    shorePower: "Électricité à quai",
    shorePowerHint: (amps) => `Au compteur, facturée à la consommation (jusqu'à ${amps} A)`,
    amperageLabel: "Ampérage de l'électricité",
    amperagePlaceholder: "Ampérage…",
    amperageError: "Choisissez l'ampérage de l'électricité, par exemple 16 A ou 32 A.",
    water: "Eau",
    waterHint: "Au compteur, facturée à la consommation",
    pumpOut: "Vidange des eaux usées",
    pumpOutHint: (price) => `${price} par opération`,
    perOperation: "Par opération",
    fuel: "Carburant à l'arrivée",
    diesel: (price) => `Gazole ${price}/L`,
    petrol: (price) => `Essence 95 ${price}/L`,
    fuelPrices: (prices) => `${prices}, facturé au quai carburant`,
    fuelAtDock: "Gazole et essence, prix au quai carburant",
    laundry: "Laverie",
    laundryHint: (wash, dry) => `Lavage ${wash}, séchage ${dry} par cycle, jetons à l'accueil`,
    busyPeriod: "Période de forte affluence, la disponibilité peut donc être réduite.",
    classBerth: (cls) => `Place de classe ${cls}`,
    nightlyOpenEnded: "tarif à la nuit (séjour sans date de départ)",
    berthId: (id) => `Place ${id}`,
    nightsAtRate: (nights, rate) => `${nights} ${night(nights)} à ${rate} la nuit`,
    berthSubtotal: "Sous-total de la place",
    totalFirstNight: "Première nuit estimée",
    total: "Total estimé",
    vatNote: (vat) =>
      `Hors TVA de ${vat} % et consommations. Prix indicatif, confirmé par la capitainerie.`,
    requestBerth: "Demander une place",
    requestNote: "Cela envoie une demande. La capitainerie confirme la disponibilité par e-mail.",
    outsideClasses:
      "Votre longueur est hors des classes de places standard. Contactez la capitainerie pour un devis.",
    enterDatesAndLength:
      "Saisissez ci-dessus vos dates et la longueur du bateau pour voir une estimation du prix.",
    allRates: "Tous les tarifs",
    hideRates: "Masquer les tarifs",
  },
  recap: {
    heading: "Votre séjour et votre départ",
    basedOn: (arrival, boat) =>
      `D'après votre dernière demande (${arrival}${boat ? `, ${boat}` : ""}), enregistrée sur cet appareil.`,
    settleUp: "Estimation du règlement",
    departureDate: "Date de départ",
    departureTime: "Heure de départ",
    chooseDeparture:
      "Choisissez une date de départ postérieure à l'arrivée pour voir l'estimation.",
    classSeason: (cls, season) => `Classe ${cls} · ${season}`,
    estimatedTotal: "Total estimé",
    estimateOnly: (vat) =>
      `Estimation uniquement, hors TVA de ${vat} % et consommations. La capitainerie confirme le total final.`,
    leaving: "Vous partez ? Prévenez la capitainerie",
    leavingNote: "Ouvre un e-mail prérempli avec votre bateau et votre départ.",
    notifyDeparture: "Signaler le départ",
    comingBack: "Vous revenez ?",
    comingBackNote: "Même bateau, mêmes services, dates laissées vides.",
    rebook: "Réserver à nouveau ce séjour",
  },
  wallet: {
    optional: "Tout est facultatif. Les documents sont présentés en personne à l'arrivée.",
    moreAbout: "En savoir plus sur l'enregistrement de ces informations",
    hide: "Masquer",
    moreAboutBody:
      "Enregistrez ces informations avec votre bateau pour les réutiliser, ou laissez-les vides et remettez-les au personnel de la marina. Seul le texte est conservé, dans ce navigateur.",
    bring: (min) =>
      `À apporter : le titre d'immatriculation du bateau (le Portugal exige les originaux, pas des copies plastifiées), l'attestation d'assurance responsabilité civile (minimum ${min}, de préférence avec un certificat en portugais) et le brevet du chef de bord.`,
    registrationNumber: "Numéro d'immatriculation",
    insuranceProvider: "Assureur",
    insurancePolicy: "Numéro de police",
    insuranceExpiry: "Expiration de l'assurance",
    expiresBefore: "Expire avant la date d'arrivée.",
    competence: "Brevet du chef de bord",
    vhfLicence: "Licence VHF",
    includeInEnquiry: "Inclure ces informations dans mon e-mail de demande",
  },
  arrival: {
    heading: "Vous arrivez aujourd'hui ?",
    intro: (marina) =>
      `Chaque bouton ouvre un e-mail prérempli pour ${marina}. Rien n'est envoyé avant que vous appuyiez sur envoyer.`,
    arrivingNow: "J'arrive maintenant",
    digitalCheckIn: "Enregistrement numérique",
  },
};
