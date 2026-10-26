import type { Marina } from "@/data/marinas";

export type ProtectionLevel = Marina["protection"]["level"];

// How full the scale is for each stored level. The marina data carries the level
// and the one-line reason; the wording lives in the dictionary.
export const PROTECTION_FILLED: Record<ProtectionLevel, 1 | 2 | 3> = {
  sheltered: 3,
  partial: 2,
  exposed: 1,
};

export const PROTECTION_SEGMENTS = 3;
