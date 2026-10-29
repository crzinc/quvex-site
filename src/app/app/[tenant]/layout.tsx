import type { Metadata } from "next";
import { getProfile, isTrialExpired, requireTenant } from "@/lib/auth";
import { hasModule, term } from "@/niches";
import { Sidebar, type NavItem } from "@/components/app/Sidebar";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { fill } from "@/i18n/dictionaries";
import { bakuToday, daysUntil, formatDate } from "@/lib/utils";

export async function generateMetadata({ params }: LayoutProps<"/app/[tenant]">): Promise<Metadata> {
  const { tenant } = await requireTenant((await params).tenant);
  return { title: tenant.name };
}

export default async function TenantLayout({ children, params }: LayoutProps<"/app/[tenant]">) {
  const { tenant: slug } = await params;
  const { supabase, tenant, niche, locale, t } = await requireTenant(slug);
  const profile = await getProfile();
  const base = `/app/${slug}`;
  const m = tenant.modules;

  const { count: dueReminders } = hasModule(m, "reminders")
    ? await supabase.from("reminders").select("id", { count: "exact", head: true }).eq("tenant_id", tenant.id).eq("status", "pending").lte("due_at", bakuToday())
    : { count: 0 };

  const items: NavItem[] = [
    { id: "dashboard", href: base, label: t.nav.dashboard },
    ...(hasModule(m, "orders") ? [{ id: "orders", href: `${base}/orders`, label: term(niche, "orders", locale) } as NavItem] : []),
    { id: "clients", href: `${base}/clients`, label: t.nav.clients },
    ...(hasModule(m, "reminders") ? [{ id: "reminders", href: `${base}/reminders`, label: t.nav.reminders, badge: dueReminders ?? 0 } as NavItem] : []),
    { id: "catalog", href: `${base}/catalog`, label: hasModule(m, "inventory") ? t.nav.catalog : t.catalog.services },
    ...(hasModule(m, "staff") ? [{ id: "staff", href: `${base}/staff`, label: term(niche, "staff", locale) } as NavItem] : []),
    ...(hasModule(m, "finance") ? [{ id: "finance", href: `${base}/finance`, label: t.nav.finance } as NavItem] : []),
    { id: "settings", href: `${base}/settings`, label: t.nav.settings },
    ...(profile?.is_platform_admin ? [{ id: "admin", href: "/admin", label: t.nav.admin } as NavItem] : []),
  ];

  const suspended = tenant.status === "suspended" && !profile?.is_platform_admin;
  const trialExpired = isTrialExpired(tenant);
  const trialDaysLeft = daysUntil(tenant.trial_ends_at);

  return (
    <div className="min-h-dvh lg:flex">
      <Sidebar
        items={items}
        base={base}
        tenantName={tenant.name}
        nicheName={niche.name[locale]}
        logoutLabel={t.common.logout}
        moreLabel={t.nav.more}
        footer={<LocaleSwitcher locale={locale} />}
      />
      <div className="min-w-0 flex-1">
        {tenant.plan === "trial" && (trialExpired || trialDaysLeft <= 5) && (
          <div className="no-print border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
            {trialExpired ? t.dashboard.trialExpired : fill(t.dashboard.trialEnds, { date: formatDate(tenant.trial_ends_at, locale) })}
          </div>
        )}
        <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-28 sm:px-6 lg:px-8 lg:pt-8 lg:pb-12">
          {suspended ? (
            <div className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-fg-muted">{t.dashboard.trialExpired}</div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
