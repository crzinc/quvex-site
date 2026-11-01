import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getI18n } from "@/i18n/server";
import { getNiche } from "@/niches";
import type { Profile, Role, Tenant } from "@/lib/types";

export interface AuthUser {
  id: string;
  email: string | null;
}

/** The signed-in user from the verified JWT: no round trip to Supabase Auth (the proxy already refreshed the session). */
export const getUser = cache(async (): Promise<AuthUser | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  return { id: claims.sub, email: claims.email ?? null };
});

export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return data;
});

/** Loads the tenant for a CRM page. RLS guarantees the user is a member (or a platform admin). */
export const requireTenant = cache(async (slug: string) => {
  const user = await getUser();
  if (!user) redirect(`/login?next=/app/${slug}`);

  const supabase = await createClient();
  // Tenant + the user's own membership in one request, the profile in parallel.
  const [{ data: row }, profile, { locale, t }] = await Promise.all([
    supabase
      .from("tenants")
      .select("*, memberships(role, staff_id)")
      .eq("slug", slug)
      .eq("memberships.user_id", user.id)
      .maybeSingle<Tenant & { memberships: { role: Role; staff_id: string | null }[] }>(),
    getProfile(),
    getI18n(),
  ]);
  if (!row) notFound();
  const { memberships, ...tenant } = row;
  const membership = memberships[0];

  // Platform admins act as owners of any tenant (RLS mirrors this via has_role()).
  const role: Role = membership?.role ?? (profile?.is_platform_admin ? "owner" : "staff");
  const niche = getNiche(tenant.niche);

  return {
    supabase,
    user,
    tenant,
    niche,
    locale,
    t,
    role,
    /** The signed-in user's row in the masters list, if linked. */
    staffId: membership?.staff_id ?? null,
    workspace: niche.roles[role],
    can: permissions(profile?.is_platform_admin ? "owner" : role),
  };
});

/** UI-level permissions. The database enforces the same rules through RLS (see has_role()). */
export function permissions(role: Role) {
  const manager = role === "owner" || role === "manager";
  return {
    viewFinance: manager,
    managePrices: manager,
    manageStaff: manager,
    delete: manager,
    discount: manager,
    manageTeam: role === "owner",
    settings: role === "owner",
  };
}

/** Use at the top of pages a role must not open. */
export async function requirePermission(slug: string, key: keyof ReturnType<typeof permissions>) {
  const ctx = await requireTenant(slug);
  if (!ctx.can[key]) notFound();
  return ctx;
}

export type TenantContext = Awaited<ReturnType<typeof requireTenant>>;

export async function requireAdmin() {
  const profile = await getProfile();
  if (!profile) redirect("/login?next=/admin");
  if (!profile.is_platform_admin) redirect("/app");
  const [supabase, { locale, t }] = await Promise.all([createClient(), getI18n()]);
  return { supabase, profile, locale, t };
}

export function isTrialExpired(tenant: Tenant): boolean {
  if (tenant.plan !== "trial") return false;
  return new Date(tenant.trial_ends_at).getTime() < Date.now();
}
