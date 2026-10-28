// Table rows (supabase/migrations) to the app's own records and back. Pure:
// no client, no storage. Berths are referenced by uuid in the database and by
// their code ('G-14') in the app, so both directions take a lookup.

import { fromCents, toCents } from "@/lib/money";
import type { Enquiry, OutOfServiceMark, SubmitEnquiryInput } from "@/data/mock/enquiries";
import type { RelettingConditions, RelettingRequest } from "@/data/mock/reletting";
import type { BoatDocuments, SavedBoat } from "@/features/my-boat/lib/boatProfile";

export type BerthRow = {
  id: string;
  marina_id: string;
  code: string;
  status: "in_service" | "out_of_service";
  status_reason: string;
  status_set_at: string | null;
};

export type ArrivalRow = {
  id: string;
  marina_id: string;
  berth_id: string | null;
  status: Enquiry["status"];
  arrival_status: Enquiry["arrivalStatus"];
  decision_at: string | null;
  decision_note: string;
  arrived_at: string | null;
  departed_at: string | null;
  flag_note: string;
  // Written by the propose_dates function only, so the app never sends them.
  proposed_arrival?: string | null;
  proposed_departure?: string | null;
  expected_arrival: string;
  eta: string | null;
  departure: string | null;
  etd: string | null;
  open_ended: boolean;
  boat_name: string;
  boat_type: string;
  length_m: number | string | null;
  beam_m: number | string | null;
  draft_m: number | string | null;
  flag_country: string;
  requested_berth_code: string;
  skipper_name: string;
  phone: string;
  email: string;
  home_port: string;
  people_on_board: string;
  services: Enquiry["services"];
  boat_use: string;
  operating_entity: string;
  company_registration: string;
  contract_name: string;
  contract_role: string;
  eu_status: Enquiry["euStatus"];
  last_port: string;
  next_port: string;
  crew: Enquiry["crew"];
  documents: Enquiry["documents"];
  created_at: string;
};

export type ReletOfferRow = {
  id: string;
  marina_id: string;
  berth_id: string;
  berth_holder: string;
  berth_holder_ref: string;
  away_from: string;
  away_to: string;
  status: RelettingRequest["status"];
  boat_removal_confirmed: boolean;
  relet_consent: boolean;
  outside_arrangement_confirmed: boolean;
  terms_accepted_at: string;
  readiness_confirmed_at: string;
  history: RelettingRequest["history"];
  decision_note: string;
  conditions: RelettingConditions | null;
  early_return_requested_at: string | null;
  booked_nights: string[];
  approved_nights: string[] | null;
  resubmit_of: string | null;
  nights_relet: number | null;
  gross_cents: number | null;
  owner_share_cents: number | null;
  fee_cents: number | null;
  net_cents: number | null;
  created_at: string;
};

// The berth lookups both directions need.
export type BerthIndex = {
  codeById: Map<string, string>;
  idByCode: Map<string, string>;
};

export function indexBerths(rows: Pick<BerthRow, "id" | "code">[]): BerthIndex {
  return {
    codeById: new Map(rows.map((r) => [r.id, r.code])),
    idByCode: new Map(rows.map((r) => [r.code, r.id])),
  };
}

// ---- Small conversions ----

