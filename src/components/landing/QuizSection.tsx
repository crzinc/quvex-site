"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, Sparkles, Building2, Monitor, ShoppingBag, GraduationCap, Stethoscope, Plane, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitQuiz } from "@/lib/actions";
import { toast } from "sonner";
import { useT } from "@/i18n/I18nProvider";

const questions = [
  {
    id: "business_type",
    question: "quiz.q1_question",
    options: [
      { value: "detailing", label: "quiz.q1_opt1", icon: ShoppingBag },
      { value: "wash", label: "quiz.q1_opt2", icon: Building2 },
      { value: "polishing", label: "quiz.q1_opt3", icon: Monitor },
      { value: "interior", label: "quiz.q1_opt4", icon: GraduationCap },
      { value: "tinting", label: "quiz.q1_opt5", icon: Stethoscope },
      { value: "other", label: "quiz.q1_opt6", icon: Plane },
    ],
  },
  {
    id: "needs",
    question: "quiz.q2_question",
    options: [
      { value: "1", label: "quiz.q2_opt1" },
      { value: "2-3", label: "quiz.q2_opt2" },
      { value: "4-6", label: "quiz.q2_opt3" },
      { value: "7plus", label: "quiz.q2_opt4" },
      { value: "chain", label: "quiz.q2_opt5" },
      { value: "planning", label: "quiz.q2_opt6" },
    ],
  },
  {
    id: "budget",
    question: "quiz.q3_question",
    options: [
      { value: "0-100", label: "quiz.q3_opt1" },
      { value: "100-300", label: "quiz.q3_opt2" },
      { value: "300-600", label: "quiz.q3_opt3" },
      { value: "600plus", label: "quiz.q3_opt4" },
    ],
  },
  {
    id: "timeline",
    question: "quiz.q4_question",
    options: [
      { value: "asap", label: "quiz.q4_opt1" },
      { value: "month", label: "quiz.q4_opt2" },
      { value: "quarter", label: "quiz.q4_opt3" },
      { value: "exploring", label: "quiz.q4_opt4" },
    ],
  },
];

export default function QuizSection() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [contact, setContact] = useState({ name: "", email: "", phone: "" });
  const [consent, setConsent] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { t } = useT();

  const currentQuestion = questions[step];
  const progress = ((step + 1) / questions.length) * 100;

  const handleSelect = (value: string) => {
    setAnswers({ ...answers, [currentQuestion.id]: value });
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      setShowContact(true);
    }
  };

  const handleSubmit = async () => {
    if (!contact.name.trim() || !contact.email.trim()) {
      toast.error(t("common.fill_name_email"));
      return;
    }
    if (!consent) {
      toast.error(t("quiz.consent_error"));
      return;
    }
    setLoading(true);
    const result = await submitQuiz({ answers, contact, consent });
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      setSubmitted(true);
    }
  };

  return (
    <section id="quiz" className="relative py-24 lg:py-32 scroll-mt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-sm text-primary font-medium">{t("quiz.badge")}</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-3 mb-4">
            {t("quiz.title")}
            <span className="block text-primary text-2xl sm:text-3xl lg:text-4xl mt-3">{t("quiz.title_suffix")}</span>
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">{t("quiz.desc")}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-5 sm:p-8 lg:p-12 glow"
        >
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3">{t("quiz.success_title")}</h3>
              <p className="text-zinc-400 mb-6">{t("quiz.success_desc")}</p>
              <div className="flex items-center justify-center gap-2 text-sm text-primary">
                <Sparkles className="w-4 h-4" />
                {t("quiz.success_hint")}
              </div>
            </motion.div>
          ) : showContact ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <h3 className="text-xl font-semibold text-center mb-6">{t("quiz.contact_title")}</h3>
              <div className="grid gap-4 max-w-md mx-auto">
                <Input
                  id="quiz-name"
                  label={t("quiz.label_name")}
                  placeholder={t("form.name_placeholder")}
                  value={contact.name}
                  onChange={(e) => setContact({ ...contact, name: e.target.value })}
                  required
                  autoComplete="name"
                />
                <Input
                  id="quiz-email"
                  label={t("quiz.label_email")}
                  type="email"
                  placeholder={t("form.email_placeholder")}
                  value={contact.email}
                  onChange={(e) => setContact({ ...contact, email: e.target.value })}
                  required
                  autoComplete="email"
                />
                <Input
                  id="quiz-phone"
                  label={t("quiz.label_phone")}
                  type="tel"
                  placeholder={t("form.phone_placeholder")}
                  value={contact.phone}
                  onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                  autoComplete="tel"
                />
                <label htmlFor="quiz-consent" className="flex items-start gap-2.5 text-xs text-zinc-400 cursor-pointer leading-relaxed">
                  <input
                    id="quiz-consent"
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded accent-purple-500"
                  />
                  <span>{t("quiz.consent_text")}</span>
                </label>
                <Button
                  size="lg"
                  className="w-full mt-4"
                  onClick={handleSubmit}
                  loading={loading}
                >
                  {t("quiz.submit_btn")}
                  <ChevronRight className="w-5 h-5" />
                </Button>
                <button
                  onClick={() => setShowContact(false)}
                  className="text-sm text-zinc-500 hover:text-zinc-300 text-center mt-2"
                >
                  ← {t("quiz.back_btn")}
                </button>
              </div>
            </motion.div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-8" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={questions.length} aria-label={t("quiz.desc")}>
                <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
                <span className="text-sm text-zinc-500">{step + 1} / {questions.length}</span>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <h3 className="text-xl sm:text-2xl font-semibold mb-8 text-center">{t(currentQuestion.question)}</h3>

                  <div className="grid sm:grid-cols-2 gap-3">
                    {currentQuestion.options.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleSelect(option.value)}
                        className="quiz-option p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 text-left hover:border-primary/30 hover:bg-zinc-800/50 flex items-center gap-3"
                      >
                        {"icon" in option && option.icon && (
                          <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                            <option.icon className="w-5 h-5 text-zinc-400" />
                          </div>
                        )}
                        <span className="text-sm font-medium">{t(option.label)}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="flex justify-between mt-8">
                <button
                  onClick={() => setStep(Math.max(0, step - 1))}
                  className={`text-sm text-zinc-500 hover:text-zinc-300 flex items-center gap-1 ${step === 0 ? "invisible" : ""}`}
                >
                  <ArrowLeft className="w-4 h-4" /> {t("quiz.prev_btn")}
                </button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </section>
  );
}
