import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getI18n } from "@/i18n/server";
import { getNiche } from "@/niches";
import type { Profile, Tenant } from "@/lib/types";

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

  const { locale, t } = await getI18n();
  return { supabase, user, tenant, niche: getNiche(tenant.niche), locale, t };
});

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
