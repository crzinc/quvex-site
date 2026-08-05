import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { I18nProvider } from "@/i18n/I18nProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Quvex CRM — Управление клиентами и продажами",
  description:
    "CRM-система для управления клиентами, сделками и продажами. Автоматизация воронки, аналитика и коммуникации с клиентами.",
  icons: { icon: "/logo.png", apple: "/logo.png" },
  openGraph: {
    title: "Quvex CRM — Управление клиентами и продажами",
    description:
      "CRM-система для управления клиентами, сделками и продажами.",
    images: [{ url: "/logo.png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full antialiased noise">
        <I18nProvider>{children}</I18nProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#18181b",
              border: "1px solid #27272a",
              color: "#fafafa",
            },
          }}
        />
      </body>
    </html>
  );
}
