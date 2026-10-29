import { Plus } from "lucide-react";
import { requireTenant } from "@/lib/auth";
import { hasModule, openStatusIds, term } from "@/niches";
import { ButtonLink, Card, CardHeader, EmptyState, PageHeader, Stat } from "@/components/ui";
import { OrderList, ORDER_LIST_SELECT, type OrderRow } from "@/components/app/OrderList";
import { bakuToday, daysAgo, money, startOfMonth } from "@/lib/utils";

export default async function DashboardPage({ params }: PageProps<"/app/[tenant]">) {
  const { tenant: slug } = await params;
  const { supabase, tenant, niche, locale, t } = await requireTenant(slug);
  const base = `/app/${slug}`;
  const open = openStatusIds(niche);
  const today = bakuToday();
  const since14 = daysAgo(13);
  since14.setHours(0, 0, 0, 0);
  const monthStart = startOfMonth();
  const from = since14 < monthStart ? since14 : monthStart;

  const [active, payments, debts, reminders] = await Promise.all([
    supabase.from("orders").select(ORDER_LIST_SELECT, { count: "exact" }).eq("tenant_id", tenant.id).in("status", open).order("created_at", { ascending: false }).limit(8),
    supabase.from("payments").select("amount, created_at").eq("tenant_id", tenant.id).eq("direction", "in").gte("created_at", from.toISOString()),
    supabase.from("orders").select("debt").eq("tenant_id", tenant.id).neq("status", "cancelled").gt("debt", 0),
    supabase.from("reminders").select("id", { count: "exact", head: true }).eq("tenant_id", tenant.id).eq("status", "pending").lte("due_at", today),
  ]);

  // Revenue per Baku calendar day.
  const dayKey = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Baku" });
  const byDay = new Map<string, number>();
  let monthRevenue = 0;
  for (const p of payments.data ?? []) {
    byDay.set(dayKey(p.created_at), (byDay.get(dayKey(p.created_at)) ?? 0) + Number(p.amount));
    if (new Date(p.created_at) >= monthStart) monthRevenue += Number(p.amount);
  }
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(since14.getTime() + i * 86_400_000 + 12 * 3_600_000);
    const key = d.toLocaleDateString("en-CA", { timeZone: "Asia/Baku" });
    return { key, label: d.getDate(), value: byDay.get(key) ?? 0 };
  });
  const max = Math.max(1, ...days.map((d) => d.value));
  const debtTotal = (debts.data ?? []).reduce((s, o) => s + Number(o.debt), 0);

  const ordersEnabled = hasModule(tenant.modules, "orders");

  return (
    <>
      <PageHeader
        title={tenant.name}
        description={t.dashboard.greeting}
        actions={
          ordersEnabled && (
            <ButtonLink href={`${base}/orders/new`} variant="accent">
              <Plus className="size-4" /> {t.orders.newOrder} {term(niche, "order", locale).toLowerCase()}
            </ButtonLink>
          )
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={t.dashboard.inWork} value={active.count ?? 0} href={`${base}/orders`} />
        <Stat label={t.dashboard.revenueToday} value={money(byDay.get(today) ?? 0)} />
        <Stat label={t.dashboard.revenueMonth} value={money(monthRevenue)} href={hasModule(tenant.modules, "finance") ? `${base}/finance` : undefined} />
        {hasModule(tenant.modules, "reminders") ? (
          <Stat label={t.dashboard.remindersDue} value={reminders.count ?? 0} hint={`${t.dashboard.debts}: ${money(debtTotal)}`} href={`${base}/reminders`} />
        ) : (
          <Stat label={t.dashboard.debts} value={money(debtTotal)} />
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card>
          <CardHeader
            title={t.dashboard.activeOrders}
            action={<ButtonLink href={`${base}/orders`} variant="ghost" size="sm">{t.dashboard.viewAll}</ButtonLink>}
          />
          {active.data?.length ? (
            <OrderList orders={active.data as unknown as OrderRow[]} base={base} niche={niche} locale={locale} t={t} />
          ) : (
            <EmptyState
              action={ordersEnabled && <ButtonLink href={`${base}/orders/new`} size="sm"><Plus className="size-4" /> {t.common.create}</ButtonLink>}
            >
              {t.dashboard.noActive}
            </EmptyState>
          )}
        </Card>

        <Card className="self-start">
          <CardHeader title={t.dashboard.last14} />
          <div className="flex h-40 items-end gap-1 px-4 pt-4 pb-2 sm:px-5">
            {days.map((d) => (
              <div key={d.key} className="group flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${d.key}: ${money(d.value)}`}>
                <div
                  className={d.key === today ? "w-full rounded-sm bg-accent" : "w-full rounded-sm bg-stone-300 group-hover:bg-stone-400 dark:bg-stone-700"}
                  style={{ height: `${Math.max(2, (d.value / max) * 100)}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-1 px-4 pb-4 text-[10px] text-fg-subtle sm:px-5">
            {days.map((d) => (
              <span key={d.key} className="flex-1 text-center tabular-nums">{d.label}</span>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
