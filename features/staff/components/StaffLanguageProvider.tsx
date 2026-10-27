"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { staffEn, type StaffDictionary } from "@/lib/i18n/staff/en";
import { staffPt } from "@/lib/i18n/staff/pt";

export type StaffLang = "en" | "pt";

const STORAGE_KEY = "aldock-staff-language";
const DICTIONARIES: Record<StaffLang, StaffDictionary> = { en: staffEn, pt: staffPt };
// The locale used to format dates and numbers in each staff language.
const DATE_LOCALE: Record<StaffLang, string> = { en: "en-GB", pt: "pt-PT" };

type StaffLanguageValue = {
  lang: StaffLang;
  setLang: (lang: StaffLang) => void;
  s: StaffDictionary;
  dateLocale: string;
};

const StaffLanguageContext = createContext<StaffLanguageValue | null>(null);

function readStored(): StaffLang | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "en" || stored === "pt" ? stored : null;
  } catch {
    return null;
  }
}

// The staff area's own language: English or European Portuguese, chosen with
// the switch in the staff top bar and remembered on this device. Until a
// choice is made it follows the site language when that is Portuguese.
export function StaffLanguageProvider({ children }: { children: ReactNode }) {
  const { locale } = useLanguage();
  const [chosen, setChosen] = useState<StaffLang | null>(null);

  useEffect(() => {
    setChosen(readStored());
  }, []);

  const lang: StaffLang = chosen ?? (locale === "pt" ? "pt" : "en");

  function setLang(next: StaffLang) {
    setChosen(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage blocked: the choice lasts until the page is reloaded.
    }
  }

  return (
    <StaffLanguageContext.Provider
      value={{ lang, setLang, s: DICTIONARIES[lang], dateLocale: DATE_LOCALE[lang] }}
    >
      {children}
    </StaffLanguageContext.Provider>
  );
}

export function useStaffText(): StaffLanguageValue {
  const ctx = useContext(StaffLanguageContext);
  if (!ctx) throw new Error("useStaffText must be used inside StaffLanguageProvider");
  return ctx;
}
