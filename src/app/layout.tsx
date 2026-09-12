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
  metadataBase: new URL("https://quvex.org"),
  title: "Quvex CRM — CRM для автодетейлинга",
  description:
    "Quvex CRM — система для автодетейлинг-студий: онлайн-запись, график мастеров, клиентская база, напоминания и финансы.",
  icons: { icon: "/logo.png", apple: "/logo.png" },
  openGraph: {
    title: "Quvex CRM — CRM для автодетейлинга",
    description:
      "Онлайн-запись, график мастеров, клиентская база и финансы для детейлинг-студий.",
    images: [{ url: "/og-cover.png", width: 1200, height: 630 }],
    locale: "ru_RU",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Quvex CRM — CRM для автодетейлинга",
    description: "Онлайн-запись, график мастеров, клиентская база и финансы.",
    images: ["/og-cover.png"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Quvex CRM",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description: "CRM для автодетейлинг-студий: записи, клиенты, услуги, финансы.",
  offers: { "@type": "Offer", price: "50", priceCurrency: "AZN" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" data-scroll-behavior="smooth" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full antialiased noise">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
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
