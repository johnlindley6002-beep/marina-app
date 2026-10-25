import type { Dictionary } from "../../types";
import { plural } from "../../format";

export const results: Dictionary["results"] = {
  heading: "Marinas",
  forQuery: (query) => `Marinas para “${query}”`,
  count: (n) => `${n} ${plural("es", n, { one: "marina", other: "marinas" })}`,
  none: "Ninguna marina coincide con la búsqueda. Pruebe con una marina, una región o un país.",
  from: "desde",
};
