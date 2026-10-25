import type { Dictionary } from "../../types";

export const rates: Dictionary["rates"] = {
  heading: "Transient berth rates",
  colClass: "Class",
  colLength: "Length range",
  colLow: "Low season €/night",
  colHigh: "High season €/night",
  caption: (vat) =>
    `Base rates per night, excluding ${vat}% VAT and utilities. Low season runs from January to March and October to December. High season runs from April to September.`,
  upTo: (max) => `Up to ${max} m`,
};
