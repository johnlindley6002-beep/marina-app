import type { Dictionary } from "../../types";

export const visiting: Dictionary["visiting"] = {
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
};
