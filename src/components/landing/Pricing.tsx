"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/I18nProvider";

// Тарифы повторяют seed из supabase-schema.sql: trial/basic/standard/premium
const plans = [
  { code: "basic", priceKey: "pricing.basic_price", nameKey: "pricing.basic_name", descKey: "pricing.basic_desc", features: ["pricing.f_clients_50", "pricing.f_all"] },
  { code: "standard", priceKey: "pricing.standard_price", nameKey: "pricing.standard_name", descKey: "pricing.standard_desc", features: ["pricing.f_clients_200", "pricing.f_all", "pricing.f_priority"], popular: true },
  { code: "premium", priceKey: "pricing.premium_price", nameKey: "pricing.premium_name", descKey: "pricing.premium_desc", features: ["pricing.f_clients_unlim", "pricing.f_all", "pricing.f_priority", "pricing.f_personal"] },
];

export default function Pricing() {
  const { t } = useT();
  return (
    <section id="pricing" className="relative py-24 lg:py-32 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm text-primary font-medium">{t("pricing.badge")}</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-3 mb-4">{t("pricing.title")}</h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">{t("pricing.desc")}</p>
          <p className="text-sm text-emerald-400 mt-3">{t("pricing.trial_note")}</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.code}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative p-6 sm:p-8 rounded-2xl border bg-zinc-900/30 flex flex-col ${
                plan.popular ? "border-primary/50 glow" : "border-zinc-800"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs px-3 py-1 rounded-full bg-primary text-white font-medium">
                  {t("pricing.popular")}
                </span>
              )}
              <h3 className="text-lg font-semibold">{t(plan.nameKey)}</h3>
              <p className="text-sm text-zinc-500 mt-1 mb-4">{t(plan.descKey)}</p>
              <p className="text-3xl font-bold mb-6">{t(plan.priceKey)}</p>
              <ul className="space-y-2.5 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-zinc-300">
                    <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    {t(f)}
                  </li>
                ))}
              </ul>
              <a href="#quiz" className="block">
                <Button variant={plan.popular ? "primary" : "outline"} className="w-full">
                  {t("pricing.cta")}
                </Button>
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
