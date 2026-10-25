import type { Dictionary } from "../../types";
import { plural } from "../../format";

export const results: Dictionary["results"] = {
  heading: "Marinas",
  forQuery: (query) => `Marinas pour «\u00A0${query}\u00A0»`,
  count: (n) => `${n} ${plural("fr", n, { one: "marina", other: "marinas" })}`,
  none: "Aucune marina ne correspond à cette recherche. Essayez une marina, une région ou un pays.",
  from: "à partir de",
};
