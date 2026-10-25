import type { Dictionary } from "../../types";

export const footer: Dictionary["footer"] = {
  tagline: "Reservas de amarres, sin complicaciones",
  company: "Empresa",
  product: "Producto",
  contact: "Contacto",
  aboutUs: "Sobre nosotros",
  marinas: "Marinas",
  copyright: (year) => `© ${year} aldock. Todos los derechos reservados.`,
};
