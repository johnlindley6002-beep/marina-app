import type { Dictionary } from "../../types";

export const berthSearch: Dictionary["berthSearch"] = {
  heading: "Amarrações disponíveis",
  subheading: (marinaName) => `Consulte a disponibilidade simulada de amarrações em ${marinaName}.`,
  illustrative: "A disponibilidade de amarrações apresentada é meramente ilustrativa, por agora.",
  arrival: "Chegada",
  departure: "Partida",
  boatLength: "Comprimento fora a fora (m)",
  lengthPlaceholder: "ex.: 7",
  searchButton: "Procurar",
  errorLength: "Indique o comprimento do seu barco em metros.",
  errorDates: "Escolha uma data de chegada e uma de partida.",
  errorDeparture: "A partida deve ser posterior à chegada.",
  noClass: (cls) =>
    `Ainda não há amarrações da Classe ${cls} neste esquema. As classes de embarcações maiores serão adicionadas em breve.`,
  noAvailable: "Não há amarrações disponíveis para estas datas. Experimente outras datas.",
  noFit:
    "Nenhuma classe de amarração serve uma embarcação com este comprimento no tarifário atual (máx. 45 m). Contacte a marina diretamente.",
  seasonBoth: (low, high) =>
    `A sua estadia abrange as duas épocas: ${low} noite${low === 1 ? "" : "s"} em época baixa e ${high} noite${high === 1 ? "" : "s"} em época alta.`,
  seasonHigh: "As suas datas caem na época alta (abr.–set.).",
  seasonLow: "As suas datas caem na época baixa (jan.–mar. e out.–dez.).",
  legendAvailable: "Disponível e adequada",
  legendOccupied: "Ocupada",
  legendUnfit: "Não serve o seu barco",
  legendNeutral: "Ainda sem pesquisa",
  hintBeforeSearch:
    "Indique as datas e o comprimento do barco e pesquise para ver a disponibilidade.",
  priceBerthLine: (id, cls, nights) =>
    `Amarração ${id} · Classe ${cls} · ${nights} noite${nights === 1 ? "" : "s"}`,
  vatNote: (rate) => `+ IVA (${rate}%) e consumos. Valor estimado, a confirmar com a marina.`,
  ctaHeading: (marinaName) => `Dúvidas sobre uma amarração em ${marinaName}?`,
  ctaButton: "Contactar a marina",
  mailSubject: "Pedido de amarração - Marina de Cascais",
  mailGreeting: "Boa tarde,",
  mailIntro: "Gostaria de saber mais sobre a disponibilidade de amarrações na Marina de Cascais.",
  mailArrival: "Chegada",
  mailDeparture: "Partida",
  mailBoatLength: "Comprimento fora a fora",
  mailBerth: "Amarração pretendida",
  mailSignoff: "Com os melhores cumprimentos,",
};
