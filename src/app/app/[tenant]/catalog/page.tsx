import { Plus } from "lucide-react";
import { requireTenant } from "@/lib/auth";
import { hasModule } from "@/niches";
import { Badge, Card, EmptyState, Input, PageHeader, Tabs } from "@/components/ui";
import { ActionForm, ConfirmForm, SubmitButton } from "@/components/ui/forms";
import { CatalogItemFields } from "@/components/app/CatalogItemFields";
import { deleteCatalogItem, restockItem, saveCatalogItem } from "@/lib/actions/crm";
import { money } from "@/lib/utils";
import type { CatalogItem } from "@/lib/types";

const LOW_STOCK = 3;

export default async function CatalogPage({ params, searchParams }: PageProps<"/app/[tenant]/catalog">) {
  const { tenant: slug } = await params;
  const { supabase, tenant, t, can } = await requireTenant(slug);
  const inventory = hasModule(tenant.modules, "inventory");
  const kind = (await searchParams).tab === "part" && inventory ? "part" : "service";
  const base = `/app/${slug}/catalog`;

  const { data: items } = await supabase
    .from("catalog_items")
    .select("*")
    .eq("tenant_id", tenant.id)
    .eq("kind", kind)
    .order("category", { nullsFirst: false })
    .order("name")
    .returns<CatalogItem[]>();

  const groups = new Map<string, CatalogItem[]>();
  for (const item of items ?? []) {
    const key = item.category ?? "—";
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }

  return (
    <>
      <PageHeader title={inventory ? t.nav.catalog : t.catalog.services} />
      {inventory && (
        <Tabs
          items={[
            { href: base, label: t.catalog.services, active: kind === "service" },
            { href: `${base}?tab=part`, label: t.catalog.parts, active: kind === "part" },
          ]}
        />
      )}

      {can.managePrices && (
        <Card className="mb-6">
          <details>
            <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-medium sm:px-5">
              <Plus className="size-4 text-accent" />
              {kind === "part" ? t.catalog.newPart : t.catalog.newService}
            </summary>
            <ActionForm action={saveCatalogItem.bind(null, slug, null)} className="grid gap-4 border-t border-border p-4 sm:p-5">
              <CatalogItemFields t={t} kind={kind} />
              <div>
                <SubmitButton>{t.common.create}</SubmitButton>
              </div>
            </ActionForm>
          </details>
        </Card>
      )}

      {groups.size === 0 && (
        <Card>
          <EmptyState>{t.common.empty}</EmptyState>
        </Card>
      )}

      <div className="grid gap-6">
        {[...groups.entries()].map(([category, list]) => (
          <Card key={category}>
            <div className="border-b border-border px-4 py-2.5 text-xs font-medium text-fg-muted sm:px-5">{category}</div>
            <ul className="divide-y divide-border">
              {list.map((item) => {
                const low = item.kind === "part" && item.stock !== null && Number(item.stock) <= LOW_STOCK;
                const summary = (
                  <>
                    <span className="min-w-0 flex-1">
                      <span className={item.active ? "text-sm font-medium" : "text-sm font-medium text-fg-subtle line-through"}>{item.name}</span>
                      {item.kind === "service" && item.duration_min ? (
                        <span className="ml-2 text-xs text-fg-subtle">{item.duration_min}′</span>
                      ) : null}
                    </span>
                    {item.kind === "part" && item.stock !== null && (
                      <Badge tone={low ? "red" : "slate"} className="tabular-nums">
                        {low && `${t.catalog.lowStock} · `}
                        {Number(item.stock)}
                      </Badge>
                    )}
                    <span className="w-20 text-right text-sm font-medium tabular-nums">{money(item.price)}</span>
                  </>
                );
                if (!can.managePrices) {
                  return (
                    <li key={item.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                      {summary}
                    </li>
                  );
                }
                return (
                  <li key={item.id}>
                    <details className="group">
                      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 hover:bg-surface-2/60 sm:px-5">
                        {summary}
                      </summary>
                      <div className="grid gap-4 border-t border-border bg-surface-2/40 p-4 sm:p-5">
                        {item.kind === "part" && (
                          <ActionForm action={restockItem.bind(null, slug, item.id)} className="flex items-end gap-2">
                            <Input name="qty" type="number" step="0.01" min="0.01" placeholder="+" className="w-28" required />
                            <SubmitButton variant="secondary">{t.catalog.addStock}</SubmitButton>
                          </ActionForm>
                        )}
                        <ActionForm action={saveCatalogItem.bind(null, slug, item.id)} resetOnSuccess={false} successMessage={t.settings.saved} className="grid gap-4">
                          <CatalogItemFields t={t} kind={item.kind} item={item} />
                          <label className="flex items-center gap-2 text-sm">
                            <input type="hidden" name="active" value="off" />
                            <input type="checkbox" name="active" value="on" defaultChecked={item.active} className="size-4 accent-[var(--accent)]" />
                            {t.common.active}
                          </label>
                          <div className="flex gap-2">
                            <SubmitButton variant="secondary">{t.common.save}</SubmitButton>
                          </div>
                        </ActionForm>
                        <ConfirmForm action={deleteCatalogItem.bind(null, slug, item.id)} message={t.common.confirmDelete}>
                          <button type="submit" className="text-sm text-red-600 hover:underline">{t.common.delete}</button>
                        </ConfirmForm>
                      </div>
                    </details>
                  </li>
                );
              })}
            </ul>
          </Card>
        ))}
      </div>
    </>
  );
}
