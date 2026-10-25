import type { Dictionary } from "../../types";

export const results: Dictionary["results"] = {
  heading: "Marinas",
  forQuery: (query) => `Marinas para “${query}”`,
  count: (n) => `${n} ${n === 1 ? "marina" : "marinas"}`,
  none: "Nenhuma marina corresponde à pesquisa. Experimente uma marina, uma região ou um país.",
  from: "desde",
};
