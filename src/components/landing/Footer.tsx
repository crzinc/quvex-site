"use client";

import Image from "next/image";
import Link from "next/link";
import { useT } from "@/i18n/I18nProvider";

export default function Footer() {
  const { t } = useT();

  return (
    <footer className="border-t border-zinc-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <Image src="/logo.png" alt="Quvex CRM" width={64} height={64} className="rounded-xl" />
              <span className="text-xl font-bold gradient-text">Quvex CRM</span>
            </Link>
            <p className="text-sm text-zinc-500 max-w-sm">{t("footer.desc")}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-4">{t("footer.services_title")}</h4>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li>{t("footer.serv1")}</li>
              <li>{t("footer.serv2")}</li>
              <li>{t("footer.serv3")}</li>
              <li>{t("footer.serv4")}</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-4">{t("footer.contacts_title")}</h4>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li>owner@quvex.org</li>
              <li>+994104759323</li>
              <li>Baku, Azerbaijan</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-zinc-800/50 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-zinc-600">
            © {new Date().getFullYear()} Quvex. {t("footer.rights")}
          </p>
          <div className="flex gap-6 text-xs text-zinc-600">
            <Link href="/dashboard" className="hover:text-zinc-400 transition-colors">CRM</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
