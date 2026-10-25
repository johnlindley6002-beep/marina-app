import type { Dictionary } from "../../types";

export const footer: Dictionary["footer"] = {
  tagline: "Réservation de places de port, sans complications",
  company: "Société",
  product: "Produit",
  contact: "Contact",
  aboutUs: "À propos",
  marinas: "Marinas",
  copyright: (year) => `© ${year} aldock. Tous droits réservés.`,
};
