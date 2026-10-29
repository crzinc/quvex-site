"use client";

import { useActionState } from "react";
import { MailCheck } from "lucide-react";
import { registerAndAccept } from "@/lib/actions/team";
import { Field, Input } from "@/components/ui";
import { SubmitButton } from "@/components/ui/forms";
import type { Dictionary } from "@/i18n/dictionaries";

export function InviteRegisterForm({ t, token }: { t: Dictionary; token: string }) {
  const [state, action] = useActionState(registerAndAccept.bind(null, token), {});
  if (state.ok) {
    return (
      <div className="mt-6 flex gap-3 rounded-xl border border-border bg-surface p-5 text-sm">
        <MailCheck className="size-5 shrink-0 text-accent" />
        <p>{t.auth.checkEmail}</p>
      </div>
    );
  }
  return (
    <form action={action} className="mt-6 flex flex-col gap-4">
      <Field label={t.auth.fullName}>
        <Input name="full_name" required minLength={2} autoComplete="name" />
      </Field>
      <Field label={t.common.email}>
        <Input name="email" type="email" required autoComplete="email" />
      </Field>
      <Field label={t.common.password} hint={t.auth.passwordHint}>
        <Input name="password" type="password" required minLength={8} autoComplete="new-password" />
      </Field>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton size="lg" variant="accent">{t.invite.accept}</SubmitButton>
    </form>
  );
}
