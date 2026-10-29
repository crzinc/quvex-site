import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { getLocale } from "@/i18n/server";
import { siteUrl } from "@/lib/utils";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin", "latin-ext", "cyrillic"] });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Quvex — CRM для автосервиса", template: "%s · Quvex" },
  description: "Avtoservis üçün CRM: sifariş-naryadlar, müştərilər, anbar, WhatsApp xatırlatmaları.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf9" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0a09" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={inter.variable}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
