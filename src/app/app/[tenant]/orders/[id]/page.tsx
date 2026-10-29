import { notFound } from "next/navigation";
import Link from "next/link";
import { MessageCircle, Phone, Printer, Trash2, X } from "lucide-react";
import { requireTenant } from "@/lib/auth";
import { getStatus, hasModule, term } from "@/niches";
import { Badge, Button, Card, CardHeader, EmptyState, Field, Input, PageHeader, Select, Textarea, buttonClass } from "@/components/ui";
import { ActionForm, ConfirmForm, PrintButton, SubmitButton } from "@/components/ui/forms";
import { StatusBadge } from "@/components/app/StatusBadge";
import { AddItemForm } from "@/components/app/AddItemForm";
import { ReminderForm } from "@/components/app/ReminderForm";
import {
  addOrderItem,
  addPayment,
  deleteOrder,
  deleteOrderItem,
  deletePayment,
  setReminderStatus,
  updateOrderDetails,
  updateOrderStatus,
  createReminder,
} from "@/lib/actions/crm";
import { fill } from "@/i18n/dictionaries";
import { cn, formatDate, money, whatsappLink } from "@/lib/utils";
import type { Asset, CatalogItem, Client, Order, OrderItem, Payment, Reminder, Staff } from "@/lib/types";

