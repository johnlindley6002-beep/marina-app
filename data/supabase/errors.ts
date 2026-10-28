// What went wrong in a database call, as a short key the screens turn into a
// message in the right language. The functions in supabase/migrations raise
// exceptions whose text is one of these keys, and the exclusion constraints
// raise error 23P01.

export type DbErrorKey =
  | "double_booked"
  | "holding_overlap"
  | "berth_not_available"
  | "reason_required"
  | "already_decided"
  | "staff_only"
  | "invalid_dates"
  | "dates_in_past"
  | "guest_confirmed"
  | "not_signed_in"
  | "too_many_requests"
  | "too_many_boats"
  | "boat_not_found"
  | "offer_overlaps"
  | "confirmations_needed"
  | "not_a_berth_holder"
  | "invalid_email"
  | "no_proposal"
  | "not_found"
  | "unknown";

const KEYS: DbErrorKey[] = [
  "berth_not_available",
  "reason_required",
  "already_decided",
  "staff_only",
  "invalid_dates",
  "dates_in_past",
  "guest_confirmed",
  "not_signed_in",
  "too_many_requests",
  "too_many_boats",
  "boat_not_found",
  "offer_overlaps",
  "confirmations_needed",
  "not_a_berth_holder",
  "invalid_email",
  "no_proposal",
];

const NOT_FOUND = ["arrival_not_found", "offer_not_found", "holding_not_found", "berth_not_found"];

export function dbErrorKey(
  error: { code?: string | null; message?: string | null } | null
): DbErrorKey {
  if (!error) return "unknown";
  const message = error.message ?? "";
  if (error.code === "23P01") {
    return message.includes("berth_contracts") ? "holding_overlap" : "double_booked";
  }
  const found = KEYS.find((key) => message.includes(key));
  if (found) return found;
  if (NOT_FOUND.some((key) => message.includes(key))) return "not_found";
  return "unknown";
}
