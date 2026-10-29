"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireTenant } from "@/lib/auth";
import { getStatus } from "@/niches";
import type { ActionState } from "@/lib/types";

/*
 * All CRM mutations. Each action is bound to a tenant slug on the page (`action.bind(null, slug)`).
 * Tenant isolation is enforced by RLS: a user can only write rows for tenants they belong to.
 */

const str = (max = 200) => z.string().trim().max(max).optional().transform((v) => (v ? v : null));
const num = z.coerce.number().finite();
const money = num.min(0).max(10_000_000);

async function ctx(slug: string) {
  const c = await requireTenant(slug);
  return { ...c, base: `/app/${slug}` };
}

/** Refresh every CRM page (route pattern + "layout" covers all nested pages of all tenants). */
function invalidate() {
  revalidatePath("/app/[tenant]", "layout");
}

function done(): ActionState {
  invalidate();
  return { ok: true };
}

function fail(t: { common: { error: string } }, error?: { message: string } | null): ActionState {
  if (error) console.error(error);
  return { error: t.common.error };
}

/** Collects `attr.<key>` form fields into a jsonb object. */
function readAttributes(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("attr.") && typeof value === "string" && value.trim()) out[key.slice(5)] = value.trim();
  }
  return out;
}

/** Edit forms send a hidden "off" plus a checkbox "on"; create forms send nothing (= active). */
function readActive(formData: FormData): boolean {
  const values = formData.getAll("active");
  return values.length === 0 || values.includes("on");
}

function assetTitle(attrs: Record<string, string>, fallback: string) {
  return [attrs.make, attrs.model].filter(Boolean).join(" ") || fallback;
}

/* ── Clients ─────────────────────────────────────────────── */

const clientSchema = z.object({ name: z.string().trim().min(1).max(120), phone: str(30), source: str(40), notes: str(2000) });

export async function addClient(slug: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, tenant, t, base, niche, locale } = await ctx(slug);
  const parsed = clientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(t);

  const { data: client, error } = await supabase.from("clients").insert({ ...parsed.data, tenant_id: tenant.id }).select("id").single();
  if (error) return fail(t, error);

  const identifier = String(formData.get("identifier") ?? "").trim().toUpperCase();
  const attrs = readAttributes(formData);
  if (identifier || Object.keys(attrs).length) {
    await supabase.from("assets").insert({
      tenant_id: tenant.id,
      client_id: client.id,
      kind: niche.asset.kind,
      identifier: identifier || null,
      title: assetTitle(attrs, identifier || niche.terms.asset[locale]),
      attributes: attrs,
    });
  }
  invalidate();
  redirect(`${base}/clients/${client.id}`);
}

export async function updateClient(slug: string, id: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, t } = await ctx(slug);
  const parsed = clientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(t);
  const { error } = await supabase.from("clients").update(parsed.data).eq("id", id);
  return error ? fail(t, error) : done();
}

export async function deleteClient(slug: string, id: string) {
  const { supabase, base } = await ctx(slug);
  await supabase.from("clients").delete().eq("id", id);
  invalidate();
  redirect(`${base}/clients`);
}

/* ── Assets (vehicles, …) ────────────────────────────────── */

export async function createAsset(slug: string, clientId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, tenant, niche, t } = await ctx(slug);
  const identifier = String(formData.get("identifier") ?? "").trim().toUpperCase();
  const attrs = readAttributes(formData);
  if (!identifier && !Object.keys(attrs).length) return fail(t);
  const { error } = await supabase.from("assets").insert({
    tenant_id: tenant.id,
    client_id: clientId,
    kind: niche.asset.kind,
    identifier: identifier || null,
    title: assetTitle(attrs, identifier),
    attributes: attrs,
  });
  return error ? fail(t, error) : done();
}

export async function deleteAsset(slug: string, id: string) {
  const { supabase } = await ctx(slug);
  await supabase.from("assets").delete().eq("id", id);
  invalidate();
}

/* ── Orders ──────────────────────────────────────────────── */

