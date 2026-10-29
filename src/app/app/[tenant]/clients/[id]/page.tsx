import { notFound } from "next/navigation";
import { MessageCircle, Phone, Plus, Trash2, X } from "lucide-react";
import { requireTenant } from "@/lib/auth";
import { hasModule, term } from "@/niches";
import { Button, ButtonLink, Card, CardHeader, EmptyState, PageHeader, Stat, buttonClass } from "@/components/ui";
import { ActionForm, ConfirmForm, SubmitButton } from "@/components/ui/forms";
import { ClientFields } from "@/components/app/ClientFields";
import { AssetFields } from "@/components/app/AssetFields";
import { OrderList, ORDER_LIST_SELECT, type OrderRow } from "@/components/app/OrderList";
import { ReminderForm } from "@/components/app/ReminderForm";
import { createAsset, createReminder, deleteAsset, deleteClient, updateClient } from "@/lib/actions/crm";
import { formatDate, money, whatsappLink } from "@/lib/utils";
import type { Asset, Client, Reminder } from "@/lib/types";

export default async function ClientPage({ params }: PageProps<"/app/[tenant]/clients/[id]">) {
  const { tenant: slug, id } = await params;
  const { supabase, tenant, niche, locale, t } = await requireTenant(slug);
  const base = `/app/${slug}`;

  const { data: client } = await supabase.from("clients").select("*").eq("tenant_id", tenant.id).eq("id", id).maybeSingle<Client>();
  if (!client) notFound();

  const [assets, orders, reminders] = await Promise.all([
    supabase.from("assets").select("*").eq("client_id", id).order("created_at").returns<Asset[]>(),
    supabase.from("orders").select(ORDER_LIST_SELECT).eq("client_id", id).order("created_at", { ascending: false }).limit(100),
    supabase.from("reminders").select("*").eq("client_id", id).order("due_at", { ascending: false }).limit(20).returns<Reminder[]>(),
  ]);

  const orderRows = (orders.data ?? []) as unknown as OrderRow[];
  const valid = orderRows.filter((o) => o.status !== "cancelled");
  const spent = valid.reduce((s, o) => s + Number(o.paid), 0);
  const debt = valid.reduce((s, o) => s + Math.max(0, Number(o.total) - Number(o.paid)), 0);
  const wa = whatsappLink(client.phone, `${client.name}, `);

  return (
    <>
      <PageHeader
        back={{ href: `${base}/clients`, label: t.nav.clients }}
        title={client.name}
        description={
          client.phone && (
            <a href={`tel:${client.phone}`} className="inline-flex items-center gap-1.5 hover:text-fg">
              <Phone className="size-3.5" /> {client.phone}
            </a>
          )
        }
        actions={
          <>
            {wa && (
              <a href={wa} target="_blank" rel="noreferrer" className={buttonClass("secondary")}>
                <MessageCircle className="size-4 text-[#25D366]" /> {t.common.whatsapp}
              </a>
            )}
            {hasModule(tenant.modules, "orders") && (
              <ButtonLink href={`${base}/orders/new?client=${id}`} variant="accent">
                <Plus className="size-4" /> {term(niche, "order", locale)}
              </ButtonLink>
            )}
          </>
        }
      />

      <div className="mb-6 grid grid-cols-3 gap-3">
        <Stat label={t.clients.visits} value={valid.length} />
        <Stat label={t.clients.spent} value={money(spent)} />
        <Stat label={t.common.debt} value={<span className={debt > 0 ? "text-red-600" : undefined}>{money(debt)}</span>} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="grid content-start gap-6">
          {/* Assets */}
          <Card>
            <CardHeader title={term(niche, "assets", locale)} />
            {assets.data?.length ? (
              <ul className="divide-y divide-border">
                {assets.data.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{a.title}</div>
                      <div className="text-xs text-fg-muted">
                        {[a.identifier, a.attributes?.year, a.attributes?.mileage && `${a.attributes.mileage} km`, a.attributes?.vin].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                    <ConfirmForm action={deleteAsset.bind(null, slug, a.id)} message={t.common.confirmDelete}>
                      <button type="submit" className="rounded-md p-1.5 text-fg-subtle hover:bg-surface-2 hover:text-red-600" aria-label={t.common.delete}>
                        <X className="size-4" />
                      </button>
                    </ConfirmForm>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState>{t.clients.noAssets}</EmptyState>
            )}
            <details className="group border-t border-border">
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-fg-muted hover:text-fg sm:px-5">
                + {t.clients.addAsset}
              </summary>
              <ActionForm action={createAsset.bind(null, slug, id)} className="grid gap-4 px-4 pb-4 sm:px-5 sm:pb-5">
                <AssetFields
                  locale={locale}
                  identifierLabel={niche.asset.identifierLabel[locale]}
                  identifierPlaceholder={niche.asset.identifierPlaceholder}
                  fields={niche.asset.fields}
                />
                <div>
                  <SubmitButton>{t.common.add}</SubmitButton>
                </div>
              </ActionForm>
            </details>
          </Card>

          {/* History */}
          <Card>
            <CardHeader title={t.clients.history} />
            {orderRows.length ? (
              <OrderList orders={orderRows} base={base} niche={niche} locale={locale} t={t} />
            ) : (
              <EmptyState>{t.clients.noOrders}</EmptyState>
            )}
          </Card>
        </div>

        <div className="grid content-start gap-6">
          <Card className="p-4 sm:p-5">
            <ActionForm action={updateClient.bind(null, slug, id)} resetOnSuccess={false} successMessage={t.settings.saved} className="grid gap-4">
              <ClientFields t={t} client={client} />
              <SubmitButton variant="secondary" pendingLabel={t.common.saving}>{t.common.save}</SubmitButton>
            </ActionForm>
          </Card>

          {hasModule(tenant.modules, "reminders") && (
            <Card className="p-4 sm:p-5">
              <h2 className="mb-3 text-sm font-semibold">{t.reminders.title}</h2>
              {reminders.data?.map((r) => (
                <div key={r.id} className="mb-2 rounded-lg bg-surface-2 px-3 py-2 text-sm">
                  <div className="truncate">{r.title}</div>
                  <div className="text-xs text-fg-muted">{formatDate(r.due_at, locale)} · {t.reminders.statuses[r.status]}</div>
                </div>
              ))}
              <ReminderForm
                action={createReminder.bind(null, slug)}
                t={t}
                presets={niche.reminderPresets.map((p) => ({ id: p.id, title: p.title[locale], months: p.months }))}
                hidden={{ client_id: id, asset_id: assets.data?.[0]?.id ?? "" }}
              />
            </Card>
          )}

          <ConfirmForm action={deleteClient.bind(null, slug, id)} message={t.common.confirmDelete}>
            <Button type="submit" variant="danger" size="sm">
              <Trash2 className="size-4" /> {t.common.delete}
            </Button>
          </ConfirmForm>
        </div>
      </div>
    </>
  );
}
