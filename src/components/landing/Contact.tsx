"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useT } from "@/i18n/I18nProvider";

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const { t } = useT();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <section id="contact" className="relative py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm text-primary font-medium">{t("contact.badge")}</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-3 mb-4">{t("contact.title")}</h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">{t("contact.desc")}</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium mb-1">Email</p>
                <p className="text-sm text-zinc-400">hello@quvex.dev</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium mb-1">{t("contact.badge")}</p>
                <p className="text-sm text-zinc-400">+7 (999) 999-99-99</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium mb-1">Location</p>
                <p className="text-sm text-zinc-400">Moscow, Russia</p>
              </div>
            </div>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {submitted ? (
              <div className="p-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="font-medium text-emerald-400">{t("contact.success_title")}</p>
                <p className="text-sm text-zinc-400 mt-1">{t("contact.success_desc")}</p>
              </div>
            ) : (
              <>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input placeholder={t("contact.name_placeholder")} />
                  <Input type="email" placeholder={t("contact.email_placeholder")} />
                </div>
                <Input placeholder={t("contact.subject_placeholder")} />
                <Textarea placeholder={t("contact.desc_placeholder")} rows={4} />
                <Button type="submit" size="lg" className="w-full">
                  <Send className="w-4 h-4" />
                  {t("contact.send_btn")}
                </Button>
              </>
            )}
          </motion.form>
        </div>
      </div>
    </section>
  );
}
