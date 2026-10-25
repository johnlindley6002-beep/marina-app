import type { Dictionary } from "../../types";

export const results: Dictionary["results"] = {
  heading: "Marinas",
  forQuery: (query) => `Marinas for “${query}”`,
  count: (n) => `${n} ${n === 1 ? "marina" : "marinas"}`,
  none: "No marinas match that search. Try a marina, region or country.",
  from: "from",
};
