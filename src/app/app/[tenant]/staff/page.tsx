import { Plus } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { term } from "@/niches";
import { Badge, Card, EmptyState, Field, Input, PageHeader } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/ui/forms";
import { saveStaff } from "@/lib/actions/crm";
import { money, startOfMonth } from "@/lib/utils";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Staff } from "@/lib/types";

function StaffFields({ t, staff }: { t: Dictionary; staff?: Staff }) {
  return (
    <div className="grid gap-3 sm:grid-cols-4">
      <Field label={t.common.name}>
        <Input name="name" required defaultValue={staff?.name} />
      </Field>
      <Field label={t.common.phone}>
        <Input name="phone" type="tel" defaultValue={staff?.phone ?? ""} />
      </Field>
      <Field label={t.staff.position}>
        <Input name="position" defaultValue={staff?.position ?? ""} />
      </Field>
      <Field label={t.staff.commission}>
        <Input name="commission_percent" type="number" step="0.5" min="0" max="100" defaultValue={staff?.commission_percent ?? 0} />
      </Field>
    </div>
  );
}

export default async function StaffPage({ params }: PageProps<"/app/[tenant]/staff">) {
  const { tenant: slug } = await params;
  const { supabase, tenant, niche, locale, t } = await requirePermission(slug, "manageStaff");
  const doneIds = niche.statuses.filter((s) => s.kind === "done").map((s) => s.id);

  const [staff, closed] = await Promise.all([
    supabase.from("staff").select("*").eq("tenant_id", tenant.id).order("active", { ascending: false }).order("name").returns<Staff[]>(),
    supabase
      .from("orders")
      .select("staff_id, discount_percent, order_items(kind, qty, price, staff_id)")
      .eq("tenant_id", tenant.id)
      .in("status", doneIds)
      .gte("closed_at", startOfMonth().toISOString()),
  ]);

  // Payroll: labour (service lines) attributed to the line's master, falling back to the order's master.
  const labour = new Map<string, { sum: number; count: number }>();
  for (const order of closed.data ?? []) {
    const factor = 1 - Number(order.discount_percent ?? 0) / 100;
    for (const item of order.order_items ?? []) {
      const who = item.staff_id ?? order.staff_id;
      if (!who || item.kind !== "service") continue;
      const cur = labour.get(who) ?? { sum: 0, count: 0 };
      labour.set(who, { sum: cur.sum + Number(item.qty) * Number(item.price) * factor, count: cur.count + 1 });
    }
  }

  return (
    <>
      <PageHeader title={term(niche, "staff", locale)} description={t.staff.payrollHint} />
      <Card className="mb-6">
        <details>
          <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-medium sm:px-5">
            <Plus className="size-4 text-accent" /> {t.staff.newStaff}
          </summary>
          <ActionForm action={saveStaff.bind(null, slug, null)} className="grid gap-4 border-t border-border p-4 sm:p-5">
            <StaffFields t={t} />
            <div>
              <SubmitButton>{t.common.create}</SubmitButton>
            </div>
          </ActionForm>
        </details>
      </Card>

      <Card>
        {staff.data?.length ? (
          <ul className="divide-y divide-border">
            {staff.data.map((s) => {
              const l = labour.get(s.id) ?? { sum: 0, count: 0 };
              const earned = (l.sum * Number(s.commission_percent)) / 100;
              return (
                <li key={s.id}>
                  <details>
                    <summary className="flex cursor-pointer list-none items-center gap-4 px-4 py-3 hover:bg-surface-2/60 sm:px-5">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-2 text-sm font-medium">{s.name.slice(0, 1)}</span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2 text-sm font-medium">
                          {s.name} {!s.active && <Badge>{t.common.inactive}</Badge>}
                        </span>
                        <span className="block text-xs text-fg-muted">
                          {[s.position, `${Number(s.commission_percent)}%`, `${t.staff.worksDone}: ${l.count}`].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                      <span className="text-right">
                        <span className="block text-sm font-semibold tabular-nums">{money(earned)}</span>
                        <span className="block text-xs text-fg-subtle">{t.staff.earnings}</span>
                      </span>
                    </summary>
                    <ActionForm
                      action={saveStaff.bind(null, slug, s.id)}
                      resetOnSuccess={false}
                      successMessage={t.settings.saved}
                      className="grid gap-4 border-t border-border bg-surface-2/40 p-4 sm:p-5"
                    >
                      <StaffFields t={t} staff={s} />
                      <label className="flex items-center gap-2 text-sm">
                        <input type="hidden" name="active" value="off" />
                        <input type="checkbox" name="active" value="on" defaultChecked={s.active} className="size-4 accent-[var(--accent)]" />
                        {t.common.active}
                      </label>
                      <div>
                        <SubmitButton variant="secondary">{t.common.save}</SubmitButton>
                      </div>
                    </ActionForm>
                  </details>
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
