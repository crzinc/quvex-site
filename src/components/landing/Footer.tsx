"use client";

import Image from "next/image";
import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import { useT } from "@/i18n/I18nProvider";

const navLinks = [
  { href: "#services", key: "nav.services" },
  { href: "#about", key: "nav.about" },
  { href: "#portfolio", key: "nav.portfolio" },
  { href: "#quiz", key: "nav.quiz" },
  { href: "#contact", key: "nav.contact" },
];

export default function Footer() {
  const { t } = useT();

  return (
    <footer className="border-t border-zinc-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-10">
          <div>
            <Link href="/" className="flex items-center gap-3 mb-4">
              <Image src="/logo.png" alt="Quvex CRM" width={64} height={64} className="rounded-xl" />
              <span className="text-xl font-bold gradient-text">Quvex CRM</span>
            </Link>
            <p className="text-sm text-zinc-500 max-w-sm">{t("footer.desc")}</p>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-4">{t("footer.nav_title")}</h4>
            <ul className="space-y-2 text-sm">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="text-zinc-500 hover:text-white transition-colors">
                    {t(link.key)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-4">{t("footer.contacts_title")}</h4>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li>
                <a href="mailto:owner@quvex.org" className="flex items-center gap-2 hover:text-white transition-colors">
                  <Mail className="w-4 h-4" /> owner@quvex.org
                </a>
              </li>
              <li>
                <a href="tel:+994104759323" className="flex items-center gap-2 hover:text-white transition-colors">
                  <Phone className="w-4 h-4" /> +994 10 475 93 23
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Baku, Azerbaijan
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-zinc-800/50 mt-10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-zinc-600">
            © {new Date().getFullYear()} Quvex. {t("footer.rights")}
          </p>
          <div className="flex gap-6 text-xs text-zinc-600">
            <Link href="/privacy" className="hover:text-zinc-400 transition-colors">
              {t("footer.privacy")}
            </Link>
            <Link href="/dashboard" className="hover:text-zinc-400 transition-colors">
              CRM
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}