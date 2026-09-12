"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useT } from "@/i18n/I18nProvider";

const pointKeys = ["about.point1", "about.point2", "about.point3", "about.point4"];

export default function About() {
  const { t } = useT();

  return (
    <section id="about" className="relative py-24 lg:py-32 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-sm text-primary font-medium">{t("about.badge")}</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-3 mb-6">
              {t("about.title")}{" "}
              <span className="gradient-text">{t("about.title_accent")}</span>
            </h2>
            <p className="text-zinc-400 leading-relaxed mb-6">{t("about.desc1")}</p>
            <p className="text-zinc-500 leading-relaxed">{t("about.desc2")}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            {pointKeys.map((key) => (
              <div
                key={key}
                className="flex items-start gap-3 p-4 sm:p-5 rounded-2xl border border-zinc-800 bg-zinc-900/30"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed">{t(key)}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
