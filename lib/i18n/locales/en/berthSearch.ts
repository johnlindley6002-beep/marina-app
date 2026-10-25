import type { Dictionary } from "../../types";
import { plural } from "../../format";

export const berthSearch: Dictionary["berthSearch"] = {
  heading: "Available berths",
  subheading: (marinaName) => `Search the berth plan for ${marinaName}.`,
  illustrative: "Demo data. The marina confirms availability.",
  arrival: "Arrival",
  departure: "Departure",
  boatLength: "Boat length (m)",
  lengthPlaceholder: "e.g. 7",
  searchButton: "Search",
  errorLength: "Enter your boat's length in metres.",
  errorDates: "Choose an arrival and departure date.",
  errorDeparture: "Departure must be after arrival.",
  noClass: (cls) =>
    `This plan does not show Class ${cls} berths yet. Contact the marina for larger boats.`,
  noAvailable: "No berths are free for those dates. Try other dates.",
  noFit:
    "No berth class fits a boat this long in the current tariff (maximum 45 m). Contact the marina.",
  seasonBoth: (low, high) =>
    `Your stay spans both seasons: ${low} ${plural("en", low, { one: "night", other: "nights" })} in low season, ${high} ${plural("en", high, { one: "night", other: "nights" })} in high season.`,
  seasonHigh: "Your dates are in high season (April to September).",
  seasonLow: "Your dates are in low season (January to March, October to December).",
  legendAvailable: "Available and fits",
  legendOccupied: "Occupied",
  legendUnfit: "Does not fit your boat",
  legendNeutral: "Not searched yet",
  hintBeforeSearch: "Enter your dates and boat length, then search.",
  priceBerthLine: (id, cls, nights) =>
    `Berth ${id} · Class ${cls} · ${nights} ${plural("en", nights, { one: "night", other: "nights" })}`,
  vatNote: (rate) => `Plus ${rate}% VAT and utilities. Indicative price, confirmed by the marina.`,
  ctaHeading: (marinaName) => `Questions about a berth at ${marinaName}?`,
  ctaButton: "Contact the marina",
  mailSubject: "Berth request - Marina de Cascais",
  mailGreeting: "Hello,",
  mailIntro: "I'd like to enquire about berth availability at Marina de Cascais.",
  mailArrival: "Arrival",
  mailDeparture: "Departure",
  mailBoatLength: "Boat length",
  mailBerth: "Berth of interest",
  mailSignoff: "Thanks,",
};
