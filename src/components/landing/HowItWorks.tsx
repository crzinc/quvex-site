"use client";

import { motion } from "framer-motion";
import { ClipboardList, Settings2, CalendarCheck } from "lucide-react";
import { useT } from "@/i18n/I18nProvider";

const steps = [
  { icon: ClipboardList, title: "how.step1_title", desc: "how.step1_desc" },
  { icon: Settings2, title: "how.step2_title", desc: "how.step2_desc" },
  { icon: CalendarCheck, title: "how.step3_title", desc: "how.step3_desc" },
];

export default function HowItWorks() {
  const { t } = useT();
  return (
    <section id="how" className="relative py-24 lg:py-32 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm text-primary font-medium">{t("how.badge")}</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-3 mb-4">{t("how.title")}</h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">{t("how.desc")}</p>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <s.icon className="w-6 h-6 text-primary" />
                </div>
                <span className="text-4xl font-bold text-zinc-800">{i + 1}</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">{t(s.title)}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{t(s.desc)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
