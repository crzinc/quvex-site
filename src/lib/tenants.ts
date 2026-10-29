import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Locale } from "@/i18n/config";
import { getNiche } from "@/niches";
import { slugify } from "@/lib/utils";
import type { Tenant } from "@/lib/types";

/** Slugs that collide with static routes under /app. */
const RESERVED_SLUGS = new Set(["new", "admin", "api", "settings"]);

export interface NewBusiness {
  name: string;
  niche: string;
  city?: string | null;
  phone?: string | null;
}

/**
 * Creates a tenant for the signed-in user and applies the niche template:
 * enabled modules + seed catalog in the user's language.
 */
export async function provisionTenant(supabase: SupabaseClient, input: NewBusiness, locale: Locale): Promise<Tenant> {
  const niche = getNiche(input.niche);
  const slug0 = slugify(input.name);
  const base = RESERVED_SLUGS.has(slug0) ? `${slug0}-1` : slug0;

  let tenant: Tenant | null = null;
  for (let attempt = 0; attempt < 6 && !tenant; attempt++) {
    const slug = attempt === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;
    const { data, error } = await supabase.rpc("create_tenant", {
      p_slug: slug,
      p_name: input.name,
      p_niche: niche.id,
      p_city: input.city ?? null,
      p_phone: input.phone ?? null,
      p_modules: niche.modules,
    });
    if (!error) tenant = data as Tenant;
    else if (error.code !== "23505") throw error;
  }
  if (!tenant) throw new Error("Could not allocate a unique slug");

  await supabase.from("catalog_items").insert(
    niche.catalog.map((item) => ({
      tenant_id: tenant.id,
      kind: item.kind,
      name: item.name[locale],
      category: item.category[locale],
      price: item.price,
      duration_min: item.durationMin ?? null,
      stock: item.kind === "part" ? 0 : null,
    })),
  );

  return tenant;
}
