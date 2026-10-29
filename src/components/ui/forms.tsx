"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "./index";
import { cn } from "@/lib/utils";
import type { ActionState } from "@/lib/types";

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;

/** Form bound to a server action; shows the returned error and optionally resets on success. */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess = true,
  successMessage,
  onSuccess,
}: {
  action: Action;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  successMessage?: string;
  onSuccess?: () => void;
}) {
  const [state, formAction] = useActionState(action, {});
  const ref = useRef<HTMLFormElement>(null);
  // Latest callback without re-running the effect: it must fire once per action result, not per render.
  const onSuccessRef = useRef(onSuccess);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  });

  useEffect(() => {
    if (state.ok) {
      if (resetOnSuccess) ref.current?.reset();
      onSuccessRef.current?.();
    }
  }, [state, resetOnSuccess]);

  return (
    <form ref={ref} action={formAction} className={className}>
      {children}
      {state.error && <p className="mt-3 text-sm text-red-600">{state.error}</p>}
      {state.ok && successMessage && <p className="mt-3 text-sm text-emerald-600">{successMessage}</p>}
    </form>
  );
}

export function SubmitButton({
  children,
  pendingLabel,
  variant = "primary",
  size = "md",
  className,
}: {
  children: ReactNode;
  pendingLabel?: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "accent";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} size={size} disabled={pending} className={className}>
      {pending ? (pendingLabel ?? children) : children}
    </Button>
  );
}

/** A one-button form that asks for confirmation before calling the action. */
export function ConfirmForm({
  action,
  message,
  children,
  className,
}: {
  action: (formData: FormData) => Promise<void>;
  message: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <form
      action={action}
      className={cn("inline", className)}
      onSubmit={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </form>
  );
}

/** A select that submits its form as soon as the value changes. */
export function AutoSubmitSelect({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      {...props}
      className={cn(
        "h-9 rounded-lg border border-border bg-surface px-2 text-sm focus:border-accent focus:outline-none focus:ring-4 focus:ring-ring",
        className,
      )}
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
    />
  );
}

export function PrintButton({ children }: { children: ReactNode }) {
  return (
    <Button type="button" variant="secondary" onClick={() => window.print()}>
      {children}
    </Button>
  );
}
