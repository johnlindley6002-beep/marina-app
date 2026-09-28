// A readiness score and to-do list for a pre-arrival draft or submitted
// check-in, reusing the wizard's own validation rather than a second set of
// rules: getExtraErrors/getWarnings/getMissingRequiredDocuments already know
// exactly what is missing or worth a second look.

import { getMissingRequiredDocuments } from "./documentRules";
import { draftSchema, type PreArrivalDraft } from "./schema";
import { getExtraErrors, getWarnings } from "./warnings";

export type ReadinessItem = {
  message: string;
  // The wizard step this item belongs to.
  step: number;
  // For a person-specific item, the index to jump to on step 3.
  personIndex?: number;
};

// The five sections a stay is scored against: boat, voyage, crew, documents
// and stay. Steps 1 and 6 both roll into "boat" and "review" respectively,
// so this stays a simple five-part ring rather than one point per field.
const SECTION_STEPS = [1, 2, 3, 4, 5];

export type Readiness = {
  complete: number;
  total: number;
  items: ReadinessItem[];
};

function stepForPath(path: string | undefined): number {
  if (!path) return 6;
  const [section] = path.split(".");
  if (section === "owner" || section === "boatIdentity" || section === "boatSpecs") return 1;
  if (section === "voyage") return 2;
  if (section === "people") return 3;
  if (section === "documents") return 4;
  if (section === "stay") return 5;
  return 6;
}

function personIndexForPath(path: string | undefined): number | undefined {
  const match = /^people\.(\d+)/.exec(path ?? "");
  return match ? Number(match[1]) : undefined;
}

// Every reason this draft is not yet ready: a hard error (missing field, no
// skipper, an expiring ID) counts once, a missing required document counts
// once each, and a non-blocking warning counts too, since it is still worth
// the boater's attention before arrival.
export function getReadiness(draft: PreArrivalDraft): Readiness {
  const items: ReadinessItem[] = [];

  const structural = draftSchema.safeParse(draft);
  if (!structural.success) {
    for (const issue of structural.error.issues) {
      const path = issue.path.join(".");
      items.push({ message: issue.message, step: stepForPath(path), personIndex: personIndexForPath(path) });
    }
  }
  for (const req of getMissingRequiredDocuments(draft)) {
    items.push({ message: `${req.label} is required.`, step: 4 });
  }
  for (const flag of getExtraErrors(draft)) {
    items.push({ message: flag.message, step: stepForPath(flag.path), personIndex: personIndexForPath(flag.path) });
  }
  for (const flag of getWarnings(draft)) {
    items.push({ message: flag.message, step: stepForPath(flag.path), personIndex: personIndexForPath(flag.path) });
  }

  const sectionsWithIssues = new Set(items.map((i) => i.step).filter((s) => SECTION_STEPS.includes(s)));
  const complete = SECTION_STEPS.length - sectionsWithIssues.size;
  return { complete, total: SECTION_STEPS.length, items };
}
