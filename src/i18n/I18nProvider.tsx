"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
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
  t: (key: string, params?: Record<string, string | number>) => string;
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
  // Всегда стартуем с defaultLocale, чтобы первый клиентский рендер
  // совпадал с серверным. Локаль из cookie подхватываем в useEffect.
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [messages, setMessages] = useState(allMessages[defaultLocale]);

  useEffect(() => {
    const saved = getInitialLocale();
    if (saved !== defaultLocale) {
      // Синхронизация с внешним источником (cookie) — легитимный useEffect
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocaleState(saved);
      setMessages(allMessages[saved]);
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    setMessages(allMessages[l]);
    document.cookie = `quvex-locale=${l}; path=/; max-age=31536000`;
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      let str = messages[key] || allMessages.ru[key] || key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          str = str.replace(`{${k}}`, String(v));
        }
      }
      return str;
    },
    [messages],
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}
