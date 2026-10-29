"use client";

import { useState } from "react";
import { CAR_MAKES_LIST, getCarModels } from "@/lib/car-data";
import { Field, Input } from "@/components/ui";
import type { FieldDef } from "@/niches/types";
import type { Locale } from "@/i18n/config";

/** Renders the asset inputs declared by the niche template (plate, make, model, …). */
export function AssetFields({
  locale,
  identifierLabel,
  identifierPlaceholder,
  fields,
  required = false,
}: {
  locale: Locale;
  identifierLabel: string;
  identifierPlaceholder: string;
  fields: FieldDef[];
  required?: boolean;
}) {
  const [make, setMake] = useState("");
  const models = getCarModels(make);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label={identifierLabel}>
        <Input name="identifier" placeholder={identifierPlaceholder} className="uppercase" required={required} />
      </Field>
      {fields.map((f) => {
        const name = `attr.${f.key}`;
        const label = f.label[locale];
        if (f.type === "car_make")
          return (
            <Field key={f.key} label={label}>
              <Input name={name} list="car-makes" value={make} onChange={(e) => setMake(e.target.value)} autoComplete="off" />
              <datalist id="car-makes">
                {CAR_MAKES_LIST.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </Field>
          );
        if (f.type === "car_model")
          return (
            <Field key={f.key} label={label}>
              <Input name={name} list="car-models" autoComplete="off" />
              <datalist id="car-models">
                {models.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </Field>
          );
        return (
          <Field key={f.key} label={label}>
            <Input
              name={name}
              type={f.type === "year" || f.type === "number" ? "number" : "text"}
              min={f.type === "year" ? 1950 : undefined}
              max={f.type === "year" ? new Date().getFullYear() + 1 : undefined}
              placeholder={f.placeholder}
            />
          </Field>
        );
      })}
    </div>
  );
}
