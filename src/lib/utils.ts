import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Locale } from "@/i18n/config";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const intlLocale = (locale: Locale) => (locale === "az" ? "az-Latn-AZ" : "ru-RU");

export function money(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  return `${n.toLocaleString("ru-RU", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).replace(/,/g, ".")} ₼`;
}

export function formatDate(value: string | Date | null | undefined, locale: Locale, withTime = false): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleString(intlLocale(locale), {
    day: "2-digit",
    month: "short",
    year: d.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    timeZone: "Asia/Baku",
  });
}

/** Normalise an Azerbaijani phone number to digits with country code, for wa.me links. */
export function phoneDigits(phone: string | null | undefined): string {
  let digits = (phone ?? "").replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = `994${digits.slice(1)}`;
  if (digits.length === 9) digits = `994${digits}`;
  return digits;
}

export function whatsappLink(phone: string | null | undefined, text: string): string | null {
  const digits = phoneDigits(phone);
  if (digits.length < 10) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

const TRANSLIT: Record<string, string> = {
  ə: "e", ı: "i", ö: "o", ü: "u", ğ: "g", ş: "s", ç: "c",
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l",
  м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh",
  щ: "sh", ы: "y", э: "e", ю: "yu", я: "ya",
};

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .split("")
    .map((ch) => TRANSLIT[ch] ?? ch)
    .join("")
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32) || "biznes";
}

/** Asia/Baku is UTC+4 all year (no DST since 2016). */
const BAKU_OFFSET_MS = 4 * 3_600_000;

export function bakuToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Baku" });
}

function bakuParts(): [number, number, number] {
  const [y, m, d] = bakuToday().split("-").map(Number);
  return [y, m - 1, d];
}

/** Start of a Baku calendar month (offset in months from the current one), independent of the server's timezone. */
export function startOfMonth(offset = 0): Date {
  const [y, m] = bakuParts();
  return new Date(Date.UTC(y, m + offset, 1) - BAKU_OFFSET_MS);
}

/** Start of a Baku calendar day (offset in days from today). */
export function bakuDayStart(offsetDays = 0): Date {
  const [y, m, d] = bakuParts();
  return new Date(Date.UTC(y, m, d + offsetDays) - BAKU_OFFSET_MS);
}

/** Adds calendar months, clamping the day: 31 Jan + 1 month = 28/29 Feb, not 3 Mar. */
export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  d.setUTCDate(Math.min(day, new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate()));
  return d;
}

export function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 86_400_000);
}

export function daysUntil(value: string | Date): number {
  return Math.ceil((new Date(value).getTime() - Date.now()) / 86_400_000);
}

/** Public origin: explicit env, else Vercel's production domain, else local dev. */
export function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}
