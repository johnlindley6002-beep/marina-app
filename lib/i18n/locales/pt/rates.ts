import type { Dictionary } from "../../types";

export const rates: Dictionary["rates"] = {
  eyebrow: "Tarifário",
  heading: "Tarifas de trânsito",
  colClass: "Classe",
  colLength: "Comprimento",
  colLow: "Época baixa €/noite",
  colHigh: "Época alta €/noite",
  caption: (vat) =>
    `Tarifas base por noite, sem IVA (${vat}%) nem consumos. Época baixa: jan.–mar. e out.–dez. Época alta: abr.–set.`,
  upTo: (max) => `Até ${max} m`,
};
