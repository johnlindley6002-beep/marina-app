import type { MarinaClass } from "./marinas";

export type PontoonRow = {
  side: "a" | "b";
  startNumber: number;
  endNumber: number;
  step: number;
  sizeClass: MarinaClass;
};

export type Pontoon = {
  id: string;
  origin: { x: number; y: number };
  // Direction the spine extends in: 0 = right, 90 = down, 180 = left, 270 = up.
  angleDeg: number;
  spacing: number;
  berthLength: number;
  berthWidth: number;
  rows: PontoonRow[];
};

export type Berth = {
  id: string;
  pontoonId: string;
  number: number;
  sizeClass: MarinaClass;
  x: number;
  y: number;
  width: number;
  height: number;
  rotationDeg: number;
};

function rowCount(row: PontoonRow): number {
  return Math.floor((row.endNumber - row.startNumber) / row.step) + 1;
}

export function getPontoonSpineLength(pontoon: Pontoon): number {
  const maxCount = Math.max(...pontoon.rows.map(rowCount));
  return (maxCount - 1) * pontoon.spacing;
}

export function getPontoonSpine(pontoon: Pontoon) {
  const length = getPontoonSpineLength(pontoon);
  const rad = (pontoon.angleDeg * Math.PI) / 180;
  const dx = Math.cos(rad);
  const dy = Math.sin(rad);
  return {
    x1: pontoon.origin.x,
    y1: pontoon.origin.y,
    x2: pontoon.origin.x + dx * length,
    y2: pontoon.origin.y + dy * length,
  };
}

export function generateBerths(pontoon: Pontoon): Berth[] {
  const rad = (pontoon.angleDeg * Math.PI) / 180;
  const dx = Math.cos(rad);
  const dy = Math.sin(rad);
  // Perpendicular unit vector, used to offset a row to one side of the spine.
  const px = -dy;
  const py = dx;

  const berths: Berth[] = [];

  for (const row of pontoon.rows) {
    const count = rowCount(row);
    const sideSign = row.side === "a" ? -1 : 1;
    const offset = sideSign * (pontoon.berthLength / 2 + pontoon.berthWidth / 2);

    for (let i = 0; i < count; i++) {
      const number = row.startNumber + i * row.step;
      const alongX = pontoon.origin.x + dx * i * pontoon.spacing;
      const alongY = pontoon.origin.y + dy * i * pontoon.spacing;

      berths.push({
        id: `${pontoon.id}-${number}`,
        pontoonId: pontoon.id,
        number,
        sizeClass: row.sizeClass,
        x: alongX + px * offset,
        y: alongY + py * offset,
        width: pontoon.berthWidth,
        height: pontoon.berthLength,
        rotationDeg: pontoon.angleDeg,
      });
    }
  }

  return berths;
}

// Schematic canvas bounds, used by the map component's viewBox.
export const MAP_WIDTH = 1050;
export const MAP_HEIGHT = 620;

const SPACING = 9;
const BERTH_LENGTH = 16;
const BERTH_WIDTH = 6;

const LEFT_SPINE_X = 160;
const CENTRE_SPINE_X = 680;

