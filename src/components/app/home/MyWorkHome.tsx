import Link from "next/link";
import type { TenantContext } from "@/lib/auth";
import { openStatusIds } from "@/niches";
import { Card, EmptyState, PageHeader, Stat } from "@/components/ui";
import { StatusBadge } from "@/components/app/StatusBadge";
import { AdvanceButton } from "./AdvanceButton";
import { earnings, monthLabour } from "@/lib/payroll";
import { money } from "@/lib/utils";
import type { Staff } from "@/lib/types";

const SELECT = "id, number, status, attributes, assets(title, identifier), clients(name)";

interface Job {
  id: string;
  number: number;
  status: string;
  attributes: Record<string, string>;
  assets: { title: string; identifier: string | null } | null;
  clients: { name: string } | null;
}

/** Master home: only the jobs assigned to me, big tap targets, and my earnings this month. */
export async function MyWorkHome({ ctx }: { ctx: TenantContext }) {
  const { supabase, tenant, niche, locale, t, staffId, workspace } = ctx;
  const slug = tenant.slug;
  const base = `/app/${slug}`;

  if (!staffId) {
    return (
      <>
        <PageHeader title={workspace.homeLabel[locale]} description={tenant.name} />
        <Card>
          <EmptyState>{t.home.notLinked}</EmptyState>
        </Card>
      </>
    );
  }

  const open = openStatusIds(niche);
  const [assigned, viaItems, me, labour] = await Promise.all([
    supabase.from("orders").select(SELECT).eq("tenant_id", tenant.id).eq("staff_id", staffId).in("status", open),
    supabase.from("order_items").select("order_id").eq("tenant_id", tenant.id).eq("staff_id", staffId),
    supabase.from("staff").select("*").eq("id", staffId).maybeSingle<Staff>(),
    monthLabour(supabase, tenant.id, niche, staffId),
  ]);

  // Jobs where I'm the order's master, plus orders where I was put on individual lines.
  const extraIds = [...new Set((viaItems.data ?? []).map((r) => r.order_id as string))].filter(
    (id) => !(assigned.data ?? []).some((o) => o.id === id),
  );
  const extra = extraIds.length
    ? await supabase.from("orders").select(SELECT).in("id", extraIds).in("status", open)
    : { data: [] };
  const jobs = [...(assigned.data ?? []), ...(extra.data ?? [])] as unknown as Job[];
  jobs.sort((a, b) => a.number - b.number);

  const mine = labour.get(staffId);

  return (
    <>
      <PageHeader title={workspace.homeLabel[locale]} description={me.data?.name} />
      <div className="mb-6 grid grid-cols-2 gap-3">
        <Stat label={t.home.myEarnings} value={money(earnings(mine, me.data?.commission_percent ?? 0))} />
        <Stat label={t.home.myDone} value={mine?.count ?? 0} />
      </div>

      {jobs.length === 0 ? (
        <Card>
          <EmptyState>{t.home.myWorkEmpty}</EmptyState>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((j) => (
            <Card key={j.id} className="flex flex-col p-4">
              <Link href={`${base}/orders/${j.id}`} className="block flex-1">
                <div className="flex items-start justify-between gap-2">
                  <StatusBadge niche={niche} status={j.status} locale={locale} />
                  <span className="text-xs text-fg-subtle tabular-nums">#{j.number}</span>
                </div>
                <div className="mt-3 text-lg font-semibold">{j.assets?.title ?? j.clients?.name ?? "—"}</div>
                {j.assets?.identifier && <div className="font-mono text-sm">{j.assets.identifier}</div>}
                {j.attributes?.complaint && <p className="mt-2 line-clamp-3 text-sm text-fg-muted">{j.attributes.complaint}</p>}
              </Link>
              <div className="mt-4">
                <AdvanceButton slug={slug} orderId={j.id} status={j.status} niche={niche} locale={locale} size="lg" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
