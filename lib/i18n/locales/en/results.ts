import type { Dictionary } from "../../types";
import { plural } from "../../format";

export const results: Dictionary["results"] = {
  heading: "Marinas",
  forQuery: (query) => `Marinas for “${query}”`,
  count: (n) => `${n} ${plural("en", n, { one: "marina", other: "marinas" })}`,
  none: "No marinas match that search. Try a marina, region or country.",
  from: "from",
};
