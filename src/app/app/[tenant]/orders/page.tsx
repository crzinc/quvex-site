import { Plus, Search } from "lucide-react";
import { requireTenant } from "@/lib/auth";
import { openStatusIds, term } from "@/niches";
import { ButtonLink, Card, EmptyState, Input, PageHeader, Tabs } from "@/components/ui";
import { OrderList, ORDER_LIST_SELECT, type OrderRow } from "@/components/app/OrderList";
import { findAssetAndClientIds } from "@/lib/search";

export default async function OrdersPage({ params, searchParams }: PageProps<"/app/[tenant]/orders">) {
  const { tenant: slug } = await params;
  const sp = await searchParams;
  const filter = sp.filter === "done" || sp.filter === "all" ? sp.filter : "open";
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const { supabase, tenant, niche, locale, t } = await requireTenant(slug);
  const base = `/app/${slug}`;
  const open = openStatusIds(niche);

  let query = supabase.from("orders").select(ORDER_LIST_SELECT).eq("tenant_id", tenant.id).order("created_at", { ascending: false }).limit(100);
  if (filter === "open") query = query.in("status", open);
  if (filter === "done") query = query.not("status", "in", `(${open.join(",")})`);
  if (q) {
    if (/^\d+$/.test(q)) query = query.eq("number", Number(q));
    else {
      const { assetIds, clientIds } = await findAssetAndClientIds(supabase, tenant.id, q);
      const ors = [assetIds.length && `asset_id.in.(${assetIds.join(",")})`, clientIds.length && `client_id.in.(${clientIds.join(",")})`].filter(Boolean);
      if (!ors.length) query = query.eq("id", "00000000-0000-0000-0000-000000000000");
      else query = query.or(ors.join(","));
    }
  }
  const { data: orders } = await query;

  const tab = (f: string) => `${base}/orders?filter=${f}${q ? `&q=${encodeURIComponent(q)}` : ""}`;

  return (
    <>
      <PageHeader
        title={term(niche, "orders", locale)}
        actions={
          <ButtonLink href={`${base}/orders/new`} variant="accent">
            <Plus className="size-4" /> {t.orders.newOrder}
          </ButtonLink>
        }
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <Tabs
          items={[
            { href: tab("open"), label: t.orders.filterOpen, active: filter === "open" },
            { href: tab("done"), label: t.orders.filterDone, active: filter === "done" },
            { href: tab("all"), label: t.common.all, active: filter === "all" },
          ]}
        />
        <form className="relative sm:w-72">
          <input type="hidden" name="filter" value={filter} />
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-subtle" />
          <Input name="q" defaultValue={q} placeholder={`№, ${t.clients.searchPlaceholder.toLowerCase()}`} className="pl-9" />
        </form>
      </div>
      <Card>
        {orders?.length ? (
          <OrderList orders={orders as unknown as OrderRow[]} base={base} niche={niche} locale={locale} t={t} />
        ) : (
          <EmptyState>{t.common.empty}</EmptyState>
        )}
      </Card>
    </>
  );
}
