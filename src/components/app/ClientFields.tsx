import { Field, Input, Select, Textarea } from "@/components/ui";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Client } from "@/lib/types";

export function ClientFields({ t, client }: { t: Dictionary; client?: Client }) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.common.name}>
          <Input name="name" required defaultValue={client?.name} autoComplete="off" />
        </Field>
        <Field label={t.common.phone}>
          <Input name="phone" type="tel" placeholder="+994 50 000 00 00" defaultValue={client?.phone ?? ""} />
        </Field>
      </div>
      <Field label={t.clients.source}>
        <Select name="source" defaultValue={client?.source ?? ""}>
          <option value="">—</option>
          {Object.entries(t.clients.sources).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </Select>
      </Field>
      <Field label={t.common.notes}>
        <Textarea name="notes" rows={2} defaultValue={client?.notes ?? ""} />
      </Field>
    </div>
  );
}
