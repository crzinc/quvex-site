"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useT } from "@/i18n/I18nProvider";

const navLinks = [
  { href: "#services", key: "nav.services" },
  { href: "#about", key: "nav.about" },
  { href: "#portfolio", key: "nav.portfolio" },
  { href: "#quiz", key: "nav.quiz" },
  { href: "#contact", key: "nav.contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useT();

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 50);
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-zinc-800/50"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <Link href="/" className="flex items-center gap-3 group">
            <Image src="/logo.png" alt="Quvex CRM" width={64} height={64} className="rounded-xl group-hover:opacity-80 transition-opacity" />
            <span className="text-xl font-bold gradient-text">Quvex CRM</span>
          </Link>

          <div className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-zinc-400 hover:text-white transition-colors"
              >
                {t(link.key)}
              </a>
            ))}
            <LanguageSwitcher />
            <Link href="/auth/login">
              <Button size="sm" variant="ghost">{t("nav.login")}</Button>
            </Link>
            <a href="#contact">
              <Button size="sm">{t("nav.contact_btn")}</Button>
            </a>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <LanguageSwitcher />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="text-zinc-400 hover:text-white p-2"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-zinc-800/50 bg-background/95 backdrop-blur-xl"
          >
            <div className="px-4 py-6 space-y-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block text-sm text-zinc-400 hover:text-white transition-colors py-2"
                >
                  {t(link.key)}
                </a>
              ))}
              <div className="pt-4 border-t border-zinc-800 space-y-2">
                <Link href="/auth/login" className="block" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" className="w-full">{t("nav.login")}</Button>
                </Link>
                <a href="#contact" className="block" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full">{t("nav.contact_btn")}</Button>
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
