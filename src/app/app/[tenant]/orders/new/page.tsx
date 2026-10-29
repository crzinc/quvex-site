import { requireTenant } from "@/lib/auth";
import { term } from "@/niches";
import { PageHeader } from "@/components/ui";
import { NewOrderForm } from "@/components/app/NewOrderForm";
import { createOrder } from "@/lib/actions/crm";

export default async function NewOrderPage({ params, searchParams }: PageProps<"/app/[tenant]/orders/new">) {
  const { tenant: slug } = await params;
  const { client } = await searchParams;
  const { supabase, tenant, niche, locale, t } = await requireTenant(slug);

  const [clients, assets, staff] = await Promise.all([
    supabase.from("clients").select("id, name, phone").eq("tenant_id", tenant.id).order("created_at", { ascending: false }).limit(2000),
    supabase.from("assets").select("id, client_id, title, identifier").eq("tenant_id", tenant.id).limit(4000),
    supabase.from("staff").select("id, name").eq("tenant_id", tenant.id).eq("active", true).order("name"),
  ]);

  return (
    <>
      <PageHeader title={`${t.orders.newOrder} ${term(niche, "order", locale).toLowerCase()}`} back={{ href: `/app/${slug}/orders`, label: term(niche, "orders", locale) }} />
      <NewOrderForm
        action={createOrder.bind(null, slug)}
        t={t}
        locale={locale}
        clients={clients.data ?? []}
        assets={assets.data ?? []}
        staff={staff.data ?? []}
        initialClientId={typeof client === "string" ? client : undefined}
        assetLabel={term(niche, "asset", locale)}
        staffLabel={term(niche, "staff", locale)}
        assetConfig={{
          identifierLabel: niche.asset.identifierLabel[locale],
          identifierPlaceholder: niche.asset.identifierPlaceholder,
          fields: niche.asset.fields,
        }}
        orderFields={niche.orderFields}
      />
    </>
  );
}
