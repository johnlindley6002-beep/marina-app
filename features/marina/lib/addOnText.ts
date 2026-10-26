import { getFuelPrices, type Marina, type QuoteLine } from "@/data/marinas";
import type { Dictionary } from "@/lib/i18n";

type Money = (euros: number) => string;

// The fuel line: the marina's per-litre prices when it has supplied them,
// otherwise the general note.
export function fuelText(
  t: Dictionary["stay"]["estimate"],
  marina: Marina,
  moneyPrecise: (euros: number, digits: number) => string
): string {
  const { diesel, ron95 } = getFuelPrices(marina);
  const parts = [
    diesel !== null ? t.diesel(moneyPrecise(diesel, 3)) : null,
    ron95 !== null ? t.petrol(moneyPrecise(ron95, 3)) : null,
  ].filter((p): p is string => p !== null);
  return parts.length > 0 ? t.fuelPrices(parts.join(", ")) : t.fuelAtDock;
}

// The label and the small note under an extra on the estimate.
export function addOnText(
  t: Dictionary["stay"]["estimate"],
  kind: QuoteLine["kind"],
  marina: Marina,
  money: Money,
  moneyPrecise: (euros: number, digits: number) => string
): { label: string; note: string } {
  const fees = marina.serviceFees;
  switch (kind) {
    case "shorePower":
      return { label: t.shorePower, note: t.shorePowerHint(fees.maxAmperage) };
    case "water":
      return { label: t.water, note: t.waterHint };
    case "pumpOut":
      return { label: t.pumpOut, note: t.perOperation };
    case "fuel":
      return { label: t.fuel, note: fuelText(t, marina, moneyPrecise) };
    case "laundry":
      return {
        label: t.laundry,
        note: t.laundryHint(money(fees.laundryWashEur), money(fees.laundryDryEur)),
      };
  }
}
