import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { loadTenants, mrr, owner, tenantState } from "@/lib/admin";
import { getNiche } from "@/niches";
import { ButtonLink, Card, CardHeader, EmptyState, PageHeader, Stat } from "@/components/ui";
import { TenantStateBadge } from "@/components/admin/TenantStateBadge";
import { daysAgo, formatDate, money } from "@/lib/utils";
import type { Lead } from "@/lib/types";

export default async function AdminOverview() {
  const { supabase, locale, t } = await requireAdmin();
  const weekAgo = daysAgo(7).toISOString();

  const [tenants, leads, ordersWeek] = await Promise.all([
    loadTenants(supabase),
    supabase.from("leads").select("*").order("created_at", { ascending: false }).limit(6).returns<Lead[]>(),
    supabase.from("orders").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
  ]);
  const { count: newLeads } = await supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "new");
  const states = tenants.map(tenantState);

  return (
    <>
      <PageHeader title={t.admin.overview} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label={t.admin.totalTenants} value={tenants.length} href="/admin/tenants" />
        <Stat label={t.admin.payingTenants} value={states.filter((s) => s === "paying").length} />
        <Stat label={t.admin.trialTenants} value={states.filter((s) => s === "trial").length} />
        <Stat label={t.admin.mrr} value={money(mrr(tenants))} />
        <Stat label={t.admin.newLeads} value={newLeads ?? 0} hint={`${t.admin.ordersWeek}: ${ordersWeek.count ?? 0}`} href="/admin/leads" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title={t.admin.tenants} action={<ButtonLink href="/admin/tenants" variant="ghost" size="sm">{t.dashboard.viewAll}</ButtonLink>} />
          {tenants.length ? (
            <ul className="divide-y divide-border">
              {tenants.slice(0, 8).map((tn) => (
                <li key={tn.id}>
                  <Link href={`/admin/tenants/${tn.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2/60 sm:px-5">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{tn.name}</span>
                      <span className="block truncate text-xs text-fg-muted">
                        {getNiche(tn.niche).name[locale]} · {owner(tn)?.email} · {formatDate(tn.created_at, locale)}
                      </span>
                    </span>
                    <TenantStateBadge state={tenantState(tn)} t={t} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState>{t.common.empty}</EmptyState>
          )}
        </Card>
        <Card>
          <CardHeader title={t.admin.leads} action={<ButtonLink href="/admin/leads" variant="ghost" size="sm">{t.dashboard.viewAll}</ButtonLink>} />
          {leads.data?.length ? (
            <ul className="divide-y divide-border">
              {leads.data.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm sm:px-5">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{l.name}{l.business_name && ` · ${l.business_name}`}</span>
                    <span className="block text-xs text-fg-muted">{l.phone} · {formatDate(l.created_at, locale, true)}</span>
                  </span>
                  <span className="text-xs text-fg-muted">{t.admin.leadStatuses[l.status]}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState>{t.common.empty}</EmptyState>
          )}
        </Card>
      </div>
    </>
  );
}
