"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Phone, MapPin, Send, Check, MessageCircle, AtSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { submitContact } from "@/lib/actions";
import { toast } from "sonner";
import { useT } from "@/i18n/I18nProvider";

const PHONE_DISPLAY = "+994 10 475 93 23";
const PHONE_LINK = "tel:+994104759323";
const WHATSAPP_LINK = "https://wa.me/994104759323";
const TELEGRAM_LINK = "https://t.me/quvexcrm";
const INSTAGRAM_LINK = "https://instagram.com/quvex.official";

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const { t } = useT();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error(t("contact.fill_error"));
      return;
    }
    setLoading(true);
    const result = await submitContact(form);
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      setSubmitted(true);
      toast.success(t("contact.success_title"));
    }
  };

  return (
    <section id="contact" className="relative py-24 lg:py-32 scroll-mt-20">
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
            className="space-y-6"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium mb-1">{t("contact.phone_label")}</p>
                <a href={PHONE_LINK} className="text-sm text-zinc-400 hover:text-white transition-colors">{PHONE_DISPLAY}</a>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium mb-1">{t("contact.address_label")}</p>
                <p className="text-sm text-zinc-400">Baku, Azerbaijan</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-300 hover:bg-emerald-500/20 transition-colors"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
              <a
                href={TELEGRAM_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sm text-sky-300 hover:bg-sky-500/20 transition-colors"
              >
                <Send className="w-4 h-4" /> Telegram
              </a>
              <a
                href={INSTAGRAM_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-pink-500/10 border border-pink-500/20 text-sm text-pink-300 hover:bg-pink-500/20 transition-colors"
              >
                <AtSign className="w-4 h-4" /> Instagram
              </a>
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
                  <Input id="contact-name" label={t("contact.name_placeholder")} placeholder={t("contact.name_placeholder")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoComplete="name" />
                  <Input id="contact-email" label={t("contact.email_placeholder")} type="email" placeholder={t("contact.email_placeholder")} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required autoComplete="email" />
                </div>
                <Input id="contact-subject" label={t("contact.subject_placeholder")} placeholder={t("contact.subject_placeholder")} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
                <div className="space-y-1.5">
                  <label htmlFor="contact-message" className="text-sm text-zinc-400 block">{t("contact.desc_placeholder")}</label>
                  <Textarea id="contact-message" placeholder={t("contact.desc_placeholder")} rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
                </div>
                <Button type="submit" size="lg" className="w-full" loading={loading}>
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
