"use client";

import { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { ActionForm, SubmitButton } from "@/components/ui/forms";
import { Card, Field, Input, Select, Textarea } from "@/components/ui";
import { AssetFields } from "./AssetFields";
import { cn } from "@/lib/utils";
import type { ActionState } from "@/lib/types";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import type { FieldDef } from "@/niches/types";

interface ClientOption { id: string; name: string; phone: string | null }
interface AssetOption { id: string; client_id: string | null; title: string; identifier: string | null }

export function NewOrderForm({
  action,
  t,
  locale,
  clients,
  assets,
  staff,
  initialClientId,
  assetLabel,
  staffLabel,
  assetConfig,
  orderFields,
}: {
  action: (s: ActionState, f: FormData) => Promise<ActionState>;
  t: Dictionary;
  locale: Locale;
  clients: ClientOption[];
  assets: AssetOption[];
  staff: { id: string; name: string }[];
  initialClientId?: string;
  assetLabel: string;
  staffLabel: string;
  assetConfig: { identifierLabel: string; identifierPlaceholder: string; fields: FieldDef[] };
  orderFields: FieldDef[];
}) {
  const [clientId, setClientId] = useState(initialClientId ?? "");
  const [q, setQ] = useState("");
  const clientAssets = assets.filter((a) => a.client_id === clientId);
  const [assetId, setAssetId] = useState(clientAssets[0]?.id ?? "");
  const selected = clients.find((c) => c.id === clientId);

  const matches = useMemo(() => {
    const term = q.trim().toLowerCase().replace(/[\s-]/g, "");
    if (!term) return [];
    const byAsset = new Set(assets.filter((a) => a.identifier?.toLowerCase().replace(/[\s-]/g, "").includes(term)).map((a) => a.client_id));
    return clients
      .filter((c) => c.name.toLowerCase().includes(q.trim().toLowerCase()) || c.phone?.replace(/\D/g, "").includes(term) || byAsset.has(c.id))
      .slice(0, 6);
  }, [q, clients, assets]);

  const pick = (id: string) => {
    setClientId(id);
    setAssetId(assets.find((a) => a.client_id === id)?.id ?? "");
    setQ("");
  };

  return (
    <ActionForm action={action} resetOnSuccess={false} className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="grid gap-6">
        {/* Client */}
        <Card className="p-4 sm:p-5">
          <h2 className="mb-4 text-sm font-semibold">{t.orders.client}</h2>
          <input type="hidden" name="client_id" value={clientId} />
          {selected ? (
            <div className="flex items-center justify-between rounded-lg border border-accent bg-accent-soft px-4 py-3">
              <div>
                <div className="font-medium">{selected.name}</div>
                <div className="text-sm text-fg-muted">{selected.phone}</div>
              </div>
              <button type="button" className="text-sm text-fg-muted hover:text-fg" onClick={() => pick("")}>
                {t.common.edit}
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-subtle" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.clients.searchPlaceholder} className="pl-9" autoFocus />
                {matches.length > 0 && (
                  <ul className="absolute inset-x-0 top-11 z-10 overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
                    {matches.map((c) => (
                      <li key={c.id}>
                        <button type="button" onClick={() => pick(c.id)} className="flex w-full justify-between px-4 py-2.5 text-left text-sm hover:bg-surface-2">
                          <span className="font-medium">{c.name}</span>
                          <span className="text-fg-muted">{c.phone}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="text-xs font-medium tracking-wide text-fg-subtle uppercase">{t.orders.orNewClient}</div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t.orders.newClientName}>
                  <Input name="new_client_name" />
                </Field>
                <Field label={t.orders.newClientPhone}>
                  <Input name="new_client_phone" type="tel" placeholder="+994" />
                </Field>
              </div>
            </div>
          )}
        </Card>

        {/* Asset */}
        <Card className="p-4 sm:p-5">
          <h2 className="mb-4 text-sm font-semibold">{assetLabel}</h2>
          <input type="hidden" name="asset_id" value={assetId} />
          {clientAssets.length > 0 && (
            <div className="mb-4 grid gap-2 sm:grid-cols-2">
              {clientAssets.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAssetId(a.id)}
                  className={cn(
                    "flex items-center justify-between rounded-lg border px-4 py-3 text-left text-sm",
                    assetId === a.id ? "border-accent bg-accent-soft" : "border-border hover:border-border-strong",
                  )}
                >
                  <span>
                    <span className="block font-medium">{a.title}</span>
                    <span className="block text-fg-muted">{a.identifier}</span>
                  </span>
                  {assetId === a.id && <Check className="size-4 text-accent" />}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAssetId("")}
                className={cn("rounded-lg border border-dashed px-4 py-3 text-sm", assetId === "" ? "border-accent text-fg" : "border-border text-fg-muted")}
              >
                + {t.orders.newAsset}
              </button>
            </div>
          )}
          {assetId === "" && <AssetFields locale={locale} {...assetConfig} />}
        </Card>

        {orderFields.length > 0 && (
          <Card className="grid gap-4 p-4 sm:p-5">
            <h2 className="text-sm font-semibold">{t.orders.details}</h2>
            {orderFields.map((f) =>
              f.type === "text" ? (
                <Field key={f.key} label={f.label[locale]}>
                  <Textarea name={`order.${f.key}`} rows={2} />
                </Field>
              ) : (
                <Field key={f.key} label={f.label[locale]}>
                  <Input name={`order.${f.key}`} type="number" min={0} />
                </Field>
              ),
            )}
          </Card>
        )}
      </div>

      <div className="grid content-start gap-6">
        <Card className="grid gap-4 p-4 sm:p-5">
          <Field label={staffLabel}>
            <Select name="staff_id" defaultValue="">
              <option value="">{t.orders.noMaster}</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
          </Field>
          <Field label={t.orders.scheduled} hint={t.common.optional}>
            <Input name="scheduled_at" type="datetime-local" />
          </Field>
          <Field label={t.common.notes}>
            <Textarea name="notes" rows={3} />
          </Field>
          <SubmitButton variant="accent" size="lg" pendingLabel={t.common.saving}>{t.common.create}</SubmitButton>
        </Card>
      </div>
    </ActionForm>
  );
}
