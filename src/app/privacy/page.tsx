"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useT } from "@/i18n/I18nProvider";
import Footer from "@/components/landing/Footer";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function PrivacyPage() {
  const { t } = useT();

  const sections = [
    { title: "privacy.data_title", body: "privacy.data" },
    { title: "privacy.use_title", body: "privacy.use" },
    { title: "privacy.cookies_title", body: "privacy.cookies" },
    { title: "privacy.sharing_title", body: "privacy.sharing" },
    { title: "privacy.security_title", body: "privacy.security" },
    { title: "privacy.rights_title", body: "privacy.rights" },
  ];

  return (
    <>
      <div className="min-h-screen">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Link href="/" className="flex items-center gap-3 mb-12">
            <Image src="/logo.png" alt="Quvex CRM" width={48} height={48} className="rounded-xl" />
            <span className="text-xl font-bold gradient-text">Quvex CRM</span>
          </Link>

          <div className="flex justify-end -mt-14 mb-6">
            <LanguageSwitcher />
          </div>

          <Link href="/" className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white transition-colors mb-8">
            <ChevronLeft className="w-4 h-4" /> {t("privacy.back")}
          </Link>

          <h1 className="text-3xl sm:text-4xl font-bold mb-3">{t("privacy.title")}</h1>
          <p className="text-sm text-zinc-500 mb-12">{t("privacy.updated")}</p>

          <div className="space-y-10">
            <section>
              <p className="text-sm text-zinc-400 leading-relaxed">{t("privacy.intro")}</p>
            </section>

            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-lg font-semibold mb-3">{t(section.title)}</h2>
                <p className="text-sm text-zinc-400 leading-relaxed">{t(section.body)}</p>
              </section>
            ))}

            <section>
              <h2 className="text-lg font-semibold mb-3">{t("privacy.contact_title")}</h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {t("privacy.contact")}{" "}
                <a href="mailto:owner@quvex.org" className="text-primary hover:underline">
                  owner@quvex.org
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}