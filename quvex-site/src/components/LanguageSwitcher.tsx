"use client";

import { useState, useRef, useEffect } from "react";
import { useT } from "@/i18n/I18nProvider";
import { locales, localeNames, localeFlags } from "@/i18n/config";
import { Globe } from "lucide-react";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-zinc-800/50"
      >
        <Globe className="w-4 h-4" />
        <span>{localeFlags[locale]} {locale.toUpperCase()}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-50 py-1">
          {locales.map((l) => (
            <button
              key={l}
              onClick={() => { setLocale(l); setOpen(false); }}
              className={`flex items-center gap-3 w-full px-4 py-2 text-sm transition-colors ${
                locale === l
                  ? "text-primary bg-primary/5"
                  : "text-zinc-300 hover:text-white hover:bg-zinc-800"
              }`}
            >
              <span>{localeFlags[l]}</span>
              <span>{localeNames[l]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
