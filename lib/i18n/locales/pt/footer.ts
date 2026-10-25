import type { Dictionary } from "../../types";

export const footer: Dictionary["footer"] = {
  tagline: "Reservas de postos de amarração, sem complicações",
  company: "Empresa",
  product: "Produto",
  contact: "Contactos",
  aboutUs: "Sobre nós",
  marinas: "Marinas",
  copyright: (year) => `© ${year} aldock. Todos os direitos reservados.`,
};
