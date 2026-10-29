"use client";

import { useActionState } from "react";
import { MailCheck } from "lucide-react";
import { requestPasswordReset, updatePassword } from "@/lib/actions/auth";
import { Field, Input } from "@/components/ui";
import { SubmitButton } from "@/components/ui/forms";
import type { Dictionary } from "@/i18n/dictionaries";

export function ForgotPasswordForm({ t }: { t: Dictionary }) {
  const [state, action] = useActionState(requestPasswordReset, {});
  if (state.ok) {
    return (
      <div className="mt-8 flex gap-3 rounded-xl border border-border bg-surface p-5 text-sm">
        <MailCheck className="size-5 shrink-0 text-accent" />
        <p>{t.auth.resetSent}</p>
      </div>
    );
  }
  return (
    <form action={action} className="mt-8 flex flex-col gap-4">
      <Field label={t.common.email}>
        <Input name="email" type="email" required autoComplete="email" autoFocus />
      </Field>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton size="lg">{t.auth.sendResetLink}</SubmitButton>
    </form>
  );
}

export function ResetPasswordForm({ t }: { t: Dictionary }) {
  const [state, action] = useActionState(updatePassword, {});
  return (
    <form action={action} className="mt-8 flex flex-col gap-4">
      <Field label={t.auth.newPassword} hint={t.auth.passwordHint}>
        <Input name="password" type="password" required minLength={8} autoComplete="new-password" autoFocus />
      </Field>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton size="lg">{t.auth.resetButton}</SubmitButton>
    </form>
  );
}
