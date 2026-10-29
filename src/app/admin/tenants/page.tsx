import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { loadTenants, owner, tenantState, type TenantState } from "@/lib/admin";
import { getNiche } from "@/niches";
import { Card, EmptyState, PageHeader, Table, Tabs, Td, Th } from "@/components/ui";
import { TenantStateBadge } from "@/components/admin/TenantStateBadge";
import { formatDate } from "@/lib/utils";

const FILTERS: (TenantState | "all")[] = ["all", "paying", "trial", "expired", "suspended"];

export default async function AdminTenants({ searchParams }: PageProps<"/admin/tenants">) {
  const { supabase, locale, t } = await requireAdmin();
  const raw = (await searchParams).state;
  const filter = FILTERS.includes(raw as TenantState) ? (raw as TenantState | "all") : "all";
  const all = await loadTenants(supabase);
  const tenants = filter === "all" ? all : all.filter((tn) => tenantState(tn) === filter);
  const labels = { all: t.common.all, ...t.admin.states };

  return (
    <>
      <PageHeader title={t.admin.tenants} />
      <Tabs
        items={FILTERS.map((f) => ({
          href: f === "all" ? "/admin/tenants" : `/admin/tenants?state=${f}`,
          label: labels[f],
          active: filter === f,
          count: f === "all" ? all.length : all.filter((tn) => tenantState(tn) === f).length,
        }))}
      />
      <Card>
        {tenants.length ? (
          <Table>
            <thead>
              <tr>
                <Th>{t.auth.businessName}</Th>
                <Th>{t.admin.owner}</Th>
                <Th>{t.common.status}</Th>
                <Th className="text-right">{t.admin.clientsCount}</Th>
                <Th className="text-right">{t.admin.ordersCount}</Th>
                <Th>{t.admin.paidUntil}</Th>
                <Th>{t.admin.createdAt}</Th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tn) => (
                <tr key={tn.id} className="hover:bg-surface-2/60">
                  <Td>
                    <Link href={`/admin/tenants/${tn.id}`} className="font-medium hover:underline">{tn.name}</Link>
                    <div className="text-xs text-fg-muted">{getNiche(tn.niche).name[locale]} · {tn.city}</div>
                  </Td>
                  <Td className="text-fg-muted">
                    <div>{owner(tn)?.full_name}</div>
                    <div className="text-xs">{owner(tn)?.email} {tn.phone && `· ${tn.phone}`}</div>
                  </Td>
                  <Td>
                    <TenantStateBadge state={tenantState(tn)} t={t} />
                    <div className="mt-1 text-xs text-fg-muted">{t.plans[tn.plan]}</div>
                  </Td>
                  <Td className="text-right tabular-nums">{tn.clients[0]?.count ?? 0}</Td>
                  <Td className="text-right tabular-nums">{tn.orders[0]?.count ?? 0}</Td>
                  <Td className="whitespace-nowrap text-fg-muted">
                    {tn.plan === "trial" ? `${t.admin.trialUntil} ${formatDate(tn.trial_ends_at, locale)}` : formatDate(tn.paid_until, locale)}
                  </Td>
                  <Td className="whitespace-nowrap text-fg-muted">{formatDate(tn.created_at, locale)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <EmptyState>{t.common.empty}</EmptyState>
        )}
      </Card>
    </>
  );
}
