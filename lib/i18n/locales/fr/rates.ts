import type { Dictionary } from "../../types";

export const rates: Dictionary["rates"] = {
  heading: "Tarifs de passage",
  colClass: "Classe",
  colLength: "Longueur",
  colLow: "Basse saison, €/nuit",
  colHigh: "Haute saison, €/nuit",
  caption: (vat) =>
    `Tarifs de base par nuit, hors TVA de ${vat}\u00A0% et consommations. Basse saison : de janvier à mars et d'octobre à décembre. Haute saison : d'avril à septembre.`,
  upTo: (max) => `Jusqu'à ${max} m`,
};
