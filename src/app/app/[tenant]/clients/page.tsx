import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { requireTenant } from "@/lib/auth";
import { ButtonLink, Card, EmptyState, Input, PageHeader } from "@/components/ui";
import { findAssetAndClientIds } from "@/lib/search";
import { formatDate } from "@/lib/utils";

export default async function ClientsPage({ params, searchParams }: PageProps<"/app/[tenant]/clients">) {
  const { tenant: slug } = await params;
  const { q: rawQ } = await searchParams;
  const q = typeof rawQ === "string" ? rawQ.trim() : "";
  const { supabase, tenant, locale, t } = await requireTenant(slug);
  const base = `/app/${slug}`;

  let query = supabase
    .from("clients")
    .select("id, name, phone, created_at, assets(title, identifier)")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false })
    .limit(200);
  if (q) {
    const { clientIds } = await findAssetAndClientIds(supabase, tenant.id, q);
    query = query.in("id", clientIds.length ? clientIds : ["00000000-0000-0000-0000-000000000000"]);
  }
  const { data: clients } = await query;

  return (
    <>
      <PageHeader
        title={t.nav.clients}
        actions={
          <ButtonLink href={`${base}/clients/new`} variant="accent">
            <Plus className="size-4" /> {t.clients.newClient}
          </ButtonLink>
        }
      />
      <form className="relative mb-4 sm:max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-subtle" />
        <Input name="q" defaultValue={q} placeholder={t.clients.searchPlaceholder} className="pl-9" />
      </form>
      <Card>
        {clients?.length ? (
          <ul className="divide-y divide-border">
            {clients.map((c) => (
              <li key={c.id}>
                <Link href={`${base}/clients/${c.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-surface-2/60 sm:px-5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-2 text-sm font-medium">
                    {c.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{c.name}</span>
                    <span className="block truncate text-xs text-fg-muted">
                      {[c.phone, ...(c.assets ?? []).map((a) => [a.title, a.identifier].filter(Boolean).join(" "))].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  <span className="hidden text-xs text-fg-subtle sm:block">{formatDate(c.created_at, locale)}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState action={<ButtonLink href={`${base}/clients/new`} size="sm"><Plus className="size-4" /> {t.clients.newClient}</ButtonLink>}>
            {t.common.empty}
          </EmptyState>
        )}
      </Card>
    </>
  );
}
