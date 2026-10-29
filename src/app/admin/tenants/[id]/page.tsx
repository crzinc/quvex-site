import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { ADMIN_TENANT_SELECT, owner, tenantState, type AdminTenant } from "@/lib/admin";
import { getNiche } from "@/niches";
import { PLANS, type PlanId } from "@/config/plans";
import { Badge, Button, ButtonLink, Card, CardHeader, EmptyState, Field, Input, PageHeader, Select, Stat } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/ui/forms";
import { TenantStateBadge } from "@/components/admin/TenantStateBadge";
import { recordBilling, setSubscription, setTenantStatus } from "@/lib/actions/admin";
import { BillingForm } from "@/components/admin/BillingForm";
import { daysAgo, formatDate, money } from "@/lib/utils";

export default async function AdminTenantPage({ params }: PageProps<"/admin/tenants/[id]">) {
  const { id } = await params;
  const { supabase, locale, t } = await requireAdmin();

  const { data: tenant } = await supabase.from("tenants").select(ADMIN_TENANT_SELECT).eq("id", id).maybeSingle<AdminTenant>();
  if (!tenant) notFound();

  const monthAgo = daysAgo(30).toISOString();
  const [billing, orders30, lastOrder] = await Promise.all([
    supabase.from("billing_payments").select("*").eq("tenant_id", id).order("created_at", { ascending: false }),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("tenant_id", id).gte("created_at", monthAgo),
    supabase.from("orders").select("created_at").eq("tenant_id", id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const o = owner(tenant);
  const members = tenant.memberships.length;
  const overLimit = tenant.user_limit !== null && members > tenant.user_limit;
  const state = tenantState(tenant);

  return (
    <>
      <PageHeader
        back={{ href: "/admin/tenants", label: t.admin.tenants }}
        title={<span className="flex items-center gap-3">{tenant.name} <TenantStateBadge state={state} t={t} /></span>}
        description={`${getNiche(tenant.niche).name[locale]} · ${tenant.city ?? ""} · /${tenant.slug}`}
        actions={
          <>
            <ButtonLink href={`/app/${tenant.slug}`} variant="secondary">
              <ExternalLink className="size-4" /> {t.admin.openCrm}
            </ButtonLink>
            <form action={setTenantStatus.bind(null, id, tenant.status === "active" ? "suspended" : "active")}>
              <Button type="submit" variant={tenant.status === "active" ? "danger" : "primary"}>
                {tenant.status === "active" ? t.admin.suspend : t.admin.activate}
              </Button>
            </form>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={t.admin.clientsCount} value={tenant.clients[0]?.count ?? 0} />
        <Stat label={t.admin.ordersCount} value={tenant.orders[0]?.count ?? 0} hint={`30d: ${orders30.count ?? 0}`} />
        <Stat label={t.admin.activity} value={lastOrder.data ? formatDate(lastOrder.data.created_at, locale) : "—"} />
        <Stat
          label={tenant.plan === "trial" ? t.admin.trialUntil : t.admin.paidUntil}
          value={formatDate(tenant.plan === "trial" ? tenant.trial_ends_at : tenant.paid_until, locale)}
          hint={t.plans[tenant.plan]}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="grid content-start gap-6">
          <Card>
            <CardHeader title={t.admin.billingHistory} />
            {billing.data?.length ? (
              <ul className="divide-y divide-border">
                {billing.data.map((b) => (
                  <li key={b.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm sm:px-5">
                    <span>
                      <span className="font-medium">{t.plans[b.plan as PlanId] ?? b.plan}</span> · {b.months} {t.admin.months.toLowerCase()}
                      <span className="block text-xs text-fg-muted">{formatDate(b.created_at, locale)} {b.method && `· ${b.method}`} {b.note && `· ${b.note}`}</span>
                    </span>
                    <span className="font-medium tabular-nums">{money(b.amount)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState>{t.common.empty}</EmptyState>
            )}
          </Card>
          <Card className="p-4 sm:p-5">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-xs text-fg-muted">{t.admin.owner}</dt><dd className="mt-1">{o?.full_name} · {o?.email}</dd></div>
              <div><dt className="text-xs text-fg-muted">{t.common.phone}</dt><dd className="mt-1">{tenant.phone ?? "—"}</dd></div>
              <div><dt className="text-xs text-fg-muted">{t.admin.createdAt}</dt><dd className="mt-1">{formatDate(tenant.created_at, locale)}</dd></div>
              <div><dt className="text-xs text-fg-muted">{t.settings.modules}</dt><dd className="mt-1">{tenant.modules.join(", ")}</dd></div>
            </dl>
          </Card>
        </div>

        <div className="grid content-start gap-6">
          <Card className="p-4 sm:p-5">
            <h2 className="text-sm font-semibold">{t.admin.subscription}</h2>
            <div className="mt-3 flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2 text-sm">
              <span>
                {t.plans[tenant.plan]} · {t.admin.users}: {members}/{tenant.user_limit ?? "∞"}
              </span>
              {overLimit && <Badge tone="amber">{t.admin.overLimit}</Badge>}
            </div>
            <ActionForm action={setSubscription.bind(null, id)} resetOnSuccess={false} successMessage={t.settings.saved} className="mt-4 grid gap-3">
              <p className="text-xs text-fg-muted">{t.admin.changePlanHint}</p>
              <Field label={t.admin.plan}>
                <Select name="plan" defaultValue={tenant.plan}>
                  <option value="trial">{t.plans.trial}</option>
                  {PLANS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {t.plans[p.id]} · {p.price} ₼ · {p.userLimit ?? "∞"} {t.admin.users.toLowerCase()}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t.admin.trialUntil}>
                  <Input name="trial_ends_at" type="date" defaultValue={tenant.trial_ends_at.slice(0, 10)} />
                </Field>
                <Field label={t.admin.paidUntil}>
                  <Input name="paid_until" type="date" defaultValue={tenant.paid_until?.slice(0, 10) ?? ""} />
                </Field>
              </div>
              <SubmitButton variant="secondary">{t.admin.changePlan}</SubmitButton>
            </ActionForm>
          </Card>
          <Card className="p-4 sm:p-5">
            <h2 className="mb-4 text-sm font-semibold">{t.admin.recordPayment}</h2>
            <BillingForm action={recordBilling.bind(null, id)} t={t} defaultPlan={tenant.plan === "trial" ? "start" : tenant.plan} />
          </Card>
        </div>
      </div>
    </>
  );
}