export async function createOrder(slug: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, tenant, niche, t, base } = await ctx(slug);
  const get = (k: string) => String(formData.get(k) ?? "").trim();

  let clientId = get("client_id") || null;
  if (!clientId && get("new_client_name")) {
    const { data, error } = await supabase
      .from("clients")
      .insert({ tenant_id: tenant.id, name: get("new_client_name"), phone: get("new_client_phone") || null })
      .select("id")
      .single();
    if (error) return fail(t, error);
    clientId = data.id;
  }

  let assetId = get("asset_id") || null;
  const identifier = get("identifier").toUpperCase();
  const assetAttrs = readAttributes(formData);
  if (!assetId && (identifier || assetAttrs.make)) {
    const { data, error } = await supabase
      .from("assets")
      .insert({
        tenant_id: tenant.id,
        client_id: clientId,
        kind: niche.asset.kind,
        identifier: identifier || null,
        title: assetTitle(assetAttrs, identifier),
        attributes: assetAttrs,
      })
      .select("id")
      .single();
    if (error) return fail(t, error);
    assetId = data.id;
  }

  const orderAttrs: Record<string, string> = {};
  for (const f of niche.orderFields) {
    const v = get(`order.${f.key}`);
    if (v) orderAttrs[f.key] = v;
  }

  const scheduled = get("scheduled_at");
  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      tenant_id: tenant.id,
      client_id: clientId,
      asset_id: assetId,
      staff_id: get("staff_id") || null,
      status: niche.statuses[0].id,
      scheduled_at: scheduled ? new Date(`${scheduled}:00+04:00`).toISOString() : null,
      notes: get("notes") || null,
      attributes: orderAttrs,
    })
    .select("id")
    .single();
  if (error) return fail(t, error);

  // Mileage is also the vehicle's latest known value.
  if (assetId && orderAttrs.mileage) {
    const { data: asset } = await supabase.from("assets").select("attributes").eq("id", assetId).single();
    await supabase
      .from("assets")
      .update({ attributes: { ...(asset?.attributes ?? {}), mileage: orderAttrs.mileage } })
      .eq("id", assetId);
  }

  invalidate();
  redirect(`${base}/orders/${order.id}`);
}

export async function updateOrderStatus(slug: string, id: string, formData: FormData) {
  const { supabase, niche } = await ctx(slug);
  const status = getStatus(niche, String(formData.get("status")));
  await supabase
    .from("orders")
    .update({ status: status.id, closed_at: status.kind === "open" ? null : new Date().toISOString() })
    .eq("id", id);
  invalidate();
}

export async function updateOrderDetails(slug: string, id: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, niche, t } = await ctx(slug);
  const attrs: Record<string, string> = {};
  for (const f of niche.orderFields) {
    const v = String(formData.get(`order.${f.key}`) ?? "").trim();
    if (v) attrs[f.key] = v;
  }
  const { error } = await supabase
    .from("orders")
    .update({
      staff_id: String(formData.get("staff_id") ?? "") || null,
      notes: String(formData.get("notes") ?? "").trim() || null,
      attributes: attrs,
    })
    .eq("id", id);
  return error ? fail(t, error) : done();
}

export async function deleteOrder(slug: string, id: string) {
  const { supabase, base } = await ctx(slug);
  await supabase.from("orders").delete().eq("id", id);
  invalidate();
  redirect(`${base}/orders`);
}

const itemSchema = z.object({
  kind: z.enum(["service", "part"]),
  name: z.string().trim().min(1).max(200),
  qty: num.positive().max(100_000),
  price: money,
  catalog_item_id: str(64),
  staff_id: str(64),
});

export async function addOrderItem(slug: string, orderId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, tenant, t } = await ctx(slug);
  const parsed = itemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(t);
  const { error } = await supabase.from("order_items").insert({ ...parsed.data, tenant_id: tenant.id, order_id: orderId });
  return error ? fail(t, error) : done();
}

export async function deleteOrderItem(slug: string, id: string) {
  const { supabase } = await ctx(slug);
  await supabase.from("order_items").delete().eq("id", id);
  invalidate();
}

/* ── Payments ────────────────────────────────────────────── */

const paymentSchema = z.object({
  amount: num.positive().max(10_000_000),
  method: z.enum(["cash", "card", "transfer"]),
  direction: z.enum(["in", "out"]).default("in"),
  category: str(40),
  note: str(300),
});

