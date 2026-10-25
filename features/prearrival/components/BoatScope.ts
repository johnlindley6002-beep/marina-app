import type { Marina, MarinaClass } from "@/data/marinas";
import type { Dictionary } from "@/lib/i18n/types";
import type { SavedBoat } from "@/features/my-boat/lib/boatProfile";
import type { StepProps } from "./PreArrivalWizard";

// What the boat step hands to its three field groups, so each can live in its
// own file without re-deriving the same values.
export type BoatScope = {
  draft: StepProps["draft"];
  setDraft: StepProps["setDraft"];
  errors: StepProps["errors"];
  copy: Dictionary["preArrival"]["boat"];
  unit: string;
  boats: SavedBoat[];
  chooseSaved: (boatId: string) => void;
  marina: Marina;
  marinaClass: MarinaClass | null;
  rate: { low: number; high: number } | null;
  isPt: boolean;
};
