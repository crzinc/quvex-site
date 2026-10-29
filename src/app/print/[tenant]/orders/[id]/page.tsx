import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireTenant } from "@/lib/auth";
import { term } from "@/niches";
import { PrintButton } from "@/components/ui/forms";
import { AutoPrint } from "@/components/app/AutoPrint";
import { QuvexMark } from "@/components/brand/QuvexMark";
import { formatDate, money } from "@/lib/utils";
import type { Asset, Client, Order, OrderItem, Staff } from "@/lib/types";

export const metadata: Metadata = { robots: { index: false } };

/** A4 work order: always light, no app chrome, opens the print dialog automatically. */
export default async function PrintOrderPage({ params }: PageProps<"/print/[tenant]/orders/[id]">) {
  const { tenant: slug, id } = await params;
  const { supabase, tenant, niche, locale, t } = await requireTenant(slug);

  const { data: order } = await supabase
    .from("orders")
    .select("*, clients(*), assets(*), staff(*)")
    .eq("tenant_id", tenant.id)
    .eq("id", id)
    .maybeSingle<Order & { clients: Client | null; assets: Asset | null; staff: Staff | null }>();
  if (!order) notFound();

  const { data: items } = await supabase.from("order_items").select("*").eq("order_id", id).order("created_at").returns<OrderItem[]>();
  const services = (items ?? []).filter((i) => i.kind === "service");
  const parts = (items ?? []).filter((i) => i.kind === "part");
  const asset = order.assets;
  const debt = Number(order.total) - Number(order.paid);
  const note = typeof tenant.settings?.print_note === "string" ? tenant.settings.print_note : "";
  const p = t.print;

  const section = (title: string, rows: OrderItem[]) =>
    rows.length > 0 && (
      <table className="mt-5 w-full border-collapse text-[12px]">
        <thead>
          <tr className="border-b-2 border-black text-left">
            <th className="w-8 py-1.5 font-semibold">№</th>
            <th className="py-1.5 font-semibold">{title}</th>
            <th className="w-16 py-1.5 text-right font-semibold">{p.qty}</th>
            <th className="w-24 py-1.5 text-right font-semibold">{p.price}</th>
            <th className="w-24 py-1.5 text-right font-semibold">{p.sum}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id} className="border-b border-stone-300">
              <td className="py-1.5 text-stone-500">{i + 1}</td>
              <td className="py-1.5">{r.name}</td>
              <td className="py-1.5 text-right tabular-nums">{Number(r.qty)}</td>
              <td className="py-1.5 text-right tabular-nums">{money(r.price)}</td>
              <td className="py-1.5 text-right tabular-nums">{money(Number(r.qty) * Number(r.price))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );

  return (
    <div className="min-h-dvh bg-stone-200 py-8 print:bg-white print:py-0">
      <AutoPrint />
      <div className="no-print mx-auto mb-4 flex max-w-[210mm] justify-end px-4">
        <PrintButton>{p.printNow}</PrintButton>
      </div>
      <article className="mx-auto min-h-[297mm] w-full max-w-[210mm] bg-white px-[14mm] py-[12mm] text-black shadow-lg print:shadow-none">
        <header className="flex items-start justify-between gap-6 border-b-2 border-black pb-4">
          <div>
            <div className="text-xl font-bold">{tenant.name}</div>
            <div className="mt-1 text-[12px] leading-relaxed text-stone-600">
              {[tenant.address, tenant.city].filter(Boolean).join(", ")}
              {tenant.phone && <div>{tenant.phone}</div>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold">
              {term(niche, "order", locale)} №{order.number}
            </div>
            <div className="mt-1 text-[12px] text-stone-600">
              {p.date}: {formatDate(order.created_at, locale, true)}
            </div>
          </div>
        </header>

        <section className="mt-5 grid grid-cols-2 gap-6 text-[12px]">
          <dl className="grid content-start gap-1">
            <dt className="text-[10px] font-semibold tracking-wide text-stone-500 uppercase">{p.client}</dt>
            <dd className="font-semibold">{order.clients?.name ?? "—"}</dd>
            {order.clients?.phone && <dd>{order.clients.phone}</dd>}
          </dl>
          {asset && (
            <dl className="grid content-start gap-1">
              <dt className="text-[10px] font-semibold tracking-wide text-stone-500 uppercase">{term(niche, "asset", locale)}</dt>
              <dd className="font-semibold">
                {asset.title}
                {asset.identifier && ` · ${asset.identifier}`}
              </dd>
              {[
                ...niche.asset.fields
                  .filter((f) => !["make", "model"].includes(f.key) && asset.attributes?.[f.key])
                  .map((f) => `${f.label[locale]}: ${asset.attributes[f.key]}`),
                ...niche.orderFields
                  .filter((f) => f.type !== "text" && order.attributes?.[f.key])
                  .map((f) => `${f.label[locale]}: ${order.attributes[f.key]}`),
              ].map((line) => (
                <dd key={line}>{line}</dd>
              ))}
            </dl>
          )}
        </section>

        {niche.orderFields
          .filter((f) => f.type === "text" && order.attributes?.[f.key])
          .map((f) => (
            <p key={f.key} className="mt-4 text-[12px]">
              <span className="font-semibold">{f.label[locale]}:</span> {order.attributes[f.key]}
            </p>
          ))}

        {section(term(niche, "service", locale), services)}
        {section(term(niche, "part", locale), parts)}

        <section className="mt-5 ml-auto w-64 text-[12px]">
          {Number(order.discount_percent) > 0 && (
            <>
              <div className="flex justify-between py-0.5">
                <span>{t.orders.subtotal}</span>
                <span className="tabular-nums">{money(order.subtotal)}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span>
                  {t.orders.discount} {Number(order.discount_percent)}%
                </span>
                <span className="tabular-nums">−{money(Number(order.subtotal) - Number(order.total))}</span>
              </div>
            </>
          )}
          <div className="mt-1 flex justify-between border-t-2 border-black pt-1.5 text-[14px] font-bold">
            <span>{t.common.total}</span>
            <span className="tabular-nums">{money(order.total)}</span>
          </div>
          <div className="flex justify-between py-0.5">
            <span>{t.common.paid}</span>
            <span className="tabular-nums">{money(order.paid)}</span>
          </div>
          {debt > 0 && (
            <div className="flex justify-between py-0.5 font-semibold">
              <span>{t.common.debt}</span>
              <span className="tabular-nums">{money(debt)}</span>
            </div>
          )}
        </section>

        {order.staff && (
          <p className="mt-4 text-[12px]">
            <span className="font-semibold">{p.master}:</span> {order.staff.name}
          </p>
        )}
        {note && <p className="mt-4 border-l-2 border-stone-400 pl-3 text-[11px] whitespace-pre-line text-stone-700">{note}</p>}

        <section className="mt-12 grid grid-cols-2 gap-10 text-[11px]">
          <div>
            <div className="h-10 border-b border-black" />
            <div className="mt-1 text-stone-600">{p.masterSignature}</div>
          </div>
          <div>
            <div className="h-10 border-b border-black" />
            <div className="mt-1 text-stone-600">{p.clientSignature}</div>
            <div className="mt-0.5 text-stone-500">{p.accepted}</div>
          </div>
        </section>

        <footer className="mt-10 flex items-center justify-end gap-1.5 text-[9px] text-stone-400">
          <QuvexMark className="h-3 w-auto" /> quvex.org
        </footer>
      </article>
    </div>
  );
}
