import Link from "next/link";
import { StatusBadge } from "./StatusBadge";
import { formatDate, money } from "@/lib/utils";
import type { NicheConfig } from "@/niches";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

export interface OrderRow {
  id: string;
  number: number;
  status: string;
  total: number;
  paid: number;
  created_at: string;
  clients: { name: string } | null;
  assets: { title: string; identifier: string | null } | null;
  staff: { name: string } | null;
}

export const ORDER_LIST_SELECT = "id, number, status, total, paid, created_at, clients(name), assets(title, identifier), staff(name)";

export function OrderList({
  orders,
  base,
  niche,
  locale,
  t,
}: {
  orders: OrderRow[];
  base: string;
  niche: NicheConfig;
  locale: Locale;
  t: Dictionary;
}) {
  return (
    <ul className="divide-y divide-border">
      {orders.map((o) => {
        const debt = Number(o.total) - Number(o.paid);
        return (
          <li key={o.id}>
            <Link href={`${base}/orders/${o.id}`} className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-surface-2/60 sm:px-5">
              <span className="w-12 shrink-0 text-sm text-fg-subtle tabular-nums">#{o.number}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {o.assets ? `${o.assets.title}${o.assets.identifier ? ` · ${o.assets.identifier}` : ""}` : (o.clients?.name ?? "—")}
                </span>
                <span className="block truncate text-xs text-fg-muted">
                  {[o.assets ? o.clients?.name : null, o.staff?.name, formatDate(o.created_at, locale)].filter(Boolean).join(" · ")}
                </span>
              </span>
              <span className="hidden sm:block">
                <StatusBadge niche={niche} status={o.status} locale={locale} />
              </span>
              <span className="w-24 shrink-0 text-right">
                <span className="block text-sm font-medium tabular-nums">{money(o.total)}</span>
                {debt > 0 ? (
                  <span className="block text-xs text-red-600 tabular-nums">{t.common.debt} {money(debt)}</span>
                ) : (
                  <span className="block sm:hidden">
                    <StatusBadge niche={niche} status={o.status} locale={locale} />
                  </span>
                )}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
