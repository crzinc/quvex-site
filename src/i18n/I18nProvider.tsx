"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { Locale } from "./config";
import { defaultLocale, locales } from "./config";
import ru from "@/messages/ru.json";
import en from "@/messages/en.json";
import az from "@/messages/az.json";

const allMessages: Record<Locale, Record<string, string>> = {
  ru: ru as Record<string, string>,
  en: en as Record<string, string>,
  az: az as Record<string, string>,
};

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  locale: defaultLocale,
  setLocale: () => {},
  t: (k: string) => allMessages[defaultLocale][k] || k,
});

export function useT() {
  return useContext(I18nContext);
}

function getInitialLocale(): Locale {
  if (typeof window === "undefined") return defaultLocale;
  const match = document.cookie.split("; ").find((r) => r.startsWith("quvex-locale="));
  const val = match?.split("=")[1] as Locale;
  return val && locales.includes(val) ? val : defaultLocale;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const initial = getInitialLocale();
  const [locale, setLocaleState] = useState<Locale>(initial);
  const [messages, setMessages] = useState(allMessages[initial]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    setMessages(allMessages[l]);
    document.cookie = `quvex-locale=${l}; path=/; max-age=31536000`;
  }, []);

  const t = useCallback(
    (key: string) => messages[key] || allMessages.ru[key] || key,
    [messages],
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}
