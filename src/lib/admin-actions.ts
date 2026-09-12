"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== "admin") {
    return { error: "Forbidden" as const };
  }
  return { user };
}

export async function createEmployeeAccount(email: string, password: string) {
  const check = await requireAdmin();
  if ("error" in check) return { error: check.error };
  const cleanEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return { error: "Invalid email" };
  if (!password || password.length < 6) return { error: "Password min 6 chars" };
  const service = createServiceClient();
  const { error } = await service.auth.admin.createUser({ email: cleanEmail, password, email_confirm: true });
  if (error) return { error: error.message };
  return { success: true };
}
