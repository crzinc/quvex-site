"use client";

import { createContext, startTransition, useActionState, useContext, useEffect, useOptimistic, useRef, type ComponentProps, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "./index";
import { cn } from "@/lib/utils";
import type { ActionState } from "@/lib/types";

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;

/** ActionForm submits through a transition (to keep typed values on error), so it shares its pending flag via context. */
const PendingContext = createContext(false);

/** True while the enclosing form's action runs — plain `<form action>` or ActionForm. */
function usePending() {
  const { pending } = useFormStatus();
  return useContext(PendingContext) || pending;
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("size-4 animate-spin", className)} aria-hidden />;
}

/**
 * Form bound to a server action; shows the returned error and optionally resets on success.
 * Unlike a bare `<form action>`, React does not wipe the fields when the action returns an error.
 */
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
  const [state, formAction, pending] = useActionState(action, {});
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
    <form
      ref={ref}
      action={formAction}
      onSubmit={(e) => {
        e.preventDefault();
        if (pending) return;
        const data = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
        startTransition(() => formAction(data));
      }}
      className={className}
    >
      <PendingContext value={pending}>{children}</PendingContext>
      {!pending && state.error && <p className="mt-3 text-sm text-red-600">{state.error}</p>}
      {!pending && state.ok && successMessage && <p className="mt-3 text-sm text-emerald-600">{successMessage}</p>}
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
  const pending = usePending();
  return (
    <Button type="submit" variant={variant} size={size} disabled={pending} aria-busy={pending} className={className}>
      {pending ? (
        <>
          <Spinner /> {pendingLabel ?? children}
        </>
      ) : (
        children
      )}
    </Button>
  );
}

/** Unstyled submit button (icon buttons, text links) that disables itself and shows a spinner while the action runs. */
export function PendingButton({ children, className, icon = false, ...props }: ComponentProps<"button"> & { icon?: boolean }) {
  const pending = usePending();
  return (
    <button type="submit" {...props} disabled={pending || props.disabled} aria-busy={pending} className={cn(className, pending && "cursor-wait opacity-60")}>
      {pending && icon ? (
        <Spinner />
      ) : (
        <>
          {pending && <Spinner className="mr-1 inline" />}
          {children}
        </>
      )}
    </button>
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
  const pending = usePending();
  return (
    <select
      {...props}
      aria-busy={pending}
      className={cn(
        "h-9 rounded-lg border border-border bg-surface px-2 text-sm focus:border-accent focus:outline-none focus:ring-4 focus:ring-ring",
        pending && "cursor-wait opacity-60",
        className,
      )}
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
    />
  );
}

/**
 * Order status switcher: the tapped status lights up immediately (optimistic),
 * while the server action saves it and the page refreshes.
 */
export function StatusPipeline({
  action,
  current,
  statuses,
}: {
  action: (formData: FormData) => Promise<void>;
  current: string;
  statuses: { id: string; label: string }[];
}) {
  const [shown, setShown] = useOptimistic(current);
  return (
    <div className="flex min-w-max gap-1">
      {statuses.map((s) => (
        <form
          key={s.id}
          action={async (formData) => {
            setShown(s.id);
            await action(formData);
          }}
        >
          <input type="hidden" name="status" value={s.id} />
          <button
            type="submit"
            disabled={s.id === shown}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              s.id === shown ? "bg-primary text-primary-fg" : "text-fg-muted hover:bg-surface-2 hover:text-fg",
            )}
          >
            {s.label}
          </button>
        </form>
      ))}
    </div>
  );
}

export function PrintButton({ children }: { children: ReactNode }) {
  return (
    <Button type="button" variant="secondary" onClick={() => window.print()}>
      {children}
    </Button>
  );
}
