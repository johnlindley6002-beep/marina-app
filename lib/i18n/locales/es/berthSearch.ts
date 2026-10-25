import type { Dictionary } from "../../types";
import { plural } from "../../format";

export const berthSearch: Dictionary["berthSearch"] = {
  heading: "Amarres disponibles",
  subheading: (marinaName) => `Consulte el plano de amarres de ${marinaName}.`,
  illustrative: "Datos de demostración. La marina confirma la disponibilidad.",
  arrival: "Llegada",
  departure: "Salida",
  boatLength: "Eslora total (m)",
  lengthPlaceholder: "p. ej. 7",
  searchButton: "Buscar",
  errorLength: "Indique la eslora de su barco en metros.",
  errorDates: "Elija una fecha de llegada y una de salida.",
  errorDeparture: "La salida debe ser posterior a la llegada.",
  noClass: (cls) =>
    `Este plano aún no muestra amarres de clase ${cls}. Contacte con la marina si su barco es más grande.`,
  noAvailable: "No hay amarres libres en esas fechas. Pruebe con otras fechas.",
  noFit:
    "Ninguna clase de amarre admite un barco de esta eslora en la tarifa actual (máximo 45 m). Contacte con la marina.",
  seasonBoth: (low, high) =>
    `Su estancia abarca las dos temporadas: ${low} ${plural("es", low, { one: "noche", other: "noches" })} en temporada baja y ${high} ${plural("es", high, { one: "noche", other: "noches" })} en temporada alta.`,
  seasonHigh: "Sus fechas están en temporada alta (de abril a septiembre).",
  seasonLow: "Sus fechas están en temporada baja (de enero a marzo y de octubre a diciembre).",
  legendAvailable: "Disponible y adecuado",
  legendOccupied: "Ocupado",
  legendUnfit: "No admite su barco",
  legendNeutral: "Aún sin buscar",
  hintBeforeSearch: "Indique sus fechas y la eslora de su barco y pulse Buscar.",
  priceBerthLine: (id, cls, nights) =>
    `Amarre ${id} · Clase ${cls} · ${nights} ${plural("es", nights, { one: "noche", other: "noches" })}`,
  vatNote: (rate) =>
    `Más ${rate} % de IVA y consumos. Precio orientativo, confirmado por la marina.`,
  ctaHeading: (marinaName) => `¿Dudas sobre un amarre en ${marinaName}?`,
  ctaButton: "Contactar con la marina",
  mailSubject: "Solicitud de amarre - Marina de Cascais",
  mailGreeting: "Buenos días,",
  mailIntro: "Querría consultar la disponibilidad de amarres en la Marina de Cascais.",
  mailArrival: "Llegada",
  mailDeparture: "Salida",
  mailBoatLength: "Eslora",
  mailBerth: "Amarre de interés",
  mailSignoff: "Gracias,",
};
