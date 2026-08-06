"use client";

import { motion } from "framer-motion";
import { ExternalLink, Building2, Monitor, GraduationCap } from "lucide-react";
import { useT } from "@/i18n/I18nProvider";

const projectKeys = [
  {
    icon: Building2,
    title: "portfolio.project1_title",
    desc: "portfolio.project1_desc",
    tags: ["portfolio.project1_tag1", "portfolio.project1_tag2", "portfolio.project1_tag3"],
  },
  {
    icon: Monitor,
    title: "portfolio.project2_title",
    desc: "portfolio.project2_desc",
    tags: ["portfolio.project2_tag1", "portfolio.project2_tag2", "portfolio.project2_tag3"],
  },
  {
    icon: GraduationCap,
    title: "portfolio.project3_title",
    desc: "portfolio.project3_desc",
    tags: ["portfolio.project3_tag1", "portfolio.project3_tag2", "portfolio.project3_tag3"],
  },
];

export default function Portfolio() {
  const { t } = useT();

  return (
    <section id="portfolio" className="relative py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm text-primary font-medium">{t("portfolio.badge")}</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-3 mb-4">{t("portfolio.title")}</h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">{t("portfolio.desc")}</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {projectKeys.map((project, index) => (
            <motion.div
              key={project.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="group p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/60 transition-all duration-300 card-hover"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <project.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t(project.title)}</h3>
              <p className="text-sm text-zinc-400 mb-4">{t(project.desc)}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400"
                  >
                    {t(tag)}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-1 text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                {t("portfolio.details")} <ExternalLink className="w-3 h-3" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
