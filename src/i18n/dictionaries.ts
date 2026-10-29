import type { Locale } from "./config";
import { az, type Dictionary } from "./az";
import { ru } from "./ru";

const dictionaries: Record<Locale, Dictionary> = { az, ru };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

/** Replace {placeholders} in a template string. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}

export type { Dictionary };
