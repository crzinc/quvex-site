import { requireTenant } from "@/lib/auth";
import { Badge, Card, CardHeader, Field, Input, PageHeader } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/ui/forms";
import { updateTenant } from "@/lib/actions/crm";
import { planPrice } from "@/config/plans";
import { formatDate } from "@/lib/utils";

export default async function SettingsPage({ params }: PageProps<"/app/[tenant]/settings">) {
  const { tenant: slug } = await params;
  const { supabase, tenant, niche, locale, t } = await requireTenant(slug);

  const { data: members } = await supabase
    .from("memberships")
    .select("role, profiles(full_name, email)")
    .eq("tenant_id", tenant.id);

  return (
    <>
      <PageHeader title={t.settings.title} />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <ActionForm action={updateTenant.bind(null, slug)} resetOnSuccess={false} successMessage={t.settings.saved} className="grid content-start gap-6">
          <Card>
            <CardHeader title={t.settings.business} />
            <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
              <Field label={t.auth.businessName} className="sm:col-span-2">
                <Input name="name" required defaultValue={tenant.name} />
              </Field>
              <Field label={t.auth.city}>
                <Input name="city" defaultValue={tenant.city ?? ""} />
              </Field>
              <Field label={t.common.phone} hint="WhatsApp">
                <Input name="phone" type="tel" defaultValue={tenant.phone ?? ""} />
              </Field>
              <Field label={t.settings.address} className="sm:col-span-2">
                <Input name="address" defaultValue={tenant.address ?? ""} />
              </Field>
            </div>
          </Card>
          <Card>
            <CardHeader title={t.settings.modules} />
            <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
              <p className="text-sm text-fg-muted sm:col-span-2">{t.settings.modulesHint}</p>
              {niche.modules.map((m) => (
                <label key={m} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-sm">
                  <input type="checkbox" name={`module.${m}`} defaultChecked={tenant.modules.includes(m)} className="size-4 accent-[var(--accent)]" />
                  {t.settings.moduleNames[m]}
                </label>
              ))}
            </div>
          </Card>
          <div>
            <SubmitButton pendingLabel={t.common.saving}>{t.common.save}</SubmitButton>
          </div>
        </ActionForm>

        <div className="grid content-start gap-6">
          <Card className="p-4 sm:p-5">
            <dl className="grid gap-4 text-sm">
              <div>
                <dt className="text-xs text-fg-muted">{t.settings.niche}</dt>
                <dd className="mt-1 font-medium">{niche.name[locale]}</dd>
              </div>
              <div>
                <dt className="text-xs text-fg-muted">{t.settings.plan}</dt>
                <dd className="mt-1 flex items-center gap-2 font-medium">
                  {t.plans[tenant.plan]}
                  {tenant.plan !== "trial" && <span className="text-fg-muted">{planPrice(tenant.plan)} ₼{t.common.perMonth}</span>}
                </dd>
                <dd className="mt-1 text-xs text-fg-muted">
                  {tenant.plan === "trial"
                    ? `${t.admin.trialUntil}: ${formatDate(tenant.trial_ends_at, locale)}`
                    : `${t.admin.paidUntil}: ${formatDate(tenant.paid_until, locale)}`}
                </dd>
              </div>
            </dl>
          </Card>
          <Card>
            <CardHeader title={t.settings.team} />
            <ul className="divide-y divide-border">
              {(members ?? []).map((m, i) => {
                const p = m.profiles as unknown as { full_name: string | null; email: string | null } | null;
                return (
                  <li key={i} className="flex items-center justify-between gap-3 px-4 py-3 text-sm sm:px-5">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{p?.full_name ?? p?.email}</span>
                      <span className="block truncate text-xs text-fg-muted">{p?.email}</span>
                    </span>
                    <Badge>{t.settings.roles[m.role as keyof typeof t.settings.roles]}</Badge>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
