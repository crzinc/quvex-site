"use client";

import { useState, useRef, useEffect } from "react";
import { useT } from "@/i18n/I18nProvider";
import { locales, localeNames, localeFlags } from "@/i18n/config";
import { Globe, Check, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
        className={`flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-zinc-800/50 ${open ? "text-white bg-zinc-800/50" : ""}`}
      >
        <Globe className="w-4 h-4" />
        <span>{localeFlags[locale]} {locale.toUpperCase()}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 top-full mt-1 w-44 bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-xl shadow-2xl shadow-black/50 z-50 p-1"
          >
            {locales.map((l) => (
              <button
                key={l}
                onClick={() => { setLocale(l); setOpen(false); }}
                className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                  locale === l
                    ? "text-primary bg-primary/10"
                    : "text-zinc-300 hover:text-white hover:bg-zinc-800"
                }`}
              >
                <span>{localeFlags[l]}</span>
                <span className="flex-1 text-left">{localeNames[l]}</span>
                {locale === l && <Check className="w-4 h-4 text-primary" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
