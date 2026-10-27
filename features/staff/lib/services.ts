import type { Enquiry } from "@/lib/data";
import type { StaffDictionary } from "@/lib/i18n/staff/en";

// The services a guest asked for, as short labels in the staff language.
export function serviceList(e: Enquiry, s: StaffDictionary): string[] {
  const svc = e.services;
  const out: string[] = [];
  if (svc.shorePower) out.push(s.services.shorePower(svc.amperage));
  if (svc.water) out.push(s.services.water);
  if (svc.pumpOut) out.push(s.services.pumpOut);
  if (svc.fuel) out.push(s.services.fuel);
  if (svc.laundry) out.push(s.services.laundry);
  if (svc.helpMooring) out.push(s.services.helpMooring);
  if (svc.helpSlipping) out.push(s.services.helpSlipping);
  return out;
}
