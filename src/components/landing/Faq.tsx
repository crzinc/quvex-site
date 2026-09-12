"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/I18nProvider";

const faqs = ["faq.q1", "faq.q2", "faq.q3", "faq.q4", "faq.q5"];

export default function Faq() {
  const { t } = useT();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="relative py-24 lg:py-32 scroll-mt-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-sm text-primary font-medium">{t("faq.badge")}</span>
          <h2 className="text-3xl sm:text-4xl font-bold mt-3 mb-4">{t("faq.title")}</h2>
        </motion.div>
        <div className="space-y-3">
          {faqs.map((q, i) => {
            const a = q.replace(".q", ".a");
            const isOpen = open === i;
            return (
              <div key={q} className="rounded-2xl border border-zinc-800 bg-zinc-900/30 overflow-hidden">
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-4 p-4 sm:p-5 text-left"
                >
                  <span className="font-medium text-sm sm:text-base">{t(q)}</span>
                  <ChevronDown className={`w-5 h-5 text-zinc-500 flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <p className="px-4 sm:px-5 pb-5 text-sm text-zinc-400 leading-relaxed">{t(a)}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
        <div className="text-center mt-10">
          <a href="#quiz">
            <Button size="lg">{t("faq.cta")}</Button>
          </a>
        </div>
      </div>
    </section>
  );
}
