"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getI18n } from "@/i18n/server";
import { siteUrl } from "@/lib/utils";
import type { ActionState } from "@/lib/types";

/* Team management (owner only; RLS enforces the same) and joining a business by invite link. */

function invalidate() {
  revalidatePath("/app/[tenant]", "layout");
}

const inviteSchema = z.object({
  role: z.enum(["manager", "staff"]),
  name: z.string().trim().max(80).optional().transform((v) => v || null),
});

export async function createInvitation(slug: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, tenant, user, t } = await requirePermission(slug, "manageTeam");
  const parsed = inviteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: t.common.error };
  const { data, error } = await supabase
    .from("invitations")
    .insert({ ...parsed.data, tenant_id: tenant.id, created_by: user.id })
    .select("token")
    .single();
  if (error) return { error: t.common.error };
  invalidate();
  const origin = (await headers()).get("origin") ?? siteUrl();
  return { ok: true, data: { link: `${origin}/invite/${data.token}` } };
}

export async function revokeInvitation(slug: string, id: string) {
  const { supabase } = await requirePermission(slug, "manageTeam");
  await supabase.from("invitations").delete().eq("id", id);
  invalidate();
}

export async function setMemberRole(slug: string, userId: string, formData: FormData) {
  const { supabase, tenant } = await requirePermission(slug, "manageTeam");
  const role = z.enum(["owner", "manager", "staff"]).safeParse(formData.get("role"));
  if (!role.success) return;
  // The DB refuses to demote the last owner.
  await supabase.from("memberships").update({ role: role.data }).eq("tenant_id", tenant.id).eq("user_id", userId);
  invalidate();
}

export async function removeMember(slug: string, userId: string) {
  const { supabase, tenant } = await requirePermission(slug, "manageTeam");
  await supabase.from("memberships").delete().eq("tenant_id", tenant.id).eq("user_id", userId);
  invalidate();
}

/* ── Joining ─────────────────────────────────────────────── */

export async function acceptInvitation(token: string) {
  const supabase = await createClient();
  const { data: slug, error } = await supabase.rpc("accept_invitation", { p_token: token });
  if (error || !slug) redirect(`/invite/${token}`);
  redirect(`/app/${slug}`);
}

const joinSchema = z.object({
  full_name: z.string().trim().min(2).max(80),
  email: z.email(),
  password: z.string().min(8).max(72),
});

/** Sign up from an invite link; joins the business right away, or after e-mail confirmation. */
export async function registerAndAccept(token: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const { locale, t } = await getI18n();
  const parsed = joinSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? t.common.error };

  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? siteUrl();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.full_name, locale },
      emailRedirectTo: `${origin}/auth/callback?next=/invite/${token}`,
    },
  });
  if (error) return { error: error.message };
  if (!data.session) return { ok: true };
  await acceptInvitation(token);
  return { ok: true };
}
