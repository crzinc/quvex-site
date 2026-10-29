"use client";

import { useActionState } from "react";
import Link from "next/link";
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
      <Field
        label={
          <span className="flex items-center justify-between">
            {t.common.password}
            <Link href="/forgot-password" className="text-xs font-normal text-fg-muted hover:text-fg">{t.auth.forgotPassword}</Link>
          </span>
        }
      >
        <Input name="password" type="password" required autoComplete="current-password" />
      </Field>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton size="lg" className="mt-2">{t.auth.loginButton}</SubmitButton>
    </form>
  );
}
