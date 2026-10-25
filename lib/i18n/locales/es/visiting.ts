import type { Dictionary } from "../../types";

export const visiting: Dictionary["visiting"] = {
  heading: "Visitar la marina",
  hailing: "Llamada por radio",
  vhfChannel: (n) => `Canal VHF ${n}`,
  officeHours: "Horario de oficina",
  summer: "Verano",
  winter: "Invierno",
  onArrival: "A la llegada",
  byCar: "En coche",
  byTrain: "En tren",
  byAir: "En avión",
  maxLength: "Eslora máxima",
  maxDraft: "Calado máximo",
};
