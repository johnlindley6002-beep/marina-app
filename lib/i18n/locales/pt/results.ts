import type { Dictionary } from "../../types";
import { plural } from "../../format";

export const results: Dictionary["results"] = {
  heading: "Marinas",
  forQuery: (query) => `Marinas para “${query}”`,
  count: (n) => `${n} ${plural("pt", n, { one: "marina", other: "marinas" })}`,
  none: "Nenhuma marina corresponde à pesquisa. Experimente uma marina, uma região ou um país.",
  from: "desde",
};
