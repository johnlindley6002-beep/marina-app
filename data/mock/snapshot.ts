// Lets the staff rules in this folder run against data loaded from Supabase
// instead of localStorage, so each rule is written once. While a snapshot is
// active, the enquiry, reletting and out-of-service stores read from and write
// to it, and staff membership comes from the signed-in user's staff_members
// rows. Every rule here is synchronous, so a snapshot is only ever active for
// the length of one call.

import type { BerthLinkRecord } from "./accounts";
import type { EnquiryStore, OosStore } from "./enquiries";
import type { ReletStore } from "./reletting";

export type StaffSnapshot = {
  enquiries: EnquiryStore;
  relet: ReletStore;
  oos: OosStore;
  // The marinas the signed-in user is staff of.
  staffMarinaIds: string[];
  // The berth holder's name for each relet offer, by offer id.
  ownerNames?: Record<string, string>;
  // The berth holdings of the marina, read from the database. When absent the
  // sample links in accounts.ts apply.
  holdings?: BerthLinkRecord[];
};

let active: StaffSnapshot | null = null;

export function activeSnapshot(): StaffSnapshot | null {
  return active;
}

export function runOnSnapshot<T>(snapshot: StaffSnapshot, rule: () => T): T {
  active = snapshot;
  try {
    return rule();
  } finally {
    active = null;
  }
}
