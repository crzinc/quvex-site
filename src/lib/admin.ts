import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { planPrice } from "@/config/plans";
import type { Tenant } from "@/lib/types";

export type AdminTenant = Tenant & {
  memberships: { role: string; profiles: { email: string | null; full_name: string | null } | null }[];
  clients: { count: number }[];
  orders: { count: number }[];
};

export const ADMIN_TENANT_SELECT = "*, memberships(role, profiles(email, full_name)), clients(count), orders(count)";

export function isPaying(t: Tenant) {
  return t.plan !== "trial" && t.status === "active" && !!t.paid_until && new Date(t.paid_until) > new Date();
}

export function mrr(tenants: Tenant[]) {
  return tenants.filter(isPaying).reduce((s, t) => s + planPrice(t.plan), 0);
}

export function owner(t: AdminTenant) {
  const m = t.memberships.find((x) => x.role === "owner") ?? t.memberships[0];
  return m?.profiles ?? null;
}

export async function loadTenants(supabase: SupabaseClient) {
  const { data } = await supabase.from("tenants").select(ADMIN_TENANT_SELECT).order("created_at", { ascending: false }).returns<AdminTenant[]>();
  return data ?? [];
}

export type TenantState = "paying" | "trial" | "expired" | "suspended";

export function tenantState(t: Tenant): TenantState {
  if (t.status === "suspended") return "suspended";
  if (isPaying(t)) return "paying";
  if (t.plan === "trial" && new Date(t.trial_ends_at) > new Date()) return "trial";
  return "expired";
}
