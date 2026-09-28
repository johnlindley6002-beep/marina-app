// The "Arrival declaration" (Declaração de chegada): a bilingual PT/EN, A4
// summary of everything collected in the pre-arrival wizard, generated
// entirely client-side from the submitted mock data. Not a real customs or
// immigration form; a calm paper record for the skipper to bring to the desk.

import type { Marina } from "../../data/marinas";
import type { PreArrivalCheckIn } from "../mockData";
import { getDocumentRequirements } from "../prearrival/documentRules";
import { calculateIndicativeQuote } from "../prearrival/pricing";
import { A4_PORTRAIT, createFlow, heading, line, row, rule, signatureLine, space, subheading } from "./pdfLayout";

export async function generateArrivalDeclarationPdf(
  checkIn: PreArrivalCheckIn,
  marina: Marina
): Promise<Uint8Array> {
  const { draft } = checkIn;
  const flow = await createFlow(A4_PORTRAIT);

  heading(flow, marina.name);
  line(flow, "[Marina logo]", 9, true);
  space(flow, 4);
  heading(flow, "Arrival declaration / Declaração de chegada", 13);
  row(flow, "Reference / Referência", checkIn.referenceCode);
  row(flow, "Submitted / Enviado em", new Date(checkIn.submittedAt).toLocaleString());
  rule(flow);

  subheading(flow, "Owner / Proprietário");
  row(flow, "Name / Nome", draft.owner.fullName);
  row(flow, "ID or passport / Documento", draft.owner.idDocumentNumber);
  row(flow, "Country of residence / País de residência", draft.owner.countryOfResidence);
  if (draft.owner.taxNumber) row(flow, "Tax number (NIF) / NIF", draft.owner.taxNumber);
  row(flow, "Email", draft.owner.email);
  row(flow, "Phone / Telefone", draft.owner.phone);
  rule(flow);

  subheading(flow, "Boat / Embarcação");
  row(flow, "Name / Nome", draft.boatIdentity.name);
  row(flow, "Registration / Registo", draft.boatIdentity.registrationNumber);
  row(flow, "Flag / Bandeira", draft.boatIdentity.flagCountry);
  row(flow, "Port of registry / Porto de registo", draft.boatIdentity.portOfRegistry);
  row(flow, "Length overall / Comprimento", `${draft.boatSpecs.lengthOverall} m`);
  row(flow, "Beam / Boca", `${draft.boatSpecs.beam} m`);
  row(flow, "Draught / Calado", `${draft.boatSpecs.draught} m`);
  row(flow, "Propulsion / Propulsão", draft.boatSpecs.propulsion);
  rule(flow);

  subheading(flow, "Voyage / Viagem");
  row(flow, "Last port / Último porto", `${draft.voyage.lastPortName}, ${draft.voyage.lastPortCountry}`);
  row(flow, "Next port / Próximo porto", `${draft.voyage.nextPortName}, ${draft.voyage.nextPortCountry}`);
  row(flow, "Arrival / Chegada", draft.voyage.arrivalDateTime);
  row(flow, "Departure / Partida", draft.voyage.departureDateTime);
  rule(flow);

  subheading(flow, "Stay / Estadia");
  row(flow, "Arrival date / Data de chegada", draft.stay.requestedArrival);
  row(flow, "Departure date / Data de partida", draft.stay.requestedDeparture);
  const quote = calculateIndicativeQuote(marina, {
    lengthM: Number(draft.boatSpecs.lengthOverall) || 0,
    beamM: Number(draft.boatSpecs.beam) || 0,
    isMultihull: draft.boatSpecs.isMultihull,
    arrival: draft.stay.requestedArrival,
    departure: draft.stay.requestedDeparture,
  });
  if (quote) {
    row(flow, "Berth class / Classe", quote.marinaClass);
    row(
      flow,
      "Price estimate / Preço estimado",
      `€${quote.totalIncVatEur.toFixed(2)} (incl. VAT / IVA incluído)`
    );
  }
  line(flow, "A deposit is paid at check-in and adjusted at departure.", 9, true);
  line(flow, "Um depósito é pago no check-in e ajustado na partida.", 9, true);
  rule(flow);

  subheading(flow, "Documents / Documentos");
  for (const req of getDocumentRequirements(draft)) {
    const entry = draft.documents[req.key];
    const status = entry.number.trim()
      ? `${entry.number}${entry.expiryDate ? `, exp. ${entry.expiryDate}` : ""}`
      : req.required
        ? "Missing / Em falta"
        : "Not provided / Não fornecido";
    row(flow, req.label, status);
  }
  rule(flow);

  subheading(flow, "Consents / Consentimentos");
  line(
    flow,
    `GDPR consent given / Consentimento RGPD dado: ${draft.consents.gdprConsent ? "Yes / Sim" : "No / Não"}`
  );
  line(
    flow,
    `Marina regulation accepted / Regulamento da marina aceite: ${draft.consents.termsAccepted ? "Yes / Sim" : "No / Não"}`
  );
  line(
    flow,
    `Declaration true / Declaração verdadeira: ${draft.consents.declarationTrue ? "Yes / Sim" : "No / Não"}`
  );
  line(flow, `Timestamp / Data e hora: ${new Date(checkIn.submittedAt).toLocaleString()}`, 9, true);
  space(flow, 20);

  signatureLine(flow, "Skipper / Comandante");
  signatureLine(flow, "Marina staff / Funcionário da marina");

  return flow.doc.save();
}
