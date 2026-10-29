import type { PlanId } from "@/config/plans";

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  niche: string;
  city: string | null;
  phone: string | null;
  address: string | null;
  plan: PlanId;
  user_limit: number | null;
  status: "active" | "suspended";
  trial_ends_at: string;
  paid_until: string | null;
  modules: string[];
  settings: Record<string, unknown>;
  created_at: string;
}

export type Role = "owner" | "manager" | "staff";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  locale: string;
  is_platform_admin: boolean;
}

export interface Client {
  id: string;
  tenant_id: string;
  name: string;
  phone: string | null;
  notes: string | null;
  source: string | null;
  created_at: string;
}

export interface Asset {
  id: string;
  tenant_id: string;
  client_id: string | null;
  kind: string;
  title: string;
  identifier: string | null;
  attributes: Record<string, string>;
  created_at: string;
}

export interface CatalogItem {
  id: string;
  kind: "service" | "part";
  name: string;
  category: string | null;
  sku: string | null;
  price: number;
  cost: number;
  stock: number | null;
  duration_min: number | null;
  active: boolean;
}

export interface Staff {
  id: string;
  name: string;
  phone: string | null;
  position: string | null;
  commission_percent: number;
  active: boolean;
}

export interface Order {
  id: string;
  tenant_id: string;
  number: number;
  client_id: string | null;
  asset_id: string | null;
  staff_id: string | null;
  status: string;
  scheduled_at: string | null;
  notes: string | null;
  attributes: Record<string, string>;
  subtotal: number;
  discount_percent: number;
  total: number;
  paid: number;
  closed_at: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  catalog_item_id: string | null;
  kind: "service" | "part";
  name: string;
  qty: number;
  price: number;
  staff_id: string | null;
}

export interface Payment {
  id: string;
  order_id: string | null;
  direction: "in" | "out";
  amount: number;
  method: "cash" | "card" | "transfer";
  category: string | null;
  note: string | null;
  created_at: string;
}

export interface Reminder {
  id: string;
  client_id: string | null;
  asset_id: string | null;
  order_id: string | null;
  title: string;
  due_at: string;
  status: "pending" | "sent" | "done" | "dismissed";
  created_at: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  business_name: string | null;
  niche: string | null;
  message: string | null;
  status: "new" | "contacted" | "won" | "lost";
  created_at: string;
}

export interface Invitation {
  id: string;
  token: string;
  role: "manager" | "staff";
  name: string | null;
  accepted_at: string | null;
  expires_at: string;
  created_at: string;
}

/** Shape returned by actions used with useActionState. */
export interface ActionState {
  ok?: boolean;
  error?: string;
  /** Optional payload for the form, e.g. a generated invite link. */
  data?: Record<string, string>;
}
