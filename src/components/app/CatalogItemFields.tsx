import { Field, Input } from "@/components/ui";
import type { Dictionary } from "@/i18n/dictionaries";
import type { CatalogItem } from "@/lib/types";

export function CatalogItemFields({ t, kind, item }: { t: Dictionary; kind: "service" | "part"; item?: CatalogItem }) {
  return (
    <div className="grid gap-3 sm:grid-cols-6">
      <input type="hidden" name="kind" value={kind} />
      <Field label={t.common.name} className="sm:col-span-3">
        <Input name="name" required defaultValue={item?.name} />
      </Field>
      <Field label={t.common.category} className="sm:col-span-3">
        <Input name="category" defaultValue={item?.category ?? ""} />
      </Field>
      <Field label={t.common.price} className="sm:col-span-2">
        <Input name="price" type="number" step="0.01" min="0" required defaultValue={item?.price ?? ""} />
      </Field>
      {kind === "part" ? (
        <>
          <Field label={t.catalog.cost} className="sm:col-span-2">
            <Input name="cost" type="number" step="0.01" min="0" defaultValue={item?.cost ?? ""} />
          </Field>
          <Field label={t.catalog.stock} className="sm:col-span-1">
            <Input name="stock" type="number" step="0.01" defaultValue={item?.stock ?? 0} />
          </Field>
          <Field label={t.catalog.sku} className="sm:col-span-1">
            <Input name="sku" defaultValue={item?.sku ?? ""} />
          </Field>
        </>
      ) : (
        <Field label={t.catalog.duration} className="sm:col-span-2">
          <Input name="duration_min" type="number" min="0" defaultValue={item?.duration_min ?? ""} />
        </Field>
      )}
    </div>
  );
}
