import Link from "next/link";
import { Plus } from "lucide-react";
import type { TenantContext } from "@/lib/auth";
import { hasModule, term } from "@/niches";
import { ButtonLink, PageHeader, Stat } from "@/components/ui";
import { AdvanceButton } from "./AdvanceButton";
import { ORDER_LIST_SELECT, type OrderRow } from "@/components/app/OrderList";
import { bakuToday, cn, formatDate, money } from "@/lib/utils";

const toneBar: Record<string, string> = {
  slate: "bg-stone-400",
  blue: "bg-blue-500",
  amber: "bg-amber-500",
  violet: "bg-violet-500",
  green: "bg-emerald-500",
  red: "bg-red-500",
};

/** Manager home: every open order as a card in its status column. */
export async function BoardHome({ ctx }: { ctx: TenantContext }) {
  const { supabase, tenant, niche, locale, t, can, workspace } = ctx;
  const slug = tenant.slug;
  const base = `/app/${slug}`;
  const columns = niche.statuses.filter((s) => s.kind === "open");
  const today = bakuToday();

  const [orders, reminders, cash] = await Promise.all([
    supabase
      .from("orders")
      .select(ORDER_LIST_SELECT)
      .eq("tenant_id", tenant.id)
      .in("status", columns.map((c) => c.id))
      .order("created_at")
      .limit(300),
    hasModule(tenant.modules, "reminders")
      ? supabase.from("reminders").select("id", { count: "exact", head: true }).eq("tenant_id", tenant.id).eq("status", "pending").lte("due_at", today)
      : null,
    can.viewFinance
      ? supabase.from("payments").select("amount").eq("tenant_id", tenant.id).eq("direction", "in").gte("created_at", `${today}T00:00:00+04:00`)
      : null,
  ]);
  const rows = (orders.data ?? []) as unknown as OrderRow[];

  return (
    <>
      <PageHeader
        title={workspace.homeLabel[locale]}
        description={tenant.name}
        actions={
          hasModule(tenant.modules, "orders") && (
            <ButtonLink href={`${base}/orders/new`} variant="accent">
              <Plus className="size-4" /> {t.orders.newOrder} {term(niche, "order", locale).toLowerCase()}
            </ButtonLink>
          )
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={t.dashboard.inWork} value={rows.length} />
        {reminders && <Stat label={t.dashboard.remindersDue} value={reminders.count ?? 0} href={`${base}/reminders`} />}
        {cash && <Stat label={t.dashboard.revenueToday} value={money((cash.data ?? []).reduce((s, p) => s + Number(p.amount), 0))} />}
      </div>

      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
        {columns.map((col) => {
          const cards = rows.filter((o) => o.status === col.id);
          return (
            <section key={col.id} className="flex w-72 shrink-0 flex-col rounded-xl bg-surface-2/70 p-2">
              <header className="flex items-center gap-2 px-2 py-1.5 text-sm font-medium">
                <span className={cn("size-2 rounded-full", toneBar[col.tone])} />
                {col.label[locale]}
                <span className="ml-auto text-xs text-fg-subtle tabular-nums">{cards.length}</span>
              </header>
              <div className="flex flex-col gap-2">
                {cards.length === 0 && <p className="px-2 py-4 text-center text-xs text-fg-subtle">{t.home.empty}</p>}
                {cards.map((o) => (
                  <article key={o.id} className="rounded-lg border border-border bg-surface p-3">
                    <Link href={`${base}/orders/${o.id}`} className="block">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium">{o.assets?.title ?? o.clients?.name ?? "—"}</span>
                        <span className="text-xs text-fg-subtle tabular-nums">#{o.number}</span>
                      </div>
                      {o.assets?.identifier && <div className="mt-0.5 font-mono text-xs">{o.assets.identifier}</div>}
                      <div className="mt-2 flex items-center justify-between gap-2 text-xs text-fg-muted">
                        <span className="truncate">{o.staff?.name ?? t.orders.noMaster}</span>
                        <span className="shrink-0 tabular-nums">{money(o.total)}</span>
                      </div>
                      <div className="mt-0.5 text-[11px] text-fg-subtle">{formatDate(o.created_at, locale, true)}</div>
                    </Link>
                    <div className="mt-2">
                      <AdvanceButton slug={slug} orderId={o.id} status={o.status} niche={niche} locale={locale} />
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
