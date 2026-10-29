import { requireAdmin } from "@/lib/auth";
import { NICHES } from "@/niches";
import { Badge, Card, PageHeader } from "@/components/ui";

export default async function AdminNiches() {
  const { supabase, locale, t } = await requireAdmin();
  const { data } = await supabase.from("tenants").select("niche");
  const counts = new Map<string, number>();
  for (const row of data ?? []) counts.set(row.niche, (counts.get(row.niche) ?? 0) + 1);

  return (
    <>
      <PageHeader title={t.admin.niches} description={t.admin.nichesHint} />
      <div className="grid gap-4 md:grid-cols-2">
        {NICHES.map((n) => (
          <Card key={n.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">{n.name[locale]}</div>
                <div className="text-sm text-fg-muted">{n.tagline[locale]}</div>
              </div>
              <Badge tone={n.enabled ? "green" : "slate"}>{counts.get(n.id) ?? 0} {t.admin.tenantsInNiche}</Badge>
            </div>
            <dl className="mt-4 grid gap-3 text-sm">
              <div>
                <dt className="text-xs text-fg-muted">id</dt>
                <dd className="font-mono text-xs">{n.id}</dd>
              </div>
              <div>
                <dt className="text-xs text-fg-muted">{t.settings.modules}</dt>
                <dd className="mt-1 flex flex-wrap gap-1">{n.modules.map((m) => <Badge key={m}>{t.settings.moduleNames[m]}</Badge>)}</dd>
              </div>
              <div>
                <dt className="text-xs text-fg-muted">{t.common.status}</dt>
                <dd className="mt-1 flex flex-wrap gap-1">{n.statuses.map((s) => <Badge key={s.id} tone={s.tone}>{s.label[locale]}</Badge>)}</dd>
              </div>
              <div className="flex gap-6">
                <div><dt className="text-xs text-fg-muted">{t.catalog.services}</dt><dd>{n.catalog.length}</dd></div>
                <div><dt className="text-xs text-fg-muted">{t.reminders.title}</dt><dd>{n.reminderPresets.length}</dd></div>
                <div><dt className="text-xs text-fg-muted">{n.terms.asset[locale]}</dt><dd>{n.asset.fields.length + 1} fields</dd></div>
              </div>
            </dl>
          </Card>
        ))}
      </div>
    </>
  );
}
