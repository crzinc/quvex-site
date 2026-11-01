"use client";

import { useRef, useState, useTransition } from "react";
import { Check, Search } from "lucide-react";
import { ActionForm, Spinner, SubmitButton } from "@/components/ui/forms";
import { Card, Field, Input, Select, Textarea } from "@/components/ui";
import { AssetFields } from "./AssetFields";
import { cn } from "@/lib/utils";
import type { ActionState } from "@/lib/types";
import type { ClientPick } from "@/lib/actions/crm";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import type { FieldDef } from "@/niches/types";

export function NewOrderForm({
  action,
  search,
  t,
  locale,
  staff,
  initialClient,
  assetLabel,
  staffLabel,
  assetConfig,
  orderFields,
}: {
  action: (s: ActionState, f: FormData) => Promise<ActionState>;
  /** Server search by name, phone or plate. */
  search: (q: string) => Promise<ClientPick[]>;
  t: Dictionary;
  locale: Locale;
  staff: { id: string; name: string }[];
  initialClient?: ClientPick;
  assetLabel: string;
  staffLabel: string;
  assetConfig: { identifierLabel: string; identifierPlaceholder: string; fields: FieldDef[] };
  orderFields: FieldDef[];
}) {
  const [selected, setSelected] = useState<ClientPick | null>(initialClient ?? null);
  const [assetId, setAssetId] = useState(initialClient?.assets[0]?.id ?? "");
  const [q, setQ] = useState("");
  const [matches, setMatches] = useState<ClientPick[]>([]);
  const [searching, startSearch] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const latest = useRef("");
  const clientAssets = selected?.assets ?? [];

  const onQuery = (value: string) => {
    setQ(value);
    latest.current = value;
    clearTimeout(timer.current);
    if (value.trim().length < 2) {
      setMatches([]);
      return;
    }
    // Debounced; results of an outdated query are dropped.
    timer.current = setTimeout(() => {
      startSearch(async () => {
        const found = await search(value);
        if (latest.current === value) setMatches(found);
      });
    }, 250);
  };

  const pick = (c: ClientPick | null) => {
    setSelected(c);
    setAssetId(c?.assets[0]?.id ?? "");
    setQ("");
    setMatches([]);
    latest.current = "";
  };

  return (
    <ActionForm action={action} resetOnSuccess={false} className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="grid gap-6">
        {/* Client */}
        <Card className="p-4 sm:p-5">
          <h2 className="mb-4 text-sm font-semibold">{t.orders.client}</h2>
          <input type="hidden" name="client_id" value={selected?.id ?? ""} />
          {selected ? (
            <div className="flex items-center justify-between rounded-lg border border-accent bg-accent-soft px-4 py-3">
              <div>
                <div className="font-medium">{selected.name}</div>
                <div className="text-sm text-fg-muted">{selected.phone}</div>
              </div>
              <button type="button" className="text-sm text-fg-muted hover:text-fg" onClick={() => pick(null)}>
                {t.common.edit}
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-subtle" />
                <Input value={q} onChange={(e) => onQuery(e.target.value)} placeholder={t.clients.searchPlaceholder} className="pl-9 pr-9" autoFocus />
                {searching && <Spinner className="absolute top-1/2 right-3 -translate-y-1/2 text-fg-subtle" />}
                {matches.length > 0 && (
                  <ul className="absolute inset-x-0 top-11 z-10 overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
                    {matches.map((c) => (
                      <li key={c.id}>
                        <button type="button" onClick={() => pick(c)} className="flex w-full justify-between gap-3 px-4 py-2.5 text-left text-sm hover:bg-surface-2">
                          <span className="min-w-0 truncate">
                            <span className="font-medium">{c.name}</span>
                            {c.assets.length > 0 && (
                              <span className="ml-2 text-xs text-fg-muted">{c.assets.map((a) => a.identifier ?? a.title).join(", ")}</span>
                            )}
                          </span>
                          <span className="shrink-0 text-fg-muted">{c.phone}</span>
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
