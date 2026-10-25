import type { Dictionary } from "../../types";

export const visiting: Dictionary["visiting"] = {
  heading: "Visiter la marina",
  hailing: "Appel radio",
  vhfChannel: (n) => `Canal VHF ${n}`,
  officeHours: "Horaires du bureau",
  summer: "Été",
  winter: "Hiver",
  onArrival: "À l'arrivée",
  byCar: "En voiture",
  byTrain: "En train",
  byAir: "En avion",
  maxLength: "Longueur maximale",
  maxDraft: "Tirant d'eau maximal",
};
