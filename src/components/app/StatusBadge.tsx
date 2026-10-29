import { Badge } from "@/components/ui";
import { getStatus, type NicheConfig } from "@/niches";
import type { Locale } from "@/i18n/config";

export function StatusBadge({ niche, status, locale }: { niche: NicheConfig; status: string; locale: Locale }) {
  const s = getStatus(niche, status);
  return <Badge tone={s.tone}>{s.label[locale]}</Badge>;
}
