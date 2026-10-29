import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { requireTenant } from "@/lib/auth";
import { Badge, Button, Card, EmptyState, PageHeader, Tabs, buttonClass } from "@/components/ui";
import { ReminderForm } from "@/components/app/ReminderForm";
import { createReminder, setReminderStatus } from "@/lib/actions/crm";
import { fill } from "@/i18n/dictionaries";
import { bakuToday, formatDate, whatsappLink } from "@/lib/utils";

type Row = {
  id: string;
  title: string;
  due_at: string;
  status: "pending" | "sent" | "done" | "dismissed";
  clients: { id: string; name: string; phone: string | null } | null;
  assets: { title: string; identifier: string | null } | null;
};

export default async function RemindersPage({ params, searchParams }: PageProps<"/app/[tenant]/reminders">) {
  const { tenant: slug } = await params;
  const tab = (await searchParams).tab === "sent" ? "sent" : (await searchParams).tab === "closed" ? "closed" : "pending";
  const { supabase, tenant, niche, locale, t } = await requireTenant(slug);
  const base = `/app/${slug}`;
  const today = bakuToday();

  const statuses = tab === "pending" ? ["pending"] : tab === "sent" ? ["sent"] : ["done", "dismissed"];
  const [{ data: rows }, { data: clients }] = await Promise.all([
    supabase
      .from("reminders")
      .select("id, title, due_at, status, clients(id, name, phone), assets(title, identifier)")
      .eq("tenant_id", tenant.id)
      .in("status", statuses)
      .order("due_at", { ascending: tab === "pending" })
      .limit(200)
      .returns<Row[]>(),
    supabase.from("clients").select("id, name").eq("tenant_id", tenant.id).order("name").limit(2000),
  ]);

  return (
    <>
      <PageHeader title={t.reminders.title} description={t.reminders.hint} />
      <Tabs
        items={[
          { href: `${base}/reminders`, label: t.reminders.statuses.pending, active: tab === "pending" },
          { href: `${base}/reminders?tab=sent`, label: t.reminders.statuses.sent, active: tab === "sent" },
          { href: `${base}/reminders?tab=closed`, label: t.reminders.statuses.done, active: tab === "closed" },
        ]}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card className="self-start">
          {rows?.length ? (
            <ul className="divide-y divide-border">
              {rows.map((r) => {
                const overdue = r.status === "pending" && r.due_at < today;
                const isToday = r.due_at === today;
                const wa = whatsappLink(
                  r.clients?.phone,
                  fill(t.reminders.waText, {
                    name: r.clients?.name ?? "",
                    business: tenant.name,
                    title: r.title.toLowerCase(),
                    asset: r.assets ? ` (${r.assets.title}${r.assets.identifier ? `, ${r.assets.identifier}` : ""})` : "",
                    phone: tenant.phone ?? "",
                  }),
                );
                return (
                  <li key={r.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:px-5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">{r.title}</span>
                        {overdue && <Badge tone="red">{t.reminders.overdue}</Badge>}
                        {isToday && r.status === "pending" && <Badge tone="orange">{t.common.today}</Badge>}
                      </div>
                      <div className="truncate text-xs text-fg-muted">
                        {r.clients ? (
                          <Link href={`${base}/clients/${r.clients.id}`} className="hover:underline">{r.clients.name}</Link>
                        ) : "—"}
                        {r.assets && ` · ${r.assets.title}${r.assets.identifier ? ` ${r.assets.identifier}` : ""}`} · {formatDate(r.due_at, locale)}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {wa && r.status === "pending" && (
                        <a href={wa} target="_blank" rel="noreferrer" className={buttonClass("secondary", "sm")}>
                          <MessageCircle className="size-4 text-[#25D366]" /> {t.common.whatsapp}
                        </a>
                      )}
                      {r.status === "pending" && (
                        <form action={setReminderStatus.bind(null, slug, r.id, "sent")}>
                          <Button type="submit" size="sm" variant="secondary">{t.reminders.markSent}</Button>
                        </form>
                      )}
                      {(r.status === "pending" || r.status === "sent") && (
                        <>
                          <form action={setReminderStatus.bind(null, slug, r.id, "done")}>
                            <Button type="submit" size="sm" variant="secondary">{t.reminders.markDone}</Button>
                          </form>
                          <form action={setReminderStatus.bind(null, slug, r.id, "dismissed")}>
                            <Button type="submit" size="sm" variant="ghost">{t.reminders.dismiss}</Button>
                          </form>
                        </>
                      )}
                      {tab === "closed" && <Badge>{t.reminders.statuses[r.status]}</Badge>}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState>{t.reminders.nothing}</EmptyState>
          )}
        </Card>
        <Card className="self-start p-4 sm:p-5">
          <h2 className="mb-3 text-sm font-semibold">{t.reminders.newReminder}</h2>
          <ReminderForm
            action={createReminder.bind(null, slug)}
            t={t}
            presets={niche.reminderPresets.map((p) => ({ id: p.id, title: p.title[locale], months: p.months }))}
            clients={clients ?? []}
          />
        </Card>
      </div>
    </>
  );
}
