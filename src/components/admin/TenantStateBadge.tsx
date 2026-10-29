import { Badge, type Tone } from "@/components/ui";
import type { TenantState } from "@/lib/admin";
import type { Dictionary } from "@/i18n/dictionaries";

const tones: Record<TenantState, Tone> = { paying: "green", trial: "blue", expired: "amber", suspended: "red" };

export function TenantStateBadge({ state, t }: { state: TenantState; t: Dictionary }) {
  return <Badge tone={tones[state]}>{t.admin.states[state]}</Badge>;
}
