import type { DbErrorKey } from "@/lib/data";
import type { Dictionary } from "@/lib/i18n/types";

// The guest-facing message for a database error key, in the visitor's
// language. A key the guest side has no words for gets the general message.
export function guestError(accounts: Dictionary["accounts"], key: DbErrorKey): string {
  return (accounts.errors as Record<string, string>)[key] ?? accounts.errors.unknown;
}
