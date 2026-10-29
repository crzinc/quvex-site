import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getI18n } from "@/i18n/server";
import { getNiche } from "@/niches";
import type { Profile, Role, Tenant } from "@/lib/types";

export const getUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
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
  const { data: tenant } = await supabase.from("tenants").select("*").eq("slug", slug).maybeSingle<Tenant>();
  if (!tenant) notFound();

  // Platform admins act as owners of any tenant (RLS mirrors this via has_role()).
  const [{ data: membership }, profile] = await Promise.all([
    supabase.from("memberships").select("role").eq("tenant_id", tenant.id).eq("user_id", user.id).maybeSingle<{ role: Role }>(),
    getProfile(),
  ]);
  const role: Role = profile?.is_platform_admin ? "owner" : (membership?.role ?? "staff");

  const { locale, t } = await getI18n();
  return { supabase, user, tenant, niche: getNiche(tenant.niche), locale, t, role, can: permissions(role) };
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

export async function requireAdmin() {
  const profile = await getProfile();
  if (!profile) redirect("/login?next=/admin");
  if (!profile.is_platform_admin) redirect("/app");
  const supabase = await createClient();
  const { locale, t } = await getI18n();
  return { supabase, profile, locale, t };
}

export function isTrialExpired(tenant: Tenant): boolean {
  if (tenant.plan !== "trial") return false;
  return new Date(tenant.trial_ends_at).getTime() < Date.now();
}
