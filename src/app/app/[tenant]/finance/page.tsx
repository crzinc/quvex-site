import Link from "next/link";
import { X } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { Card, CardHeader, EmptyState, Field, Input, PageHeader, Select, Stat, Tabs } from "@/components/ui";
import { ActionForm, ConfirmForm, SubmitButton } from "@/components/ui/forms";
import { addPayment, deletePayment } from "@/lib/actions/crm";
import { cn, formatDate, money, startOfMonth } from "@/lib/utils";
import type { Payment } from "@/lib/types";

const METHODS = ["cash", "card", "transfer"] as const;

export default async function FinancePage({ params, searchParams }: PageProps<"/app/[tenant]/finance">) {
  const { tenant: slug } = await params;
  const period = (await searchParams).period === "last" ? "last" : "this";
  const { supabase, tenant, locale, t } = await requirePermission(slug, "viewFinance");
  const base = `/app/${slug}`;
  const from = startOfMonth(period === "last" ? -1 : 0);
  const to = startOfMonth(period === "last" ? 0 : 1);

  const [payments, debtors] = await Promise.all([
    supabase
      .from("payments")
      .select("*, orders(number)")
      .eq("tenant_id", tenant.id)
      .gte("created_at", from.toISOString())
      .lt("created_at", to.toISOString())
      .order("created_at", { ascending: false })
      .returns<(Payment & { orders: { number: number } | null })[]>(),
    supabase
      .from("orders")
      .select("id, number, debt, clients(name, phone)")
      .eq("tenant_id", tenant.id)
      .neq("status", "cancelled")
      .gt("debt", 0)
      .order("debt", { ascending: false })
      .limit(20),
  ]);

  const list = payments.data ?? [];
  const income = list.filter((p) => p.direction === "in").reduce((s, p) => s + Number(p.amount), 0);
  const expense = list.filter((p) => p.direction === "out").reduce((s, p) => s + Number(p.amount), 0);
  const byMethod = METHODS.map((m) => ({
    m,
    sum: list.filter((p) => p.direction === "in" && p.method === m).reduce((s, p) => s + Number(p.amount), 0),
  }));

  const cashForm = (direction: "in" | "out") => (
    <ActionForm action={addPayment.bind(null, slug, null)} className="grid gap-3">
      <input type="hidden" name="direction" value={direction} />
      <div className="grid grid-cols-2 gap-3">
        <Field label={t.common.amount}>
          <Input name="amount" type="number" step="0.01" min="0.01" required />
        </Field>
        <Field label={t.orders.method}>
          <Select name="method" defaultValue="cash">
            {METHODS.map((m) => (
              <option key={m} value={m}>{t.orders.methods[m]}</option>
            ))}
          </Select>
        </Field>
      </div>
      {direction === "out" && (
        <Field label={t.common.category}>
          <Select name="category" defaultValue="other">
            {Object.entries(t.finance.expenseCategories).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
        </Field>
      )}
      <Field label={t.common.notes}>
        <Input name="note" />
      </Field>
      <SubmitButton variant={direction === "out" ? "secondary" : "primary"}>
        {direction === "out" ? t.finance.addExpense : t.finance.addIncome}
      </SubmitButton>
    </ActionForm>
  );

  return (
    <>
      <PageHeader title={t.finance.title} />
      <Tabs
        items={[
          { href: `${base}/finance`, label: t.finance.thisMonth, active: period === "this" },
          { href: `${base}/finance?period=last`, label: t.finance.lastMonth, active: period === "last" },
        ]}
      />
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label={t.finance.income} value={money(income)} hint={byMethod.map((b) => `${t.orders.methods[b.m]} ${money(b.sum)}`).join(" · ")} />
        <Stat label={t.finance.expense} value={money(expense)} />
        <Stat label={t.finance.profit} value={<span className={income - expense < 0 ? "text-red-600" : undefined}>{money(income - expense)}</span>} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card className="self-start">
          <CardHeader title={t.finance.transactions} />
          {list.length ? (
            <ul className="divide-y divide-border">
              {list.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-4 py-3 text-sm sm:px-5">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">
                      {p.orders ? (
                        <Link href={`${base}/orders/${p.order_id}`} className="font-medium hover:underline">#{p.orders.number}</Link>
                      ) : (
                        <span className="font-medium">
                          {p.direction === "out" ? (t.finance.expenseCategories[p.category as keyof typeof t.finance.expenseCategories] ?? t.finance.expense) : t.finance.income}
                        </span>
                      )}
                      {p.note && <span className="text-fg-muted"> · {p.note}</span>}
                    </span>
                    <span className="text-xs text-fg-muted">{t.orders.methods[p.method]} · {formatDate(p.created_at, locale, true)}</span>
                  </span>
                  <span className={cn("font-medium tabular-nums", p.direction === "out" ? "text-red-600" : "text-emerald-600")}>
                    {p.direction === "out" ? "−" : "+"}{money(p.amount)}
                  </span>
                  {!p.order_id && (
                    <ConfirmForm action={deletePayment.bind(null, slug, p.id)} message={t.common.confirmDelete}>
                      <button type="submit" className="rounded-md p-1.5 text-fg-subtle hover:bg-surface-2 hover:text-red-600" aria-label={t.common.delete}>
                        <X className="size-4" />
                      </button>
                    </ConfirmForm>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState>{t.common.empty}</EmptyState>
          )}
        </Card>

        <div className="grid content-start gap-6">
          <Card className="p-4 sm:p-5">{cashForm("out")}</Card>
          <Card className="p-4 sm:p-5">{cashForm("in")}</Card>
          <Card>
            <CardHeader title={t.finance.debtors} />
            {debtors.data?.length ? (
              <ul className="divide-y divide-border">
                {debtors.data.map((o) => {
                  const c = o.clients as unknown as { name: string } | null;
                  return (
                    <li key={o.id}>
                      <Link href={`${base}/orders/${o.id}`} className="flex justify-between gap-3 px-4 py-3 text-sm hover:bg-surface-2/60 sm:px-5">
                        <span className="truncate">#{o.number} · {c?.name ?? "—"}</span>
                        <span className="font-medium text-red-600 tabular-nums">{money(o.debt)}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState>{t.finance.noDebtors}</EmptyState>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
