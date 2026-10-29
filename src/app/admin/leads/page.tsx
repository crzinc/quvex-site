import { MessageCircle } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { Card, EmptyState, PageHeader, Tabs, buttonClass } from "@/components/ui";
import { AutoSubmitSelect } from "@/components/ui/forms";
import { setLeadStatus } from "@/lib/actions/admin";
import { getNiche } from "@/niches";
import { formatDate, whatsappLink } from "@/lib/utils";
import type { Lead } from "@/lib/types";

const STATUSES = ["new", "contacted", "won", "lost"] as const;

export default async function AdminLeads({ searchParams }: PageProps<"/admin/leads">) {
  const { supabase, locale, t } = await requireAdmin();
  const raw = (await searchParams).status;
  const status = STATUSES.includes(raw as Lead["status"]) ? (raw as Lead["status"]) : null;

  let query = supabase.from("leads").select("*").order("created_at", { ascending: false }).limit(300);
  if (status) query = query.eq("status", status);
  const { data: leads } = await query.returns<Lead[]>();

  return (
    <>
      <PageHeader title={t.admin.leads} />
      <Tabs
        items={[
          { href: "/admin/leads", label: t.common.all, active: !status },
          ...STATUSES.map((s) => ({ href: `/admin/leads?status=${s}`, label: t.admin.leadStatuses[s], active: status === s })),
        ]}
      />
      <Card>
        {leads?.length ? (
          <ul className="divide-y divide-border">
            {leads.map((l) => {
              const wa = whatsappLink(l.phone, locale === "az" ? `Salam, ${l.name}! Quvex-dən yazırıq.` : `Здравствуйте, ${l.name}! Пишем из Quvex.`);
              return (
                <li key={l.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:px-5">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {l.name}
                      {l.business_name && <span className="text-fg-muted"> · {l.business_name}</span>}
                    </div>
                    <div className="text-xs text-fg-muted">
                      <a href={`tel:${l.phone}`} className="hover:underline">{l.phone}</a> · {l.niche ? getNiche(l.niche).name[locale] : "—"} · {formatDate(l.created_at, locale, true)}
                    </div>
                    {l.message && <p className="mt-1 text-sm text-fg-muted">{l.message}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {wa && (
                      <a href={wa} target="_blank" rel="noreferrer" className={buttonClass("secondary", "sm")}>
                        <MessageCircle className="size-4 text-[#25D366]" />
                      </a>
                    )}
                    <form action={setLeadStatus.bind(null, l.id)}>
                      <AutoSubmitSelect name="status" defaultValue={l.status}>
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{t.admin.leadStatuses[s]}</option>
                        ))}
                      </AutoSubmitSelect>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState>{t.common.empty}</EmptyState>
        )}
      </Card>
    </>
  );
}
