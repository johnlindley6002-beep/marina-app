import type { Marina } from "../data/marinas";

export type ProtectionLevel = Marina["protection"]["level"];

// How each stored level is shown. The marina data carries the level and the
// one-line reason; this only defines the wording and the size of the scale.
export const PROTECTION_LEVELS: Record<
  ProtectionLevel,
  { label: string; filled: 1 | 2 | 3 }
> = {
  sheltered: { label: "Well protected", filled: 3 },
  partial: { label: "Moderate", filled: 2 },
  exposed: { label: "Exposed", filled: 1 },
};

export const PROTECTION_SEGMENTS = 3;
