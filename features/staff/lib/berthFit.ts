// Whether a boat fits a berth, from the berth's limits in the database.

export type BerthLimits = { maxLengthM: number; beamM: number; draftM: number };
export type BoatSize = { loa: number; beam: number; draft: number };

export type FitProblem = {
  measure: "length" | "beam" | "draft";
  boat: number;
  berth: number;
};

// Each measure the boat exceeds. A measure the guest left out (0) is not
// checked, since nothing is known about it.
export function berthFitProblems(boat: BoatSize, berth: BerthLimits): FitProblem[] {
  const out: FitProblem[] = [];
  if (boat.loa > 0 && boat.loa > berth.maxLengthM) {
    out.push({ measure: "length", boat: boat.loa, berth: berth.maxLengthM });
  }
  if (boat.beam > 0 && boat.beam > berth.beamM) {
    out.push({ measure: "beam", boat: boat.beam, berth: berth.beamM });
  }
  if (boat.draft > 0 && boat.draft > berth.draftM) {
    out.push({ measure: "draft", boat: boat.draft, berth: berth.draftM });
  }
  return out;
}
