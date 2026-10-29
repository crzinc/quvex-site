import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { NicheConfig } from "@/niches";
import { startOfMonth } from "@/lib/utils";

export interface Labour {
  sum: number;
  count: number;
}

/**
 * Labour per master for orders closed this month: service lines attributed to the line's master,
 * falling back to the order's master, after the order discount.
 */
export async function monthLabour(supabase: SupabaseClient, tenantId: string, niche: NicheConfig, staffId?: string) {
  const doneIds = niche.statuses.filter((s) => s.kind === "done").map((s) => s.id);
  const { data } = await supabase
    .from("orders")
    .select("staff_id, discount_percent, order_items(kind, qty, price, staff_id)")
    .eq("tenant_id", tenantId)
    .in("status", doneIds)
    .gte("closed_at", startOfMonth().toISOString());

  const labour = new Map<string, Labour>();
  for (const order of data ?? []) {
    const factor = 1 - Number(order.discount_percent ?? 0) / 100;
    for (const item of order.order_items ?? []) {
      const who = item.staff_id ?? order.staff_id;
      if (!who || item.kind !== "service" || (staffId && who !== staffId)) continue;
      const cur = labour.get(who) ?? { sum: 0, count: 0 };
      labour.set(who, { sum: cur.sum + Number(item.qty) * Number(item.price) * factor, count: cur.count + 1 });
    }
  }
  return labour;
}

export function earnings(labour: Labour | undefined, commissionPercent: number): number {
  return ((labour?.sum ?? 0) * Number(commissionPercent)) / 100;
}
