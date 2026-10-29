"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getI18n } from "@/i18n/server";
import { provisionTenant } from "@/lib/tenants";
import { NICHES } from "@/niches";
import { siteUrl } from "@/lib/utils";
import type { ActionState } from "@/lib/types";

function safeNext(next: FormDataEntryValue | null): string {
  const value = typeof next === "string" ? next : "";
  return value.startsWith("/") && !value.startsWith("//") ? value : "/app";
}

export async function login(_: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n();
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  });
  if (error) return { error: t.auth.invalidCredentials };
  redirect(safeNext(formData.get("next")));
}

const registerSchema = z.object({
  niche: z.enum(NICHES.filter((n) => n.enabled).map((n) => n.id) as [string, ...string[]]),
  business_name: z.string().trim().min(2).max(80),
  city: z.string().trim().max(60).optional(),
  phone: z.string().trim().min(7).max(30),
  full_name: z.string().trim().min(2).max(80),
  email: z.email(),
  password: z.string().min(8).max(72),
});

export async function register(_: ActionState, formData: FormData): Promise<ActionState> {
  const { locale, t } = await getI18n();
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? t.common.error };
  const input = parsed.data;

  const business = { name: input.business_name, niche: input.niche, city: input.city, phone: input.phone };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      // Business details travel with the user, so the tenant can be provisioned
      // right now or after e-mail confirmation (see /app).
      data: { full_name: input.full_name, phone: input.phone, locale, pending_business: business },
      emailRedirectTo: `${(await headers()).get("origin") ?? siteUrl()}/auth/callback?next=/app`,
    },
  });
  if (error) return { error: error.message };

  if (!data.session) return { ok: true, error: undefined };

  const tenant = await provisionTenant(supabase, business, locale);
  await supabase.auth.updateUser({ data: { pending_business: null } });
  redirect(`/app/${tenant.slug}`);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

const businessSchema = registerSchema.pick({ niche: true, business_name: true, city: true, phone: true });

/** Adds a business for an already signed-in user. */
export async function createBusiness(_: ActionState, formData: FormData): Promise<ActionState> {
  const { locale, t } = await getI18n();
  const parsed = businessSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: t.common.error };
  const supabase = await createClient();
  const tenant = await provisionTenant(
    supabase,
    { name: parsed.data.business_name, niche: parsed.data.niche, city: parsed.data.city, phone: parsed.data.phone },
    locale,
  );
  redirect(`/app/${tenant.slug}`);
}