export default async function OrderPage({ params }: PageProps<"/app/[tenant]/orders/[id]">) {
  const { tenant: slug, id } = await params;
  const { supabase, tenant, niche, locale, t } = await requireTenant(slug);
  const base = `/app/${slug}`;

  const { data: order } = await supabase
    .from("orders")
    .select("*, clients(*), assets(*)")
    .eq("tenant_id", tenant.id)
    .eq("id", id)
    .maybeSingle<Order & { clients: Client | null; assets: Asset | null }>();
  if (!order) notFound();

  const [items, payments, catalog, staff, reminders] = await Promise.all([
    supabase.from("order_items").select("*").eq("order_id", id).order("created_at").returns<OrderItem[]>(),
    supabase.from("payments").select("*").eq("order_id", id).order("created_at").returns<Payment[]>(),
    supabase.from("catalog_items").select("*").eq("tenant_id", tenant.id).eq("active", true).order("name").returns<CatalogItem[]>(),
    supabase.from("staff").select("*").eq("tenant_id", tenant.id).eq("active", true).order("name").returns<Staff[]>(),
    supabase.from("reminders").select("*").eq("order_id", id).order("due_at").returns<Reminder[]>(),
  ]);

  const client = order.clients;
  const asset = order.assets;
  const status = getStatus(niche, order.status);
  const debt = Number(order.total) - Number(order.paid);
  const staffById = new Map((staff.data ?? []).map((s) => [s.id, s.name]));
  const assetName = asset ? `${asset.title}${asset.identifier ? ` (${asset.identifier})` : ""}` : term(niche, "asset", locale);
  const orderTerm = term(niche, "order", locale);

  const waText =
    status.id === "ready"
      ? fill(t.orders.waReady, { name: client?.name ?? "", asset: assetName, total: Number(order.total), business: tenant.name })
      : fill(t.orders.waSummary, { name: client?.name ?? "", business: tenant.name, order: orderTerm, number: order.number, total: Number(order.total), paid: Number(order.paid) });
  const wa = whatsappLink(client?.phone, waText);
  const canRemind = hasModule(tenant.modules, "reminders") && client;

  return (
    <>
      <PageHeader
        back={{ href: `${base}/orders`, label: term(niche, "orders", locale) }}
        title={
          <span className="flex items-center gap-3">
            {orderTerm} #{order.number}
            <StatusBadge niche={niche} status={order.status} locale={locale} />
          </span>
        }
        description={`${t.orders.created}: ${formatDate(order.created_at, locale, true)}${order.scheduled_at ? ` · ${t.orders.scheduled}: ${formatDate(order.scheduled_at, locale, true)}` : ""}`}
        actions={
          <div className="no-print flex flex-wrap gap-2">
            {wa && (
              <a href={wa} target="_blank" rel="noreferrer" className={buttonClass("primary", "md", "bg-[#25D366] text-white")}>
                <MessageCircle className="size-4" /> {t.orders.sendWhatsapp}
              </a>
            )}
            <PrintButton>
              <Printer className="size-4" /> {t.orders.print}
            </PrintButton>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="grid content-start gap-6">
          {/* Status pipeline */}
          <Card className="no-print overflow-x-auto p-2">
            <div className="flex min-w-max gap-1">
              {niche.statuses.map((s) => (
                <form key={s.id} action={updateOrderStatus.bind(null, slug, id)}>
                  <input type="hidden" name="status" value={s.id} />
                  <button
                    type="submit"
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      s.id === order.status ? "bg-primary text-primary-fg" : "text-fg-muted hover:bg-surface-2 hover:text-fg",
                    )}
                  >
                    {s.label[locale]}
                  </button>
                </form>
              ))}
            </div>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader title={t.orders.items} />
            {items.data?.length ? (
              <ul className="divide-y divide-border">
                {items.data.map((it) => (
                  <li key={it.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                    <Badge tone={it.kind === "part" ? "violet" : "slate"} className="hidden sm:inline-flex">
                      {it.kind === "part" ? term(niche, "part", locale) : term(niche, "service", locale)}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{it.name}</div>
                      <div className="text-xs text-fg-muted">
                        {Number(it.qty)} × {money(it.price)}
                        {it.staff_id && staffById.get(it.staff_id) ? ` · ${staffById.get(it.staff_id)}` : ""}
                      </div>
                    </div>
                    <div className="text-sm font-medium tabular-nums">{money(Number(it.qty) * Number(it.price))}</div>
                    <form action={deleteOrderItem.bind(null, slug, it.id)} className="no-print">
                      <button type="submit" className="rounded-md p-1.5 text-fg-subtle hover:bg-surface-2 hover:text-red-600" aria-label={t.common.delete}>
                        <X className="size-4" />
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState>{t.orders.noItems}</EmptyState>
            )}
            <div className="no-print border-t border-border bg-surface-2/40 p-4 sm:p-5">
              <AddItemForm
                action={addOrderItem.bind(null, slug, id)}
                t={t}
                catalog={(catalog.data ?? []).map((c) => ({ id: c.id, kind: c.kind, name: c.name, price: Number(c.price), stock: c.stock }))}
                staff={(staff.data ?? []).map((s) => ({ id: s.id, name: s.name }))}
                defaultStaffId={order.staff_id}
                labels={{ service: term(niche, "service", locale), part: term(niche, "part", locale), staff: term(niche, "staff", locale) }}
              />
            </div>
            <div className="flex items-center justify-between border-t border-border px-4 py-4 sm:px-5">
              <span className="text-sm text-fg-muted">{t.common.total}</span>
              <span className="text-xl font-semibold tabular-nums">{money(order.total)}</span>
            </div>
          </Card>

          {/* Payments */}
          <Card>
            <CardHeader
              title={t.orders.payments}
              action={
                <span className={cn("text-sm font-medium tabular-nums", debt > 0 ? "text-red-600" : "text-emerald-600")}>
                  {debt > 0 ? `${t.common.debt}: ${money(debt)}` : `${t.common.paid} ✓`}
                </span>
              }
            />
            {payments.data?.length ? (
              <ul className="divide-y divide-border">
                {payments.data.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 px-4 py-3 text-sm sm:px-5">
                    <span className="flex-1">
                      {t.orders.methods[p.method]} <span className="text-fg-muted">· {formatDate(p.created_at, locale, true)}</span>
                    </span>
                    <span className="font-medium tabular-nums">{money(p.amount)}</span>
                    <ConfirmForm action={deletePayment.bind(null, slug, p.id)} message={t.common.confirmDelete} className="no-print">
                      <button type="submit" className="rounded-md p-1.5 text-fg-subtle hover:bg-surface-2 hover:text-red-600" aria-label={t.common.delete}>
                        <X className="size-4" />
                      </button>
                    </ConfirmForm>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState>{t.orders.noPayments}</EmptyState>
            )}
            {debt > 0 && (
              <ActionForm action={addPayment.bind(null, slug, id)} className="no-print flex flex-wrap items-end gap-3 border-t border-border bg-surface-2/40 p-4 sm:p-5">
                <Field label={t.common.amount} className="w-32">
                  <Input name="amount" type="number" step="0.01" min="0.01" defaultValue={debt} required />
                </Field>
                <Field label={t.orders.method} className="w-36">
                  <Select name="method" defaultValue="cash">
                    {(["cash", "card", "transfer"] as const).map((m) => (
                      <option key={m} value={m}>{t.orders.methods[m]}</option>
                    ))}
                  </Select>
                </Field>
                <SubmitButton variant="primary">{t.orders.addPayment}</SubmitButton>
              </ActionForm>
            )}
          </Card>
        </div>

        <div className="grid content-start gap-6">
          {/* Client & asset */}
          <Card className="p-4 sm:p-5">
            {client ? (
              <Link href={`${base}/clients/${client.id}`} className="block hover:opacity-80">
                <div className="text-xs text-fg-muted">{t.orders.client}</div>
                <div className="mt-1 font-medium">{client.name}</div>
              </Link>
            ) : (
              <div className="text-sm text-fg-muted">—</div>
            )}
            {client?.phone && (
              <a href={`tel:${client.phone}`} className="mt-1 inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg">
                <Phone className="size-3.5" /> {client.phone}
              </a>
            )}
            {asset && (
              <div className="mt-4 border-t border-border pt-4">
                <div className="text-xs text-fg-muted">{term(niche, "asset", locale)}</div>
                <div className="mt-1 font-medium">{asset.title}</div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  {asset.identifier && (
                    <div>
                      <div className="text-xs text-fg-subtle">{niche.asset.identifierLabel[locale]}</div>
                      <div className="font-mono">{asset.identifier}</div>
                    </div>
                  )}
                  {niche.asset.fields
                    .filter((f) => !["make", "model"].includes(f.key) && asset.attributes?.[f.key])
                    .map((f) => (
                      <div key={f.key}>
                        <div className="text-xs text-fg-subtle">{f.label[locale]}</div>
                        <div className="truncate">{asset.attributes[f.key]}</div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </Card>

          {/* Details */}
          <Card className="no-print p-4 sm:p-5">
            <h2 className="mb-4 text-sm font-semibold">{t.orders.details}</h2>
            <ActionForm action={updateOrderDetails.bind(null, slug, id)} resetOnSuccess={false} successMessage={t.settings.saved} className="grid gap-4">
              <Field label={term(niche, "staff", locale)}>
                <Select name="staff_id" defaultValue={order.staff_id ?? ""}>
                  <option value="">{t.orders.noMaster}</option>
                  {(staff.data ?? []).map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </Select>
              </Field>
              {niche.orderFields.map((f) => (
                <Field key={f.key} label={f.label[locale]}>
                  {f.type === "text" ? (
                    <Textarea name={`order.${f.key}`} rows={2} defaultValue={order.attributes?.[f.key] ?? ""} />
                  ) : (
                    <Input name={`order.${f.key}`} type="number" defaultValue={order.attributes?.[f.key] ?? ""} />
                  )}
                </Field>
              ))}
              <Field label={t.common.notes}>
                <Textarea name="notes" rows={3} defaultValue={order.notes ?? ""} />
              </Field>
              <SubmitButton variant="secondary" pendingLabel={t.common.saving}>{t.common.save}</SubmitButton>
            </ActionForm>
          </Card>

          {/* Reminders */}
          {canRemind && (
            <Card className={cn("no-print p-4 sm:p-5", status.kind === "done" && !reminders.data?.length && "border-accent")}>
              <h2 className="mb-3 text-sm font-semibold">{t.orders.createReminder}</h2>
              {reminders.data?.map((r) => (
                <div key={r.id} className="mb-2 flex items-center justify-between gap-2 rounded-lg bg-surface-2 px-3 py-2 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate">{r.title}</span>
                    <span className="text-xs text-fg-muted">{formatDate(r.due_at, locale)} · {t.reminders.statuses[r.status]}</span>
                  </span>
                  {r.status === "pending" && (
                    <form action={setReminderStatus.bind(null, slug, r.id, "dismissed")}>
                      <button type="submit" className="text-fg-subtle hover:text-red-600" aria-label={t.reminders.dismiss}>
                        <X className="size-4" />
                      </button>
                    </form>
                  )}
                </div>
              ))}
              <ReminderForm
                action={createReminder.bind(null, slug)}
                t={t}
                presets={niche.reminderPresets.map((p) => ({ id: p.id, title: p.title[locale], months: p.months }))}
                hidden={{ client_id: client.id, asset_id: asset?.id ?? "", order_id: id }}
              />
            </Card>
          )}

          <ConfirmForm action={deleteOrder.bind(null, slug, id)} message={t.common.confirmDelete} className="no-print">
            <Button type="submit" variant="danger" size="sm">
              <Trash2 className="size-4" /> {t.orders.deleteOrder}
            </Button>
          </ConfirmForm>
        </div>
      </div>
    </>
  );
}

