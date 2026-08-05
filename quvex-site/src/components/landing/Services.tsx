"use client";

import { motion } from "framer-motion";
import { GitBranch, Users, Zap, BarChart3, UsersRound, Link2 } from "lucide-react";
import { useT } from "@/i18n/I18nProvider";

const serviceKeys = [
  { icon: GitBranch, title: "services.item1_title", desc: "services.item1_desc" },
  { icon: Users, title: "services.item2_title", desc: "services.item2_desc" },
  { icon: Zap, title: "services.item3_title", desc: "services.item3_desc" },
  { icon: BarChart3, title: "services.item4_title", desc: "services.item4_desc" },
  { icon: UsersRound, title: "services.item5_title", desc: "services.item5_desc" },
  { icon: Link2, title: "services.item6_title", desc: "services.item6_desc" },
];

export default function Services() {
  const { t } = useT();

  return (
    <section id="services" className="relative py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm text-primary font-medium">{t("services.badge")}</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-3 mb-4">{t("services.title")}</h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">{t("services.desc")}</p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {serviceKeys.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/60 hover:border-primary/30 transition-all duration-300 card-hover"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <service.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t(service.title)}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{t(service.desc)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
