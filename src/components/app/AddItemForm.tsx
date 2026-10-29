"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { ActionForm, SubmitButton } from "@/components/ui/forms";
import { Input, Select } from "@/components/ui";
import type { ActionState } from "@/lib/types";
import type { Dictionary } from "@/i18n/dictionaries";

interface CatalogOption { id: string; kind: "service" | "part"; name: string; price: number; stock: number | null }

/** Adds a line to an order: pick from the catalog (price prefilled) or type a custom line. */
export function AddItemForm({
  action,
  t,
  catalog,
  staff,
  defaultStaffId,
  labels,
}: {
  action: (s: ActionState, f: FormData) => Promise<ActionState>;
  t: Dictionary;
  catalog: CatalogOption[];
  staff: { id: string; name: string }[];
  defaultStaffId: string | null;
  labels: { service: string; part: string; staff: string };
}) {
  const [catalogId, setCatalogId] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [kind, setKind] = useState<"service" | "part">("service");
  const item = catalog.find((c) => c.id === catalogId);

  const choose = (id: string) => {
    setCatalogId(id);
    const c = catalog.find((x) => x.id === id);
    if (c) {
      setName(c.name);
      setPrice(String(c.price));
      setKind(c.kind);
    } else {
      setName("");
      setPrice("");
    }
  };

  const reset = () => choose("");

  return (
    <ActionForm action={action} onSuccess={reset} className="grid gap-3">
      <input type="hidden" name="catalog_item_id" value={catalogId} />
      <input type="hidden" name="kind" value={item?.kind ?? kind} />
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <Select value={catalogId} onChange={(e) => choose(e.target.value)} aria-label={t.orders.fromCatalog}>
          <option value="">{t.orders.customItem}…</option>
          {(["service", "part"] as const).map((k) => (
            <optgroup key={k} label={labels[k]}>
              {catalog
                .filter((c) => c.kind === k)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.price} ₼{c.stock !== null ? ` (${c.stock})` : ""}
                  </option>
                ))}
            </optgroup>
          ))}
        </Select>
        {!catalogId && (
          <Select value={kind} onChange={(e) => setKind(e.target.value as "service" | "part")} className="sm:w-40" aria-label="kind">
            <option value="service">{labels.service}</option>
            <option value="part">{labels.part}</option>
          </Select>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1fr_80px_100px_160px_auto]">
        <Input name="name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t.orders.itemName} required className="col-span-2 sm:col-span-1" />
        <Input name="qty" type="number" step="0.01" min="0.01" defaultValue="1" required aria-label={t.common.qty} />
        <Input name="price" type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder={t.common.price} required />
        <Select name="staff_id" defaultValue={defaultStaffId ?? ""} aria-label={labels.staff} className="col-span-2 sm:col-span-1">
          <option value="">{labels.staff}: —</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </Select>
        <SubmitButton className="col-span-2 sm:col-span-1">
          <Plus className="size-4" /> {t.common.add}
        </SubmitButton>
      </div>
    </ActionForm>
  );
}
