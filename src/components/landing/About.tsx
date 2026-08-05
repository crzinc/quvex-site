"use client";

import { motion } from "framer-motion";
import { Building2, TrendingUp, Headphones, Shield } from "lucide-react";
import { useT } from "@/i18n/I18nProvider";

const statKeys = [
  { icon: Building2, value: "about.stat1_value", label: "about.stat1_label" },
  { icon: TrendingUp, value: "about.stat2_value", label: "about.stat2_label" },
  { icon: Headphones, value: "about.stat3_value", label: "about.stat3_label" },
  { icon: Shield, value: "about.stat4_value", label: "about.stat4_label" },
];

export default function About() {
  const { t } = useT();

  return (
    <section id="about" className="relative py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
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
            className="grid grid-cols-2 gap-4"
          >
            {statKeys.map((stat) => (
              <div
                key={stat.label}
                className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 text-center"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
                <p className="text-2xl font-bold gradient-text">{t(stat.value)}</p>
                <p className="text-xs text-zinc-500 mt-1">{t(stat.label)}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
