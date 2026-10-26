import { plural } from "../../format";

const night = (n: number) => plural("en", n, { one: "night", other: "nights" });

// Plan your stay, the price estimate, the stay recap, the document wallet and
// the arrival actions on a marina page. The other dictionaries take their shape
// from this one (see Dictionary in types.ts).
export const stay = {
  season: {
    low: "Low season (January to March, October to December)",
    high: "High season (April to September)",
    both: "both seasons",
  },
  plan: {
    heading: "Plan your stay",
    intro: "Dates and boat size drive the map, estimate and enquiry below.",
    arrivalDate: "Arrival date",
    departureDate: "Departure date",
    lengthOverall: (unit: string) => `Length overall (${unit})`,
    lengthHint: "Including bowsprit, davits and dinghy",
    beam: (unit: string) => `Beam (${unit})`,
    draft: (unit: string) => `Draft (${unit})`,
    dimensionError: "Enter a number greater than 0, for example 12.5.",
    departureAfterArrival: "Departure must be after arrival. Choose a later departure date.",
    openEnded: "Open-ended stay (no departure date yet)",
    sizesDiffer: (boat: string) => `These sizes differ from ${boat}'s saved sizes.`,
    updateSavedBoat: "Update saved boat",
    usingSaved: (boat: string) => `Using your saved boat, ${boat}.`,
    manageBoat: "Manage in My boat",
    saveLead: "Save your boat in",
    saveLink: "My boat",
    saveTail: "and these sizes fill in next time.",
    stayOpenEnded: "Open-ended stay, priced and searched per night.",
    stayBothSeasons: (nights: number, low: number, high: number) =>
      `${nights} nights, spanning both seasons (${low} low, ${high} high).`,
    staySingleSeason: (nights: number, season: string) => `${nights} ${night(nights)}, ${season}.`,
    stayEnterDates: "Enter your arrival and departure dates.",
    stayLabel: "Stay: ",
  },
  decision: {
    fitQuestion: "Does my boat fit?",
    spaceQuestion: "Is there space?",
    costQuestion: "What will it cost?",
    notChecked: "Not checked",
    notCheckedYet: "Not checked yet",
    askMarina: "Ask the marina",
    notEstimatedYet: "Not estimated yet",
    enterDimensions: "Enter length, beam and draft.",
    fitYes: "Yes, it fits",
    fitNo: "No, not on standard berths",
    fitDetail: (cls: string, length: string) =>
      `Class ${cls} berth for ${length}. Beam and draft are within the marina's limits.`,
    fitMegaYacht: "This is the mega-yacht allocation on the outer pontoon.",
    reasonLength: "Longer than the standard berths, so contact the marina.",
    reasonBeam: (beam: string) =>
      `Your beam of ${beam} is wider than the standard berth for your length, so contact the marina.`,
    reasonDraft: (draft: string, max: string) =>
      `Your draft of ${draft} is deeper than the marina's ${max} maximum, so contact the marina.`,
    spaceNoFit: "Standard berths do not suit your boat.",
    enterDatesAndLength: "Enter your dates and length overall.",
    outsideClasses: "Your length is outside the standard berth classes.",
    noPlan: (cls: string) =>
      `The demo plan does not show Class ${cls} berths yet. The marina confirms availability by email.`,
    spaceYes: "Yes, berths show as available",
    spaceNone: "None shown for your size",
    availabilityNote: "Demo data, not live. The marina confirms availability by email.",
    costContact: "Contact the marina for a quote.",
    costAbout: (amount: string) => `About ${amount}`,
    costAboutFirstNight: (amount: string) => `About ${amount} for the first night`,
    nightlyRate: "Nightly rate",
    nightsCount: (n: number) => `${n} ${night(n)}`,
    costDetail: (period: string, cls: string, vat: number) =>
      `${period}, Class ${cls}, excluding ${vat}% VAT and utilities.`,
    seeBreakdown: "See the breakdown",
    costOutsideClasses:
      "Your length is outside the standard classes, so contact the marina for a quote.",
    promptDates: "Add your dates to see fit, space and price.",
    promptDatesAndLength: "Add your dates and length overall to see fit, space and price.",
    promptLength: "Add your length overall to see fit, space and price.",
  },
  estimate: {
    heading: "Your estimate",
    fromLine: (price: string) =>
      `From ${price} per night, depending on boat length and season. Add your dates and length overall for your own estimate.`,
    extras: "Extras",
    extrasHint: "Pick what you need. Each one is added to the breakdown below.",
    shorePower: "Shore power",
    shorePowerHint: (amps: number) => `Metered, billed on consumption (up to ${amps} A)`,
    amperageLabel: "Shore power amperage",
    amperagePlaceholder: "Amperage…",
    amperageError: "Choose a shore power amperage, for example 16 A or 32 A.",
    water: "Water",
    waterHint: "Metered, billed on consumption",
    pumpOut: "Pump-out",
    pumpOutHint: (price: string) => `${price} per operation`,
    perOperation: "Per operation",
    fuel: "Fuel on arrival",
    diesel: (price: string) => `Diesel ${price}/L`,
    petrol: (price: string) => `RON 95 ${price}/L`,
    fuelPrices: (prices: string) => `${prices}, billed at the fuel dock`,
    fuelAtDock: "Diesel and petrol, price at the fuel dock",
    laundry: "Laundry",
    laundryHint: (wash: string, dry: string) =>
      `Wash ${wash}, dry ${dry} per load, tokens from reception`,
    busyPeriod: "Busy period, so availability may be tighter.",
    classBerth: (cls: string) => `Class ${cls} berth`,
    nightlyOpenEnded: "nightly rate (open-ended stay)",
    berthId: (id: string) => `Berth ${id}`,
    nightsAtRate: (nights: number, rate: string) =>
      `${nights} ${night(nights)} at ${rate} per night`,
    berthSubtotal: "Berth subtotal",
    totalFirstNight: "Estimated first night",
    total: "Estimated total",
    vatNote: (vat: number) =>
      `Excluding ${vat}% VAT and utilities. Indicative price, confirmed by the marina.`,
    requestBerth: "Request a berth",
    requestNote: "This sends an enquiry. The marina confirms availability by email.",
    outsideClasses:
      "Your length is outside the standard berth classes, so contact the marina for a quote.",
    enterDatesAndLength: "Enter your dates and boat length above to see a price estimate.",
    allRates: "All berth rates",
    hideRates: "Hide berth rates",
  },
  recap: {
    heading: "Your stay and departure",
    basedOn: (arrival: string, boat: string) =>
      `Based on your last enquiry (${arrival}${boat ? `, ${boat}` : ""}), saved on this device.`,
    settleUp: "Settle-up estimate",
    departureDate: "Departure date",
    departureTime: "Departure time",
    chooseDeparture: "Choose a departure date after your arrival to see the estimate.",
    classSeason: (cls: string, season: string) => `Class ${cls} · ${season}`,
    estimatedTotal: "Estimated total",
    estimateOnly: (vat: number) =>
      `Estimate only, excluding ${vat}% VAT and utilities. The marina confirms the final total.`,
    leaving: "Leaving? Let the marina know",
    leavingNote: "Opens a pre-filled email with your boat and departure.",
    notifyDeparture: "Notify departure",
    comingBack: "Coming back?",
    comingBackNote: "Same boat and services, dates left blank.",
    rebook: "Rebook this stay",
  },
  wallet: {
    optional: "All optional. The documents themselves must be shown on arrival.",
    moreAbout: "More about saving these details",
    hide: "Hide",
    moreAboutBody:
      "Save these details with your boat to reuse them next time, or leave any blank and give them to the marina staff in person. Only the text is stored here, in this browser.",
    bring: (min: string) =>
      `Bring: boat registration (Portugal requires originals, not laminated copies), proof of third-party insurance (minimum ${min}, certificate in Portuguese if possible) and the skipper's certificate of competence.`,
    registrationNumber: "Registration number",
    insuranceProvider: "Insurance provider",
    insurancePolicy: "Insurance policy number",
    insuranceExpiry: "Insurance expiry",
    expiresBefore: "This expires before your arrival date.",
    competence: "Skipper's certificate of competence",
    vhfLicence: "VHF licence",
    includeInEnquiry: "Include these details in my enquiry email",
  },
  arrival: {
    heading: "Arriving today?",
    intro: (marina: string) =>
      `Each opens a pre-filled email to ${marina}. Nothing is sent until you press send.`,
    arrivingNow: "I'm arriving now",
    digitalCheckIn: "Digital check-in",
  },
};