// All 16 real pontoon letters (A-P), laid out per Marina de Cascais's
// official plan ("A3_MAPA_IMPRESSÃO.pdf", also saved for reference at
// /public/images/cascais-marina-plan.webp):
//
// - LEFT group (west quay), anchored to land on the left, fingers
//   pointing right: P, O, N, M, L, K stacked top-to-bottom.
// - CENTRE group, a herringbone off one shared central spine: F-J
//   point left, E-A point right, paired in rows top-to-bottom
//   (F/E, G/D, H/C, I/B, J/A). Row length decreases going down, just
//   like the real plan.
//
// I, J, B, and K keep their REAL berth numbers, read directly off the
// official plan. The other 12 pontoons use clean, representative
// counts that shrink in the same proportion as the real plan, rather
// than hand-tracing all ~650 berths — the goal is a proportionally
// faithful, maintainable schematic, not a pixel-exact reproduction.
//
// PROVISIONAL: the real plan shows berth numbers but not size classes.
// No authoritative per-pontoon/per-berth class mapping was available,
// so the classes below are a reasonable placeholder spread across the
// tariff's classes. Update once the real mapping is confirmed.
export const pontoons: Pontoon[] = [
  // Left group (west quay), top to bottom: P, O, N, M, L, K.
  {
    id: "P",
    origin: { x: LEFT_SPINE_X, y: 100 },
    angleDeg: 0,
    spacing: SPACING,
    berthLength: BERTH_LENGTH,
    berthWidth: BERTH_WIDTH,
    rows: [
      { side: "a", startNumber: 2, endNumber: 60, step: 2, sizeClass: "III" },
      { side: "b", startNumber: 1, endNumber: 59, step: 2, sizeClass: "III" },
    ],
  },
  {
    id: "O",
    origin: { x: LEFT_SPINE_X, y: 178 },
    angleDeg: 0,
    spacing: SPACING,
    berthLength: BERTH_LENGTH,
    berthWidth: BERTH_WIDTH,
    rows: [
      { side: "a", startNumber: 2, endNumber: 52, step: 2, sizeClass: "III" },
      { side: "b", startNumber: 1, endNumber: 51, step: 2, sizeClass: "III" },
    ],
  },
  {
    id: "N",
    origin: { x: LEFT_SPINE_X, y: 256 },
    angleDeg: 0,
    spacing: SPACING,
    berthLength: BERTH_LENGTH,
    berthWidth: BERTH_WIDTH,
    rows: [
      { side: "a", startNumber: 2, endNumber: 44, step: 2, sizeClass: "II" },
      { side: "b", startNumber: 1, endNumber: 43, step: 2, sizeClass: "II" },
    ],
  },
  {
    id: "M",
    origin: { x: LEFT_SPINE_X, y: 334 },
    angleDeg: 0,
    spacing: SPACING,
    berthLength: BERTH_LENGTH,
    berthWidth: BERTH_WIDTH,
    rows: [
      { side: "a", startNumber: 2, endNumber: 36, step: 2, sizeClass: "II" },
      { side: "b", startNumber: 1, endNumber: 35, step: 2, sizeClass: "II" },
    ],
  },
  {
    id: "L",
    origin: { x: LEFT_SPINE_X, y: 412 },
    angleDeg: 0,
    spacing: SPACING,
    berthLength: BERTH_LENGTH,
    berthWidth: BERTH_WIDTH,
    rows: [
      { side: "a", startNumber: 2, endNumber: 28, step: 2, sizeClass: "IA" },
      { side: "b", startNumber: 1, endNumber: 27, step: 2, sizeClass: "IA" },
    ],
  },
  {
    id: "K",
    origin: { x: LEFT_SPINE_X, y: 490 },
    angleDeg: 0,
    spacing: SPACING,
    berthLength: BERTH_LENGTH,
    berthWidth: BERTH_WIDTH,
    rows: [
      { side: "a", startNumber: 2, endNumber: 20, step: 2, sizeClass: "IA" },
      { side: "b", startNumber: 1, endNumber: 13, step: 2, sizeClass: "IA" },
    ],
  },

  // Centre group (herringbone off the central spine), top to bottom
  // rows: F/E, G/D, H/C, I/B, J/A. Left-pointing (F,G,H,I,J) then
  // right-pointing (E,D,C,B,A).
  {
    id: "F",
    origin: { x: CENTRE_SPINE_X, y: 100 },
    angleDeg: 180,
    spacing: SPACING,
    berthLength: BERTH_LENGTH,
    berthWidth: BERTH_WIDTH,
    rows: [
      { side: "a", startNumber: 2, endNumber: 40, step: 2, sizeClass: "III" },
      { side: "b", startNumber: 1, endNumber: 39, step: 2, sizeClass: "III" },
    ],
  },
  {
    id: "E",
    origin: { x: CENTRE_SPINE_X, y: 100 },
    angleDeg: 0,
    spacing: SPACING,
    berthLength: BERTH_LENGTH,
    berthWidth: BERTH_WIDTH,
    rows: [
      { side: "a", startNumber: 2, endNumber: 40, step: 2, sizeClass: "III" },
      { side: "b", startNumber: 1, endNumber: 39, step: 2, sizeClass: "III" },
    ],
  },
  {
    id: "G",
    origin: { x: CENTRE_SPINE_X, y: 192 },
    angleDeg: 180,
    spacing: SPACING,
    berthLength: BERTH_LENGTH,
    berthWidth: BERTH_WIDTH,
    rows: [
      { side: "a", startNumber: 2, endNumber: 34, step: 2, sizeClass: "II" },
      { side: "b", startNumber: 1, endNumber: 33, step: 2, sizeClass: "II" },
    ],
  },
  {
    id: "D",
    origin: { x: CENTRE_SPINE_X, y: 192 },
    angleDeg: 0,
    spacing: SPACING,
    berthLength: BERTH_LENGTH,
    berthWidth: BERTH_WIDTH,
    rows: [
      { side: "a", startNumber: 2, endNumber: 34, step: 2, sizeClass: "II" },
      { side: "b", startNumber: 1, endNumber: 33, step: 2, sizeClass: "II" },
    ],
  },
  {
    id: "H",
    origin: { x: CENTRE_SPINE_X, y: 284 },
    angleDeg: 180,
    spacing: SPACING,
    berthLength: BERTH_LENGTH,
    berthWidth: BERTH_WIDTH,
    rows: [
      { side: "a", startNumber: 2, endNumber: 28, step: 2, sizeClass: "II" },
      { side: "b", startNumber: 1, endNumber: 27, step: 2, sizeClass: "II" },
    ],
  },
  {
    id: "C",
    origin: { x: CENTRE_SPINE_X, y: 284 },
    angleDeg: 0,
    spacing: SPACING,
    berthLength: BERTH_LENGTH,
    berthWidth: BERTH_WIDTH,
    rows: [
      { side: "a", startNumber: 2, endNumber: 28, step: 2, sizeClass: "II" },
      { side: "b", startNumber: 1, endNumber: 27, step: 2, sizeClass: "II" },
    ],
  },
  {
    id: "I",
    origin: { x: CENTRE_SPINE_X, y: 376 },
    angleDeg: 180,
    spacing: SPACING,
    berthLength: BERTH_LENGTH,
    berthWidth: BERTH_WIDTH,
    rows: [
      { side: "a", startNumber: 2, endNumber: 42, step: 2, sizeClass: "II" },
      { side: "b", startNumber: 1, endNumber: 37, step: 2, sizeClass: "II" },
    ],
  },
  {
    id: "B",
    origin: { x: CENTRE_SPINE_X, y: 376 },
    angleDeg: 0,
    spacing: SPACING,
    berthLength: BERTH_LENGTH,
    berthWidth: BERTH_WIDTH,
    rows: [
      { side: "a", startNumber: 2, endNumber: 38, step: 2, sizeClass: "II" },
      { side: "b", startNumber: 1, endNumber: 31, step: 2, sizeClass: "II" },
    ],
  },
  {
    id: "J",
    origin: { x: CENTRE_SPINE_X, y: 468 },
    angleDeg: 180,
    spacing: SPACING,
    berthLength: BERTH_LENGTH,
    berthWidth: BERTH_WIDTH,
    rows: [
      { side: "a", startNumber: 2, endNumber: 32, step: 2, sizeClass: "I" },
      { side: "b", startNumber: 1, endNumber: 29, step: 2, sizeClass: "I" },
    ],
  },
  {
    id: "A",
    origin: { x: CENTRE_SPINE_X, y: 468 },
    angleDeg: 0,
    spacing: SPACING,
    berthLength: BERTH_LENGTH,
    berthWidth: BERTH_WIDTH,
    rows: [
      { side: "a", startNumber: 2, endNumber: 32, step: 2, sizeClass: "I" },
      { side: "b", startNumber: 1, endNumber: 29, step: 2, sizeClass: "I" },
    ],
  },
];

export function getAllBerths(): Berth[] {
  return pontoons.flatMap(generateBerths);
}
