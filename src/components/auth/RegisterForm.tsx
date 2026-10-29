"use client";

import { useActionState, useState } from "react";
import { Droplets, Sparkles, Wrench, Check, MailCheck } from "lucide-react";
import { createBusiness, register } from "@/lib/actions/auth";
import { Button, Field, Input } from "@/components/ui";
import { SubmitButton } from "@/components/ui/forms";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/i18n/dictionaries";

const icons = { wrench: Wrench, sparkles: Sparkles, droplets: Droplets, disc: Wrench };

interface NicheOption {
  id: string;
  name: string;
  tagline: string;
  icon: keyof typeof icons;
  enabled: boolean;
}

/**
 * Step 1 picks the niche template, step 2 describes the business, step 3 creates the account.
 * In "business" mode (already signed in) the account step is skipped.
 */
export function RegisterForm({ t, niches, mode }: { t: Dictionary; niches: NicheOption[]; mode: "register" | "business" }) {
  const [state, action] = useActionState(mode === "register" ? register : createBusiness, {});
  const [step, setStep] = useState(0);
  const [niche, setNiche] = useState(niches.find((n) => n.enabled)?.id ?? "");
  const steps = mode === "register" ? [t.auth.stepNiche, t.auth.stepBusiness, t.auth.stepAccount] : [t.auth.stepNiche, t.auth.stepBusiness];
  const last = step === steps.length - 1;

  if (state.ok) {
    return (
      <div className="mt-8 flex gap-3 rounded-xl border border-border bg-surface p-5 text-sm">
        <MailCheck className="size-5 shrink-0 text-accent" />
        <p>{t.auth.checkEmail}</p>
      </div>
    );
  }

  return (
    <form
      action={action}
      className="mt-8"
      onSubmit={(e) => {
        if (!last) {
          e.preventDefault();
          if (e.currentTarget.reportValidity()) setStep(step + 1);
        }
      }}
    >
      <ol className="mb-6 flex gap-2 text-xs font-medium">
        {steps.map((label, i) => (
          <li key={label} className="flex flex-1 flex-col gap-2">
            <span className={cn("h-1 rounded-full", i <= step ? "bg-accent" : "bg-border")} />
            <span className={i === step ? "text-fg" : "text-fg-subtle"}>{label}</span>
          </li>
        ))}
      </ol>

      <input type="hidden" name="niche" value={niche} />

      {/* Hidden steps keep their inputs mounted so the final submit carries all fields. */}
      <div className={cn("grid gap-3", step !== 0 && "hidden")}>
        {niches.map((n) => {
          const Icon = icons[n.icon];
          const selected = n.id === niche;
          return (
            <button
              key={n.id}
              type="button"
              disabled={!n.enabled}
              onClick={() => setNiche(n.id)}
              className={cn(
                "flex items-center gap-4 rounded-xl border bg-surface p-4 text-left transition-colors disabled:opacity-50",
                selected ? "border-accent ring-4 ring-ring" : "border-border hover:border-border-strong",
              )}
            >
              <span className={cn("grid size-10 shrink-0 place-items-center rounded-lg", selected ? "bg-accent text-white" : "bg-surface-2")}>
                <Icon className="size-5" strokeWidth={1.75} />
              </span>
              <span className="flex-1">
                <span className="block font-medium">{n.name}</span>
                <span className="block text-sm text-fg-muted">{n.tagline}</span>
              </span>
              {!n.enabled ? (
                <span className="text-xs text-fg-subtle">{t.auth.soon}</span>
              ) : (
                selected && <Check className="size-5 text-accent" />
              )}
            </button>
          );
        })}
      </div>

      <div className={cn("grid gap-4", step !== 1 && "hidden")}>
        <Field label={t.auth.businessName}>
          <Input name="business_name" required={step >= 1} minLength={2} placeholder={t.auth.businessNamePlaceholder} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.auth.city}>
            <Input name="city" defaultValue="Bakı" />
          </Field>
          <Field label={t.common.phone}>
            <Input name="phone" type="tel" required={step >= 1} minLength={7} placeholder="+994 50 000 00 00" autoComplete="tel" />
          </Field>
        </div>
      </div>

      {mode === "register" && (
        <div className={cn("grid gap-4", step !== 2 && "hidden")}>
          <Field label={t.auth.fullName}>
            <Input name="full_name" required={step >= 2} minLength={2} autoComplete="name" />
          </Field>
          <Field label={t.common.email}>
            <Input name="email" type="email" required={step >= 2} autoComplete="email" />
          </Field>
          <Field label={t.common.password} hint={t.auth.passwordHint}>
            <Input name="password" type="password" required={step >= 2} minLength={8} autoComplete="new-password" />
          </Field>
        </div>
      )}

      {state.error && <p className="mt-4 text-sm text-red-600">{state.error}</p>}

      <div className="mt-6 flex gap-3">
        {step > 0 && (
          <Button type="button" variant="secondary" size="lg" onClick={() => setStep(step - 1)}>
            {t.common.back}
          </Button>
        )}
        {last ? (
          <SubmitButton size="lg" variant="accent" className="flex-1" pendingLabel={t.auth.creatingBusiness}>
            {mode === "register" ? t.auth.registerButton : t.common.create}
          </SubmitButton>
        ) : (
          <Button type="submit" size="lg" className="flex-1" disabled={!niche}>
            {t.auth.next}
          </Button>
        )}
      </div>
    </form>
  );
}
