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

/** The status a job moves to with one tap: the next open step, then the first "done" status. */
export function nextStatus(niche: NicheConfig, current: string): OrderStatus | null {
  const flow = niche.statuses.filter((s) => s.kind !== "cancelled");
  const i = flow.findIndex((s) => s.id === current);
  if (i < 0 || flow[i].kind !== "open") return null;
  return flow[i + 1] ?? null;
}
