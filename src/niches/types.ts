import type { Locale } from "@/i18n/config";
import type { Role } from "@/lib/types";

export type Localized = Record<Locale, string>;

/** Product modules a niche (and later a tenant) can switch on. Core CRM pages are always on. */
export type ModuleId = "orders" | "inventory" | "reminders" | "staff" | "finance";

export type StatusKind = "open" | "done" | "cancelled";

export interface OrderStatus {
  id: string;
  label: Localized;
  kind: StatusKind;
  /** Tailwind palette name used by the status badge. */
  tone: "slate" | "blue" | "amber" | "violet" | "green" | "red";
}

export type FieldType = "text" | "number" | "year" | "car_make" | "car_model";

export interface FieldDef {
  key: string;
  label: Localized;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
}

export interface CatalogSeed {
  kind: "service" | "part";
  name: Localized;
  category: Localized;
  price: number;
  durationMin?: number;
}

/** Home screen variants: business overview, order board by status, or the signed-in master's own work. */
export type HomeView = "overview" | "board" | "my_work";

export type NavId = "dashboard" | "orders" | "clients" | "reminders" | "catalog" | "staff" | "finance" | "settings";

/** What a role sees: its home screen and menu. Permissions themselves are enforced in the database. */
export interface RoleTemplate {
  home: HomeView;
  homeLabel: Localized;
  nav: NavId[];
}

export interface ReminderPreset {
  id: string;
  title: Localized;
  months: number;
}

/**
 * A niche template. Everything niche-specific is data here:
 * terminology, the "asset" being serviced, order fields, statuses, modules and seed catalog.
 * Adding a new vertical = adding one file to this folder and registering it in ./index.ts.
 */
export interface NicheConfig {
  id: string;
  enabled: boolean;
  name: Localized;
  tagline: Localized;
  icon: "wrench" | "sparkles" | "droplets" | "disc";
  terms: {
    order: Localized;
    orders: Localized;
    asset: Localized;
    assets: Localized;
    staff: Localized;
    service: Localized;
    part: Localized;
  };
  asset: {
    kind: string;
    identifierLabel: Localized;
    identifierPlaceholder: string;
    fields: FieldDef[];
  };
  orderFields: FieldDef[];
  statuses: OrderStatus[];
  modules: ModuleId[];
  reminderPresets: ReminderPreset[];
  catalog: CatalogSeed[];
  roles: Record<Role, RoleTemplate>;
}
