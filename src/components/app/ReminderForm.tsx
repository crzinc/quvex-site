"use client";

import { useState } from "react";
import { ActionForm, SubmitButton } from "@/components/ui/forms";
import { Field, Input, Select } from "@/components/ui";
import { addMonths, bakuToday } from "@/lib/utils";
import type { ActionState } from "@/lib/types";
import type { Dictionary } from "@/i18n/dictionaries";

/** Due date `months` from today (Baku calendar), as YYYY-MM-DD. */
function dueIn(months: number) {
  return addMonths(new Date(`${bakuToday()}T00:00:00Z`), months).toISOString().slice(0, 10);
}

/** Reminder form with niche presets ("oil change in 6 months") that prefill title and date. */
export function ReminderForm({
  action,
  t,
  presets,
  hidden,
  clients,
}: {
  action: (s: ActionState, f: FormData) => Promise<ActionState>;
  t: Dictionary;
  presets: { id: string; title: string; months: number }[];
  hidden?: Record<string, string>;
  clients?: { id: string; name: string }[];
}) {
  const [title, setTitle] = useState(presets[0]?.title ?? "");
  const [due, setDue] = useState(() => dueIn(presets[0]?.months ?? 1));

  return (
    <ActionForm action={action} resetOnSuccess={false} className="grid gap-3">
      {Object.entries(hidden ?? {}).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      {clients && (
        <Field label={t.orders.client}>
          <Select name="client_id" required defaultValue="">
            <option value="" disabled>{t.orders.selectClient}</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </Field>
      )}
      {presets.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setTitle(p.title);
                setDue(dueIn(p.months));
              }}
              className="rounded-md border border-border px-2 py-1 text-xs text-fg-muted hover:border-border-strong hover:text-fg"
            >
              {p.title} · {p.months}m
            </button>
          ))}
        </div>
      )}
      <Field label={t.reminders.titleField}>
        <Input name="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </Field>
      <Field label={t.reminders.dueAt}>
        <Input name="due_at" type="date" value={due} onChange={(e) => setDue(e.target.value)} required />
      </Field>
      <SubmitButton variant="secondary">{t.common.create}</SubmitButton>
    </ActionForm>
  );
}
