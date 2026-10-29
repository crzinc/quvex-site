import type { Locale } from "@/i18n/config";
import type { ModuleId, NicheConfig, OrderStatus } from "./types";
import { autoService } from "./auto-service";
import { detailing } from "./detailing";
import { carWash } from "./car-wash";

export type { NicheConfig, ModuleId, OrderStatus } from "./types";

/** Registry of all niche templates. Order = order on the registration screen. */
export const NICHES: NicheConfig[] = [autoService, detailing, carWash];

export const DEFAULT_NICHE = autoService;

export function getNiche(id: string | null | undefined): NicheConfig {
  return NICHES.find((n) => n.id === id) ?? DEFAULT_NICHE;
}

export function getStatus(niche: NicheConfig, id: string): OrderStatus {
  return (
    niche.statuses.find((s) => s.id === id) ?? {
      id,
      label: { az: id, ru: id },
      kind: "open",
      tone: "slate",
    }
  );
}

export function openStatusIds(niche: NicheConfig): string[] {
  return niche.statuses.filter((s) => s.kind === "open").map((s) => s.id);
}

export function hasModule(modules: string[] | null | undefined, id: ModuleId): boolean {
  return (modules ?? []).includes(id);
}

/** Translate a niche term for the current locale. */
export function term(niche: NicheConfig, key: keyof NicheConfig["terms"], locale: Locale): string {
  return niche.terms[key][locale];
}
