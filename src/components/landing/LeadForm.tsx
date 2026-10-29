"use client";

import { useActionState } from "react";
import { submitLead } from "@/lib/actions/leads";
import { Input } from "@/components/ui";
import { SubmitButton } from "@/components/ui/forms";
import type { Dictionary } from "@/i18n/dictionaries";

export function LeadForm({ t }: { t: Dictionary["landing"] }) {
  const [state, action] = useActionState(submitLead, {});

  if (state.ok) {
    return <p className="rounded-xl bg-accent-soft px-5 py-4 text-sm font-medium text-accent">{t.leadDone}</p>;
  }

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
      <Input name="name" placeholder={t.leadName} required minLength={2} autoComplete="name" />
      <Input name="phone" type="tel" placeholder={t.leadPhone} required minLength={7} autoComplete="tel" />
      <Input name="business_name" placeholder={t.leadBusiness} />
      <input type="hidden" name="niche" value="auto_service" />
      <SubmitButton variant="accent">{t.leadSubmit}</SubmitButton>
      {state.error && <p className="text-sm text-red-600 sm:col-span-4">{state.error}</p>}
    </form>
  );
}
