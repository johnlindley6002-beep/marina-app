import { en } from "./locales/en";
import type { Dictionary, Locale } from "./types";

export { contentLocale, LOCALE_NAMES, LOCALES } from "./types";
export type { Dictionary, Locale } from "./types";
export { marinaContent } from "./marinaContent";

// English ships with the page (it is the default and the first paint). The
// other three are separate chunks, fetched only when that language is chosen,
// so a visitor never downloads the three they do not read. All four are kept
// complete by scripts/check-i18n.mjs.
export const defaultDictionary: Dictionary = en;

export async function loadDictionary(locale: Locale): Promise<Dictionary> {
  switch (locale) {
    case "pt":
      return (await import("./locales/pt")).pt;
    case "es":
      return (await import("./locales/es")).es;
    case "fr":
      return (await import("./locales/fr")).fr;
    default:
      return en;
  }
}
