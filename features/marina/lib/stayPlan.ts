import { addDaysIso, isValidIsoDate } from "@/lib/dates";

// The one set of trip inputs shared by the Plan panel, the berth map, the
// price estimate and the enquiry form. Dimensions are metres, as strings.
export type StayPlan = {
  arrival: string;
  departure: string;
  openEnded: boolean;
  loa: string;
  beam: string;
  draft: string;
  eta: string;
  etd: string;
  shorePower: boolean;
  amperage: string;
  water: boolean;
  pumpOut: boolean;
  fuel: boolean;
  laundry: boolean;
};

export const EMPTY_PLAN: StayPlan = {
  arrival: "",
  departure: "",
  openEnded: false,
  loa: "",
  beam: "",
  draft: "",
  eta: "",
  etd: "",
  shorePower: false,
  amperage: "",
  water: false,
  pumpOut: false,
  fuel: false,
  laundry: false,
};

export const PLAN_KEYS = new Set<string>(Object.keys(EMPTY_PLAN));

export function nextDayIso(iso: string): string {
  return isValidIsoDate(iso) ? addDaysIso(iso, 1) : "";
}

// Open-ended stays are priced and searched as a single night.
export function effectiveDeparture(plan: StayPlan): string {
  return plan.openEnded ? nextDayIso(plan.arrival) : plan.departure;
}

// True once there are arrival and departure dates (or an open-ended stay, which
// needs only an arrival) and a length overall. The estimate and the enquiry
// appear from this point on.
export function isPlanReady(plan: StayPlan): boolean {
  if (!plan.arrival || !(Number(plan.loa) > 0)) return false;
  if (plan.openEnded) return true;
  return !!plan.departure && plan.departure > plan.arrival;
}
