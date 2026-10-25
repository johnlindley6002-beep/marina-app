import type { Dictionary } from "../../types";

export const footer: Dictionary["footer"] = {
  tagline: "Marina bookings, simplified.",
  company: "Company",
  product: "Product",
  contact: "Contact",
  aboutUs: "About us",
  marinas: "Marinas",
  copyright: (year) => `© ${year} aldock. All rights reserved.`,
};
