import type { Dictionary } from "../../types";
import { plural } from "../../format";

export const berthSearch: Dictionary["berthSearch"] = {
  heading: "Postos de amarração disponíveis",
  subheading: (marinaName) => `Consulte o plano de postos de ${marinaName}.`,
  illustrative: "Dados de demonstração. A marina confirma a disponibilidade.",
  arrival: "Chegada",
  departure: "Partida",
  boatLength: "Comprimento fora a fora (m)",
  lengthPlaceholder: "ex.: 7",
  searchButton: "Procurar",
  errorLength: "Indique o comprimento do seu barco em metros.",
  errorDates: "Escolha uma data de chegada e uma de partida.",
  errorDeparture: "A partida deve ser posterior à chegada.",
  noClass: (cls) =>
    `Este plano ainda não mostra postos da Classe ${cls}. Contacte a marina para embarcações maiores.`,
  noAvailable: "Não há postos livres nessas datas. Experimente outras datas.",
  noFit:
    "Nenhuma classe de posto serve uma embarcação com este comprimento no tarifário atual (máximo 45 m). Contacte a marina.",
  seasonBoth: (low, high) =>
    `A sua estadia abrange as duas épocas: ${low} ${plural("pt", low, { one: "noite", other: "noites" })} em época baixa e ${high} ${plural("pt", high, { one: "noite", other: "noites" })} em época alta.`,
  seasonHigh: "As suas datas estão na época alta (de abril a setembro).",
  seasonLow: "As suas datas estão na época baixa (de janeiro a março e de outubro a dezembro).",
  legendAvailable: "Disponível e adequado",
  legendOccupied: "Ocupado",
  legendUnfit: "Não serve o seu barco",
  legendNeutral: "Ainda sem pesquisa",
  hintBeforeSearch: "Indique as datas e o comprimento da embarcação e pesquise.",
  priceBerthLine: (id, cls, nights) =>
    `Posto ${id} · Classe ${cls} · ${nights} ${plural("pt", nights, { one: "noite", other: "noites" })}`,
  vatNote: (rate) => `Mais IVA (${rate}%) e consumos. Preço indicativo, confirmado pela marina.`,
  ctaHeading: (marinaName) => `Dúvidas sobre um posto em ${marinaName}?`,
  ctaButton: "Contactar a marina",
  mailSubject: "Pedido de posto de amarração - Marina de Cascais",
  mailGreeting: "Exmos. Senhores,",
  mailIntro:
    "Gostaria de saber mais sobre a disponibilidade de postos de amarração na Marina de Cascais.",
  mailArrival: "Chegada",
  mailDeparture: "Partida",
  mailBoatLength: "Comprimento fora a fora",
  mailBerth: "Posto pretendido",
  mailSignoff: "Com os melhores cumprimentos,",
};
