import type { Dictionary } from "../../types";

export const rates: Dictionary["rates"] = {
  heading: "Tarifas de tránsito",
  colClass: "Clase",
  colLength: "Eslora",
  colLow: "Temporada baja, €/noche",
  colHigh: "Temporada alta, €/noche",
  caption: (vat) =>
    `Tarifas base por noche, sin ${vat} % de IVA ni consumos. Temporada baja: de enero a marzo y de octubre a diciembre. Temporada alta: de abril a septiembre.`,
  upTo: (max) => `Hasta ${max} m`,
};
