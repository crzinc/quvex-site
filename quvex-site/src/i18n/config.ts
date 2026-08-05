export const locales = ["ru", "en", "az"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ru";

export const localeNames: Record<Locale, string> = {
  ru: "Русский",
  en: "English",
  az: "Azərbaycanca",
};

export const localeFlags: Record<Locale, string> = {
  ru: "🇷🇺",
  en: "🇬🇧",
  az: "🇦🇿",
};
