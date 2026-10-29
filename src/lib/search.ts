import type { SupabaseClient } from "@supabase/supabase-js";

/** Escape a user string for use inside a PostgREST ilike filter. */
export function ilikeTerm(q: string): string {
  return `%${q.replace(/[%_,()\\]/g, " ").trim()}%`;
}

/** Finds clients by name/phone and assets by identifier/title — used by order and client search. */
export async function findAssetAndClientIds(supabase: SupabaseClient, tenantId: string, q: string) {
  const term = ilikeTerm(q);
  const plate = ilikeTerm(q.replace(/[^\p{L}\p{N}]/gu, "").toUpperCase());
  // Phones are stored as typed ("050 123 45 67", "+994501234567"): match the national digits in order, ignoring separators.
  const digits = q.replace(/\D/g, "").replace(/^(994|0)/, "");
  const clientFilters = [`name.ilike.${term}`, digits.length >= 3 && `phone.ilike.%${digits.split("").join("%")}%`].filter(Boolean);
  const [assets, clients] = await Promise.all([
    supabase.from("assets").select("id, client_id").eq("tenant_id", tenantId).or(`identifier_norm.ilike.${plate},title.ilike.${term}`).limit(200),
    supabase.from("clients").select("id").eq("tenant_id", tenantId).or(clientFilters.join(",")).limit(200),
  ]);
  return {
    assetIds: (assets.data ?? []).map((a) => a.id as string),
    clientIds: [...new Set([...(clients.data ?? []).map((c) => c.id as string), ...(assets.data ?? []).flatMap((a) => (a.client_id ? [a.client_id as string] : []))])],
  };
}
