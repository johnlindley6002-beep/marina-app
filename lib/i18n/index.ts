import { en } from "./locales/en";
import { es } from "./locales/es";
import { fr } from "./locales/fr";
import { pt } from "./locales/pt";
import type { Dictionary, Locale } from "./types";

export { contentLocale, LOCALE_NAMES, LOCALES } from "./types";
export type { Dictionary, Locale } from "./types";
export { marinaContent } from "./marinaContent";

// All four dictionaries are complete; scripts/check-i18n.mjs keeps them so.
export const translations: Record<Locale, Dictionary> = { en, pt, es, fr };
