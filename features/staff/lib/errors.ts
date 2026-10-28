import type { DbErrorKey } from "@/lib/data";
import type { StaffDictionary } from "@/lib/i18n/staff/en";

// The staff-language message for a database error key. A key without its own
// wording gets the general "could not save" message.
export function staffError(s: StaffDictionary, key: DbErrorKey): string {
  return (s.requests.errors as Record<string, string>)[key] ?? s.requests.errors.unknown;
}
