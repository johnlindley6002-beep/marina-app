"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  defaultDictionary,
  loadDictionary,
  LOCALES,
  type Dictionary,
  type Locale,
} from "@/lib/i18n";

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Dictionary;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "aldock-locale";

// The language and its dictionary change together: the old language stays on
// screen until the new dictionary has arrived, so the page never shows a mix.
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ locale: Locale; t: Dictionary }>({
    locale: "en",
    t: defaultDictionary,
  });

  function switchTo(locale: Locale) {
    loadDictionary(locale).then((t) => setState({ locale, t }));
  }

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored && stored !== "en" && (LOCALES as string[]).includes(stored)) {
        loadDictionary(stored as Locale).then((t) => setState({ locale: stored as Locale, t }));
      }
    } catch {
      // localStorage unavailable (private browsing, etc): default stands.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = state.locale;
  }, [state.locale]);

  const setLocale = (next: Locale) => {
    switchTo(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore: nothing to persist to, session state still updates.
    }
  };

  const value = useMemo(
    () => ({ locale: state.locale, setLocale, t: state.t }),
    // setLocale only closes over setState, which never changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
