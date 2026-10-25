import { en } from "./locales/en";
import { es } from "./locales/es";
import { fr } from "./locales/fr";
import { pt } from "./locales/pt";
import { mergeDictionary, type Dictionary, type Locale } from "./types";

export { contentLocale, LOCALE_NAMES, LOCALES } from "./types";
export type { Dictionary, Locale } from "./types";
export { marinaContent } from "./marinaContent";

// English and Portuguese are complete. Spanish and French override English for
// the keys they translate; scripts/check-i18n.mjs reports what is missing.
export const translations: Record<Locale, Dictionary> = {
  en,
  pt,
  es: mergeDictionary(en, es),
  fr: mergeDictionary(en, fr),
};
