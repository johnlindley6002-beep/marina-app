import type { Dictionary } from "../../types";

export const rates: Dictionary["rates"] = {
  eyebrow: "Rates",
  heading: "Transient berth rates",
  colClass: "Class",
  colLength: "Length range",
  colLow: "Low season €/night",
  colHigh: "High season €/night",
  caption: (vat) =>
    `Base rates per night, excl. ${vat}% VAT and utilities. Season: low = Jan–Mar & Oct–Dec, high = Apr–Sep.`,
  upTo: (max) => `Up to ${max} m`,
};
