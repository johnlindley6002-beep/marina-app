import type { Dictionary } from "../../types";

export const berthSearch: Dictionary["berthSearch"] = {
  heading: "Available berths",
  subheading: (marinaName) => `Check simulated availability at ${marinaName}.`,
  illustrative: "Berth availability shown is illustrative for now.",
  arrival: "Arrival",
  departure: "Departure",
  boatLength: "Boat length (m)",
  lengthPlaceholder: "e.g. 7",
  searchButton: "Search",
  errorLength: "Enter your boat's length in metres.",
  errorDates: "Choose an arrival and departure date.",
  errorDeparture: "Departure must be after arrival.",
  noClass: (cls) =>
    `No Class ${cls} berths modeled yet in this schematic. Larger vessel classes are coming in a future pass.`,
  noAvailable: "No available berths match your dates. Try different dates.",
  noFit:
    "No berth class fits a vessel this length in our current tariff (max 45 m). Please contact the marina directly.",
  seasonBoth: (low, high) =>
    `Your stay spans both seasons: ${low} night${low === 1 ? "" : "s"} low season, ${high} night${high === 1 ? "" : "s"} high season.`,
  seasonHigh: "Your dates fall in high season (Apr–Sep).",
  seasonLow: "Your dates fall in low season (Jan–Mar & Oct–Dec).",
  legendAvailable: "Available & fits",
  legendOccupied: "Occupied",
  legendUnfit: "Doesn't fit your boat",
  legendNeutral: "Not searched yet",
  hintBeforeSearch: "Enter your dates and boat length, then search to see berth availability.",
  priceBerthLine: (id, cls, nights) =>
    `Berth ${id} · Class ${cls} · ${nights} night${nights === 1 ? "" : "s"}`,
  vatNote: (rate) => `+ ${rate}% VAT and utilities. Estimate, confirm with marina.`,
  ctaHeading: (marinaName) => `Questions about a berth at ${marinaName}?`,
  ctaButton: "Contact marina",
  mailSubject: "Berth request - Marina de Cascais",
  mailGreeting: "Hello,",
  mailIntro: "I'd like to enquire about berth availability at Marina de Cascais.",
  mailArrival: "Arrival",
  mailDeparture: "Departure",
  mailBoatLength: "Boat length",
  mailBerth: "Berth of interest",
  mailSignoff: "Thanks,",
};
