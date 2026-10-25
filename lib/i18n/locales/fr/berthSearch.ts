import type { Dictionary } from "../../types";
import { plural } from "../../format";

export const berthSearch: Dictionary["berthSearch"] = {
  heading: "Places de port disponibles",
  subheading: (marinaName) => `Consultez le plan des places de port de ${marinaName}.`,
  illustrative: "Données de démonstration. La capitainerie confirme la disponibilité.",
  arrival: "Arrivée",
  departure: "Départ",
  boatLength: "Longueur hors tout (m)",
  lengthPlaceholder: "p. ex. 7",
  searchButton: "Chercher",
  errorLength: "Indiquez la longueur de votre bateau en mètres.",
  errorDates: "Choisissez une date d'arrivée et une date de départ.",
  errorDeparture: "Le départ doit être postérieur à l'arrivée.",
  noClass: (cls) =>
    `Ce plan n'affiche pas encore de places de classe ${cls}. Contactez la capitainerie pour un bateau plus grand.`,
  noAvailable: "Aucune place n'est libre à ces dates. Essayez d'autres dates.",
  noFit:
    "Aucune classe de place ne convient à un bateau de cette longueur dans le tarif actuel (maximum 45 m). Contactez la capitainerie.",
  seasonBoth: (low, high) =>
    `Votre séjour couvre les deux saisons : ${low} ${plural("fr", low, { one: "nuit", other: "nuits" })} en basse saison et ${high} ${plural("fr", high, { one: "nuit", other: "nuits" })} en haute saison.`,
  seasonHigh: "Vos dates sont en haute saison (d'avril à septembre).",
  seasonLow: "Vos dates sont en basse saison (de janvier à mars et d'octobre à décembre).",
  legendAvailable: "Disponible et adaptée",
  legendOccupied: "Occupée",
  legendUnfit: "Ne convient pas à votre bateau",
  legendNeutral: "Pas encore recherché",
  hintBeforeSearch: "Indiquez vos dates et la longueur de votre bateau, puis lancez la recherche.",
  priceBerthLine: (id, cls, nights) =>
    `Place ${id} · Classe ${cls} · ${nights} ${plural("fr", nights, { one: "nuit", other: "nuits" })}`,
  vatNote: (rate) =>
    `Plus ${rate}\u00A0% de TVA et consommations. Prix indicatif, confirmé par la capitainerie.`,
  ctaHeading: (marinaName) => `Une question sur une place à ${marinaName}\u00A0?`,
  ctaButton: "Contacter la capitainerie",
  mailSubject: "Demande de place de port - Marina de Cascais",
  mailGreeting: "Bonjour,",
  mailIntro:
    "Je souhaite me renseigner sur la disponibilité des places de port à la Marina de Cascais.",
  mailArrival: "Arrivée",
  mailDeparture: "Départ",
  mailBoatLength: "Longueur du bateau",
  mailBerth: "Place souhaitée",
  mailSignoff: "Cordialement,",
};
