// A small flowing-text helper shared by the two generated PDFs, so neither
// one hand-rolls its own page-overflow and cursor bookkeeping.

import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from "pdf-lib";

export const A4_PORTRAIT: [number, number] = [595.28, 841.89];
export const A4_LANDSCAPE: [number, number] = [841.89, 595.28];
const MARGIN = 42;
const INK = rgb(0.039, 0.102, 0.184); // #0A1A2F
const MUTED = rgb(0.4, 0.44, 0.49);

export type Flow = {
  doc: PDFDocument;
  page: PDFPage;
  font: PDFFont;
  bold: PDFFont;
  y: number;
  pageSize: [number, number];
};

export async function createFlow(pageSize: [number, number]): Promise<Flow> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage(pageSize);
  return { doc, page, font, bold, y: pageSize[1] - MARGIN, pageSize };
}

function ensureRoom(flow: Flow, needed: number): void {
  if (flow.y - needed < MARGIN) {
    flow.page = flow.doc.addPage(flow.pageSize);
    flow.y = flow.pageSize[1] - MARGIN;
  }
}

export function heading(flow: Flow, text: string, size = 16): void {
  ensureRoom(flow, size + 10);
  flow.page.drawText(text, { x: MARGIN, y: flow.y, size, font: flow.bold, color: INK });
  flow.y -= size + 10;
}

export function subheading(flow: Flow, text: string, size = 11): void {
  ensureRoom(flow, size + 14);
  flow.y -= 6;
  flow.page.drawText(text, { x: MARGIN, y: flow.y, size, font: flow.bold, color: INK });
  flow.y -= size + 6;
}

export function line(flow: Flow, text: string, size = 10, muted = false): void {
  ensureRoom(flow, size + 6);
  flow.page.drawText(text, {
    x: MARGIN,
    y: flow.y,
    size,
    font: flow.font,
    color: muted ? MUTED : INK,
  });
  flow.y -= size + 6;
}

// Two columns of "label: value" pairs on one line, for compact blocks.
export function row(flow: Flow, label: string, value: string, size = 10): void {
  ensureRoom(flow, size + 6);
  flow.page.drawText(label, { x: MARGIN, y: flow.y, size, font: flow.bold, color: INK });
  flow.page.drawText(value || "-", { x: MARGIN + 160, y: flow.y, size, font: flow.font, color: INK });
  flow.y -= size + 6;
}

export function rule(flow: Flow): void {
  ensureRoom(flow, 12);
  flow.y -= 4;
  flow.page.drawLine({
    start: { x: MARGIN, y: flow.y },
    end: { x: flow.pageSize[0] - MARGIN, y: flow.y },
    thickness: 0.5,
    color: MUTED,
  });
  flow.y -= 10;
}

export function space(flow: Flow, amount = 10): void {
  flow.y -= amount;
}

export function signatureLine(flow: Flow, label: string): void {
  ensureRoom(flow, 40);
  flow.page.drawLine({
    start: { x: MARGIN, y: flow.y },
    end: { x: MARGIN + 200, y: flow.y },
    thickness: 0.75,
    color: INK,
  });
  flow.y -= 14;
  flow.page.drawText(label, { x: MARGIN, y: flow.y, size: 9, font: flow.font, color: MUTED });
  flow.y -= 20;
}

export { MARGIN };
