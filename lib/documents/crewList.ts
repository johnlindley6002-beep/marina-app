// The "Crew list" in the IMO FAL Form 5 layout (landscape A4): the standard
// international crew-list fields, filled from the submitted mock data. Only
// offered when the voyage crosses the Schengen external border, or on
// request from the review screen (see getVoyageFlags).

import { PDFFont, PDFPage, rgb } from "pdf-lib";
import type { Marina } from "../../data/marinas";
import type { PreArrivalCheckIn } from "../mockData";
import { A4_LANDSCAPE, createFlow, MARGIN, row, rule, signatureLine, space, subheading } from "./pdfLayout";

const INK = rgb(0.039, 0.102, 0.184);
const MUTED = rgb(0.4, 0.44, 0.49);

const COLUMNS: { key: string; label: string; width: number }[] = [
  { key: "no", label: "6. No.", width: 26 },
  { key: "familyName", label: "7. Family name", width: 100 },
  { key: "givenNames", label: "8. Given names", width: 100 },
  { key: "rank", label: "9. Rank/rating", width: 70 },
  { key: "nationality", label: "10. Nationality", width: 90 },
  { key: "dob", label: "11. Date of birth", width: 70 },
  { key: "pob", label: "12. Place of birth", width: 90 },
  { key: "gender", label: "13. Gender", width: 50 },
  { key: "idNature", label: "14. ID nature", width: 70 },
  { key: "idNumber", label: "15. ID number", width: 90 },
  { key: "idState", label: "16. Issuing state", width: 80 },
  { key: "idExpiry", label: "17. Expiry", width: 66 },
];

function drawTableHeader(page: PDFPage, font: PDFFont, x0: number, y: number): void {
  let x = x0;
  for (const col of COLUMNS) {
    page.drawText(col.label, { x, y, size: 7, font, color: rgb(1, 1, 1) });
    x += col.width;
  }
}

const ROLE_LABEL: Record<string, string> = { skipper: "Skipper", crew: "Crew", guest: "Guest" };

export async function generateCrewListPdf(
  checkIn: PreArrivalCheckIn,
  marina: Marina
): Promise<Uint8Array> {
  const { draft } = checkIn;
  const flow = await createFlow(A4_LANDSCAPE);

  subheading(flow, "Crew list (IMO FAL Form 5)", 14);
  row(flow, "1.1 Name of ship", draft.boatIdentity.name);
  row(flow, "1.2 IMO number", "N/A, pleasure craft");
  row(flow, "1.3 Call sign", draft.boatIdentity.callSign || "-");
  row(flow, "2. Port of arrival", marina.name);
  row(flow, "3. Date of arrival", draft.voyage.arrivalDateTime);
  row(flow, "4. Flag state", draft.boatIdentity.flagCountry);
  row(flow, "5. Last port of call", `${draft.voyage.lastPortName}, ${draft.voyage.lastPortCountry}`);
  rule(flow);

  const rowHeight = 16;
  const tableX = MARGIN;
  space(flow, 4);
  // Header band.
  flow.page.drawRectangle({
    x: tableX,
    y: flow.y - 12,
    width: COLUMNS.reduce((s, c) => s + c.width, 0),
    height: 16,
    color: INK,
  });
  drawTableHeader(flow.page, flow.bold, tableX + 2, flow.y - 8);
  flow.y -= 16;

  for (const [i, person] of draft.people.entries()) {
    if (flow.y - rowHeight < MARGIN + 60) {
      flow.page = flow.doc.addPage(A4_LANDSCAPE);
      flow.y = A4_LANDSCAPE[1] - MARGIN;
      flow.page.drawRectangle({
        x: tableX,
        y: flow.y - 12,
        width: COLUMNS.reduce((s, c) => s + c.width, 0),
        height: 16,
        color: INK,
      });
      drawTableHeader(flow.page, flow.bold, tableX + 2, flow.y - 8);
      flow.y -= 16;
    }
    const values: Record<string, string> = {
      no: String(i + 1),
      familyName: person.familyName,
      givenNames: person.givenNames,
      rank: ROLE_LABEL[person.role] ?? person.role,
      nationality: person.nationality,
      dob: person.dateOfBirth,
      pob: person.placeOfBirth,
      gender: person.gender,
      idNature: person.idType === "passport" ? "Passport" : "National ID",
      idNumber: person.idNumber,
      idState: person.idIssuingState,
      idExpiry: person.idExpiryDate,
    };
    let x = tableX;
    for (const col of COLUMNS) {
      const text = (values[col.key] || "-").slice(0, 22);
      flow.page.drawText(text, { x: x + 2, y: flow.y - 10, size: 7.5, font: flow.font, color: INK });
      x += col.width;
    }
    flow.page.drawLine({
      start: { x: tableX, y: flow.y - rowHeight + 2 },
      end: { x: x, y: flow.y - rowHeight + 2 },
      thickness: 0.4,
      color: MUTED,
    });
    flow.y -= rowHeight;
  }

  space(flow, 16);
  signatureLine(flow, "Date and signature of the master");

  return flow.doc.save();
}
