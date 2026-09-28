import { getAllBerths } from "../data/berths";
import { classifyBoatLength, type MarinaClass } from "../data/marinas";

// Mirrors the pattern the berth map uses (isSimulatedAvailable in
// BerthAvailabilityMap.tsx), so the summary and the map always agree. If the
// map's pattern ever changes, change this with it. Purely simulated, not
// connected to any booking system, and it does not depend on the dates.
function isSimulatedAvailable(berthId: string): boolean {
  let hash = 0;
  for (let i = 0; i < berthId.length; i++) {
    hash = (hash * 31 + berthId.charCodeAt(i)) >>> 0;
  }
  return hash % 3 !== 0;
}

export type SimulatedAvailability = {
  marinaClass: MarinaClass | null;
  // Berths of the boat's class on the plan, and how many of them show as free.
  total: number;
  available: number;
};

let cache: ReturnType<typeof getAllBerths> | null = null;

export function getSimulatedAvailability(lengthM: number): SimulatedAvailability {
  const marinaClass = classifyBoatLength(lengthM);
  if (!marinaClass) return { marinaClass: null, total: 0, available: 0 };
  cache ??= getAllBerths();
  const matching = cache.filter((b) => b.sizeClass === marinaClass);
  return {
    marinaClass,
    total: matching.length,
    available: matching.filter((b) => isSimulatedAvailable(b.id)).length,
  };
}
