"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import type { ActionState } from "@/lib/types";

/* Platform-admin mutations. RLS additionally restricts these tables to is_platform_admin(). */

export async function setTenantStatus(id: string, status: "active" | "suspended") {
  const { supabase } = await requireAdmin();
  await supabase.from("tenants").update({ status }).eq("id", id);
  revalidatePath("/admin", "layout");
}

const trialSchema = z.object({ trial_ends_at: z.iso.date() });

export async function setTrialEnd(id: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, t } = await requireAdmin();
  const parsed = trialSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: t.common.error };
  const { error } = await supabase.from("tenants").update({ trial_ends_at: `${parsed.data.trial_ends_at}T23:59:59+04:00` }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin", "layout");
  return { ok: true };
}

const billingSchema = z.object({
  plan: z.enum(["start", "pro"]),
  months: z.coerce.number().int().min(1).max(36),
  amount: z.coerce.number().min(0).max(1_000_000),
  method: z.string().trim().max(40).optional(),
  note: z.string().trim().max(300).optional(),
});

/** Records a subscription payment and extends paid_until from max(now, current paid_until). */
export async function recordBilling(id: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, t } = await requireAdmin();
  const parsed = billingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: t.common.error };
  const { plan, months, amount, method, note } = parsed.data;

  const { data: tenant } = await supabase.from("tenants").select("paid_until").eq("id", id).single();
  const start = new Date(Math.max(Date.now(), tenant?.paid_until ? new Date(tenant.paid_until).getTime() : 0));
  start.setMonth(start.getMonth() + months);

  const { error } = await supabase.from("billing_payments").insert({ tenant_id: id, plan, months, amount, method, note });
  if (error) return { error: error.message };
  await supabase.from("tenants").update({ plan, status: "active", paid_until: start.toISOString() }).eq("id", id);
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function setLeadStatus(id: string, formData: FormData) {
  const { supabase } = await requireAdmin();
  const status = z.enum(["new", "contacted", "won", "lost"]).safeParse(formData.get("status"));
  if (!status.success) return;
  await supabase.from("leads").update({ status: status.data }).eq("id", id);
  revalidatePath("/admin", "layout");
}
