"use client";

import { useActionState, useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";
import { Button, Field, Input, Select, buttonClass } from "@/components/ui";
import { SubmitButton } from "@/components/ui/forms";
import { fill } from "@/i18n/dictionaries";
import type { ActionState } from "@/lib/types";
import type { Dictionary } from "@/i18n/dictionaries";

/** Creates a one-time invite link and offers copy / WhatsApp share. */
export function InviteForm({
  action,
  t,
  businessName,
}: {
  action: (s: ActionState, f: FormData) => Promise<ActionState>;
  t: Dictionary;
  businessName: string;
}) {
  const [state, formAction] = useActionState(action, {});
  const [copied, setCopied] = useState(false);
  const [role, setRole] = useState<"staff" | "manager">("staff");
  const [name, setName] = useState("");
  const link = state.data?.link;

  const waText = link
    ? fill(t.settings.waInvite, { name: name ? `, ${name}` : "", business: businessName, role: t.settings.roles[role].toLowerCase(), link })
    : "";

  return (
    <form action={formAction} className="grid gap-3">
      <p className="text-sm text-fg-muted">{t.settings.inviteHint}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t.settings.role}>
          <Select name="role" value={role} onChange={(e) => setRole(e.target.value as "staff" | "manager")}>
            <option value="staff">{t.settings.roles.staff}</option>
            <option value="manager">{t.settings.roles.manager}</option>
          </Select>
        </Field>
        <Field label={t.settings.inviteName}>
          <Input name="name" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
      </div>
      <p className="text-xs text-fg-muted">{t.settings.roleHints[role]}</p>
      <div>
        <SubmitButton>{t.settings.createLink}</SubmitButton>
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {link && (
        <div className="grid gap-2 rounded-lg border border-accent bg-accent-soft p-3">
          <code className="truncate text-xs">{link}</code>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={async () => {
                await navigator.clipboard.writeText(link);
                setCopied(true);
              }}
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />} {copied ? t.settings.copied : t.settings.copy}
            </Button>
            <a href={`https://wa.me/?text=${encodeURIComponent(waText)}`} target="_blank" rel="noreferrer" className={buttonClass("secondary", "sm")}>
              <MessageCircle className="size-4 text-[#25D366]" /> WhatsApp
            </a>
          </div>
        </div>
      )}
    </form>
  );
}
