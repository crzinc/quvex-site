"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getI18n } from "@/i18n/server";
import type { ActionState } from "@/lib/types";

const leadSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(7).max(30),
  business_name: z.string().trim().max(120).optional(),
  niche: z.string().max(40).optional(),
});

export async function submitLead(_: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n();
  const parsed = leadSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: t.common.error };

  const supabase = await createClient();
  const { error } = await supabase.from("leads").insert(parsed.data);
  if (error) return { error: t.common.error };
  return { ok: true };
}
