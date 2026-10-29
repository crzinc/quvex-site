"use client";

import { useActionState } from "react";
import { login } from "@/lib/actions/auth";
import { Field, Input } from "@/components/ui";
import { SubmitButton } from "@/components/ui/forms";
import type { Dictionary } from "@/i18n/dictionaries";

export function LoginForm({ t, next }: { t: Dictionary; next: string }) {
  const [state, action] = useActionState(login, {});
  return (
    <form action={action} className="mt-8 flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <Field label={t.common.email}>
        <Input name="email" type="email" required autoComplete="email" autoFocus />
      </Field>
      <Field label={t.common.password}>
        <Input name="password" type="password" required autoComplete="current-password" />
      </Field>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton size="lg" className="mt-2">{t.auth.loginButton}</SubmitButton>
    </form>
  );
}