export async function addPayment(slug: string, orderId: string | null, _: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, tenant, t } = await ctx(slug);
  const parsed = paymentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(t);
  const { error } = await supabase.from("payments").insert({ ...parsed.data, tenant_id: tenant.id, order_id: orderId });
  return error ? fail(t, error) : done();
}

export async function deletePayment(slug: string, id: string) {
  const { supabase } = await ctx(slug);
  await supabase.from("payments").delete().eq("id", id);
  invalidate();
}

/* ── Catalog (services + parts) ──────────────────────────── */

const catalogSchema = z.object({
  kind: z.enum(["service", "part"]),
  name: z.string().trim().min(1).max(200),
  category: str(80),
  sku: str(60),
  price: money,
  cost: money.optional().default(0),
  duration_min: z.preprocess((v) => (v === "" || v == null ? null : v), z.coerce.number().int().min(0).max(100_000).nullable()),
  stock: z.preprocess((v) => (v === "" || v == null ? null : v), z.coerce.number().min(-100_000).max(1_000_000).nullable()),
});

export async function saveCatalogItem(slug: string, id: string | null, _: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, tenant, t } = await ctx(slug);
  const parsed = catalogSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(t);
  const row = { ...parsed.data, active: readActive(formData) };
  const { error } = id
    ? await supabase.from("catalog_items").update(row).eq("id", id)
    : await supabase.from("catalog_items").insert({ ...row, tenant_id: tenant.id });
  return error ? fail(t, error) : done();
}

export async function restockItem(slug: string, id: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, t } = await ctx(slug);
  const qty = Number(formData.get("qty"));
  if (!Number.isFinite(qty) || qty <= 0) return fail(t);
  const { data } = await supabase.from("catalog_items").select("stock").eq("id", id).single();
  const { error } = await supabase.from("catalog_items").update({ stock: Number(data?.stock ?? 0) + qty }).eq("id", id);
  return error ? fail(t, error) : done();
}

export async function deleteCatalogItem(slug: string, id: string) {
  const { supabase } = await ctx(slug);
  await supabase.from("catalog_items").delete().eq("id", id);
  invalidate();
}

/* ── Staff ───────────────────────────────────────────────── */

const staffSchema = z.object({
  name: z.string().trim().min(1).max(120),
  phone: str(30),
  position: str(80),
  commission_percent: num.min(0).max(100).default(0),
});

export async function saveStaff(slug: string, id: string | null, _: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, tenant, t } = await ctx(slug);
  const parsed = staffSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(t);
  const row = { ...parsed.data, active: readActive(formData) };
  const { error } = id
    ? await supabase.from("staff").update(row).eq("id", id)
    : await supabase.from("staff").insert({ ...row, tenant_id: tenant.id });
  return error ? fail(t, error) : done();
}

/* ── Reminders ───────────────────────────────────────────── */

const reminderSchema = z.object({
  title: z.string().trim().min(1).max(200),
  due_at: z.iso.date(),
  client_id: str(64),
  asset_id: str(64),
  order_id: str(64),
});

export async function createReminder(slug: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, tenant, t } = await ctx(slug);
  const parsed = reminderSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(t);
  const { error } = await supabase.from("reminders").insert({ ...parsed.data, tenant_id: tenant.id });
  return error ? fail(t, error) : done();
}

export async function setReminderStatus(slug: string, id: string, status: "pending" | "sent" | "done" | "dismissed") {
  const { supabase } = await ctx(slug);
  await supabase.from("reminders").update({ status }).eq("id", id);
  invalidate();
}

/* ── Settings ────────────────────────────────────────────── */

const tenantSchema = z.object({ name: z.string().trim().min(2).max(80), city: str(60), phone: str(30), address: str(200) });

export async function updateTenant(slug: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, tenant, niche, t } = await ctx(slug);
  const parsed = tenantSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(t);
  const modules = niche.modules.filter((m) => formData.get(`module.${m}`) === "on");
  const { error } = await supabase.from("tenants").update({ ...parsed.data, modules }).eq("id", tenant.id);
  return error ? fail(t, error) : done();
}
