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

// Real pontoon letters and berth numbering are read from Marina de
// Cascais's official plan ("A3_MAPA_IMPRESSÃO.pdf"). This is a
// representative subset (I, J, B, K of the real A-P range) to validate
// the parametric approach — the rest of the marina follows in a later
// pass.
//
// PROVISIONAL: the real plan shows berth numbers but not size classes.
// No authoritative per-pontoon/per-berth class mapping was available,
// so the classes below are a reasonable placeholder. Update once the
// real mapping is confirmed.
export const pontoons: Pontoon[] = [
  {
    id: "I",
    origin: { x: 140, y: 110 },
    angleDeg: 0,
    spacing: 13,
    berthLength: 22,
    berthWidth: 9,
    rows: [
      { side: "a", startNumber: 2, endNumber: 42, step: 2, sizeClass: "II" },
      { side: "b", startNumber: 1, endNumber: 37, step: 2, sizeClass: "II" },
    ],
  },
  {
    id: "J",
    origin: { x: 140, y: 190 },
    angleDeg: 0,
    spacing: 13,
    berthLength: 22,
    berthWidth: 9,
    rows: [
      { side: "a", startNumber: 2, endNumber: 32, step: 2, sizeClass: "I" },
      { side: "b", startNumber: 1, endNumber: 29, step: 2, sizeClass: "I" },
    ],
  },
  {
    id: "B",
    origin: { x: 610, y: 110 },
    angleDeg: 180,
    spacing: 13,
    berthLength: 22,
    berthWidth: 9,
    rows: [
      { side: "a", startNumber: 2, endNumber: 38, step: 2, sizeClass: "II" },
      { side: "b", startNumber: 1, endNumber: 31, step: 2, sizeClass: "II" },
    ],
  },
  {
    id: "K",
    origin: { x: 70, y: 270 },
    angleDeg: 90,
    spacing: 13,
    berthLength: 22,
    berthWidth: 9,
    rows: [
      { side: "a", startNumber: 2, endNumber: 20, step: 2, sizeClass: "IA" },
      { side: "b", startNumber: 1, endNumber: 13, step: 2, sizeClass: "IA" },
    ],
  },
];

export function getAllBerths(): Berth[] {
  return pontoons.flatMap(generateBerths);
}
