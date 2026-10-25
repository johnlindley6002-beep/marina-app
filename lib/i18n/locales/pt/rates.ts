import type { Dictionary } from "../../types";

export const rates: Dictionary["rates"] = {
  heading: "Tarifas de trânsito",
  colClass: "Classe",
  colLength: "Comprimento",
  colLow: "Época baixa €/noite",
  colHigh: "Época alta €/noite",
  caption: (vat) =>
    `Tarifas base por noite, sem IVA (${vat}%) nem consumos. Época baixa: de janeiro a março e de outubro a dezembro. Época alta: de abril a setembro.`,
  upTo: (max) => `Até ${max} m`,
};