// "9.2" to 9.2, and "" or anything not a number to null.
export function metresToColumn(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

// numeric columns can arrive as a number or a string; null becomes "".
export function metresFromColumn(value: number | string | null): string {
  if (value === null) return "";
  const n = Number(value);
  return Number.isFinite(n) ? String(n) : "";
}

// "11:00" to "11:00", and "" to null.
export function timeToColumn(value: string): string | null {
  return value.trim() === "" ? null : value;
}

// "11:00:00" to "11:00", and null to "".
export function timeFromColumn(value: string | null): string {
  return value ? value.slice(0, 5) : "";
}

function eurToCents(value: number | null): number | null {
  return value === null ? null : toCents(value);
}

function centsToEur(value: number | string | null): number | null {
  return value === null ? null : fromCents(Number(value));
}

function berthIdFor(index: BerthIndex, code: string | null): string | null {
  if (!code) return null;
  const id = index.idByCode.get(code);
  if (!id) throw new Error(`Berth ${code} is not in the database.`);
  return id;
}

// ---- Arrivals ----

export function enquiryFromRow(row: ArrivalRow, index: BerthIndex): Enquiry {
  return {
    id: row.id,
    marinaId: row.marina_id,
    status: row.status,
    arrivalStatus: row.arrival_status,
    createdAt: row.created_at,
    decisionAt: row.decision_at,
    decisionNote: row.decision_note,
    assignedBerthId: row.berth_id ? (index.codeById.get(row.berth_id) ?? null) : null,
    arrivedAt: row.arrived_at,
    departedAt: row.departed_at,
    flagNote: row.flag_note,
    proposedArrival: row.proposed_arrival ?? "",
    proposedDeparture: row.proposed_departure ?? "",
    arrival: row.expected_arrival,
    eta: timeFromColumn(row.eta),
    departure: row.departure ?? "",
    etd: timeFromColumn(row.etd),
    openEnded: row.open_ended,
    boatName: row.boat_name,
    vesselType: row.boat_type,
    loa: metresFromColumn(row.length_m),
    beam: metresFromColumn(row.beam_m),
    draft: metresFromColumn(row.draft_m),
    flagCountry: row.flag_country,
    requestedBerthId: row.requested_berth_code,
    skipperName: row.skipper_name,
    phone: row.phone,
    email: row.email,
    homePort: row.home_port,
    peopleOnBoard: row.people_on_board,
    services: row.services,
    vesselUse: row.boat_use,
    operatingEntity: row.operating_entity,
    companyRegistration: row.company_registration,
    contractName: row.contract_name,
    contractRole: row.contract_role,
    euStatus: row.eu_status,
    lastPort: row.last_port,
    nextPort: row.next_port,
    crew: row.crew,
    documents: row.documents,
  };
}

export function enquiryToRow(enquiry: Enquiry, index: BerthIndex): ArrivalRow {
  return {
    id: enquiry.id,
    marina_id: enquiry.marinaId,
    berth_id: berthIdFor(index, enquiry.assignedBerthId),
    status: enquiry.status,
    arrival_status: enquiry.arrivalStatus,
    decision_at: enquiry.decisionAt,
    decision_note: enquiry.decisionNote,
    arrived_at: enquiry.arrivedAt,
    departed_at: enquiry.departedAt,
    flag_note: enquiry.flagNote,
    expected_arrival: enquiry.arrival,
    eta: timeToColumn(enquiry.eta),
    departure: enquiry.departure || null,
    etd: timeToColumn(enquiry.etd),
    open_ended: enquiry.openEnded,
    boat_name: enquiry.boatName,
    boat_type: enquiry.vesselType,
    length_m: metresToColumn(enquiry.loa),
    beam_m: metresToColumn(enquiry.beam),
    draft_m: metresToColumn(enquiry.draft),
    flag_country: enquiry.flagCountry,
    requested_berth_code: enquiry.requestedBerthId,
    skipper_name: enquiry.skipperName,
    phone: enquiry.phone,
    email: enquiry.email,
    home_port: enquiry.homePort,
    people_on_board: enquiry.peopleOnBoard,
    services: enquiry.services,
    boat_use: enquiry.vesselUse,
    operating_entity: enquiry.operatingEntity,
    company_registration: enquiry.companyRegistration,
    contract_name: enquiry.contractName,
    contract_role: enquiry.contractRole,
    eu_status: enquiry.euStatus,
    last_port: enquiry.lastPort,
    next_port: enquiry.nextPort,
    crew: enquiry.crew,
    documents: enquiry.documents,
    created_at: enquiry.createdAt,
  };
}

// ---- Relet offers ----

export function reletFromRow(row: ReletOfferRow, index: BerthIndex): RelettingRequest {
  return {
    id: row.id,
    userId: row.berth_holder_ref,
    marinaId: row.marina_id,
    berthId: index.codeById.get(row.berth_id) ?? "",
    startDate: row.away_from,
    endDate: row.away_to,
    boatRemovalConfirmed: row.boat_removal_confirmed,
    reletConsent: row.relet_consent,
    outsideArrangementConfirmed: row.outside_arrangement_confirmed,
    termsAcceptedAt: row.terms_accepted_at,
    readinessConfirmedAt: row.readiness_confirmed_at,
    status: row.status,
    history: row.history,
    decisionNote: row.decision_note,
    conditions: row.conditions,
    earlyReturnRequestedAt: row.early_return_requested_at,
    bookedNights: row.booked_nights,
    approvedNights: row.approved_nights,
    resubmitOf: row.resubmit_of,
    nightsRelet: row.nights_relet,
    grossEur: centsToEur(row.gross_cents),
    ownerShareEur: centsToEur(row.owner_share_cents),
    feeEur: centsToEur(row.fee_cents),
    netEur: centsToEur(row.net_cents),
    createdAt: row.created_at,
  };
}

export function reletToRow(
  request: RelettingRequest,
  index: BerthIndex,
  berthHolder: string
): ReletOfferRow {
  return {
    id: request.id,
    marina_id: request.marinaId,
    berth_id: berthIdFor(index, request.berthId) as string,
    berth_holder: berthHolder,
    berth_holder_ref: request.userId,
    away_from: request.startDate,
    away_to: request.endDate,
    status: request.status,
    boat_removal_confirmed: request.boatRemovalConfirmed,
    relet_consent: request.reletConsent,
    outside_arrangement_confirmed: request.outsideArrangementConfirmed,
    terms_accepted_at: request.termsAcceptedAt,
    readiness_confirmed_at: request.readinessConfirmedAt,
    history: request.history,
    decision_note: request.decisionNote,
    conditions: request.conditions,
    early_return_requested_at: request.earlyReturnRequestedAt,
    booked_nights: request.bookedNights,
    approved_nights: request.approvedNights,
    resubmit_of: request.resubmitOf,
    nights_relet: request.nightsRelet,
    gross_cents: eurToCents(request.grossEur),
    owner_share_cents: eurToCents(request.ownerShareEur),
    fee_cents: eurToCents(request.feeEur),
    net_cents: eurToCents(request.netEur),
    created_at: request.createdAt,
  };
}

// ---- Out of service ----

export function outOfServiceFromRow(row: BerthRow): OutOfServiceMark | null {
  if (row.status !== "out_of_service") return null;
  return {
    berthId: row.code,
    marinaId: row.marina_id,
    reason: row.status_reason,
    setAt: row.status_set_at ?? "",
  };
}

// ---- A user's own boats ----

export type BoatRow = {
  id: string;
  user_id: string;
  name: string;
  boat_type: string;
  length_m: number | string | null;
  beam_m: number | string | null;
  draft_m: number | string | null;
  flag_country: string;
  registration_number: string;
  home_port: string;
  documents: Partial<BoatDocuments> | null;
};

const text = (value: unknown): string => (typeof value === "string" ? value : "");

export function boatFromRow(row: BoatRow): SavedBoat {
  const d = row.documents ?? {};
  return {
    id: row.id,
    name: row.name,
    type: row.boat_type,
    loa: metresFromColumn(row.length_m),
    beam: metresFromColumn(row.beam_m),
    draft: metresFromColumn(row.draft_m),
    flag: row.flag_country,
    homePort: row.home_port,
    documents: {
      registrationNumber: text(d.registrationNumber) || row.registration_number,
      insuranceProvider: text(d.insuranceProvider),
      insurancePolicy: text(d.insurancePolicy),
      insuranceExpiry: text(d.insuranceExpiry),
      competenceCertificate: text(d.competenceCertificate),
      vhfLicence: text(d.vhfLicence),
    },
  };
}

export function boatToRow(boat: SavedBoat, userId: string): BoatRow {
  const documents: Partial<BoatDocuments> = boat.documents ?? {};
  return {
    id: boat.id,
    user_id: userId,
    // The database requires a name; an unnamed boat is stored as "My boat".
    name: boat.name.trim() || "My boat",
    boat_type: boat.type,
    length_m: metresToColumn(boat.loa),
    beam_m: metresToColumn(boat.beam),
    draft_m: metresToColumn(boat.draft),
    flag_country: boat.flag,
    registration_number: documents.registrationNumber ?? "",
    home_port: boat.homePort,
    documents,
  };
}

// ---- What the guest sends to request_arrival ----

// The columns request_arrival reads from the form. The user, the boat link,
// the customer record and the status are set by the database function.
export function enquiryToRequest(enquiry: SubmitEnquiryInput): Record<string, unknown> {
  return {
    expected_arrival: enquiry.arrival,
    eta: timeToColumn(enquiry.eta),
    departure: enquiry.departure || null,
    etd: timeToColumn(enquiry.etd),
    open_ended: enquiry.openEnded,
    boat_name: enquiry.boatName,
    boat_type: enquiry.vesselType,
    length_m: enquiry.loa,
    beam_m: enquiry.beam,
    draft_m: enquiry.draft,
    flag_country: enquiry.flagCountry,
    requested_berth_code: enquiry.requestedBerthId,
    skipper_name: enquiry.skipperName,
    phone: enquiry.phone,
    email: enquiry.email,
    home_port: enquiry.homePort,
    people_on_board: enquiry.peopleOnBoard,
    services: enquiry.services,
    boat_use: enquiry.vesselUse,
    operating_entity: enquiry.operatingEntity,
    company_registration: enquiry.companyRegistration,
    contract_name: enquiry.contractName,
    contract_role: enquiry.contractRole,
    eu_status: enquiry.euStatus,
    last_port: enquiry.lastPort,
    next_port: enquiry.nextPort,
    crew: enquiry.crew,
    documents: enquiry.documents,
  };
}
