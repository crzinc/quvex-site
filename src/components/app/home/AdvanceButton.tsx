import { ArrowRight } from "lucide-react";
import { updateOrderStatus } from "@/lib/actions/crm";
import { nextStatus, type NicheConfig } from "@/niches";
import { Button } from "@/components/ui";
import type { Locale } from "@/i18n/config";

/** One-tap move to the next status (e.g. "In progress" → "Ready"). */
export function AdvanceButton({
  slug,
  orderId,
  status,
  niche,
  locale,
  size = "sm",
}: {
  slug: string;
  orderId: string;
  status: string;
  niche: NicheConfig;
  locale: Locale;
  size?: "sm" | "md" | "lg";
}) {
  const next = nextStatus(niche, status);
  if (!next) return null;
  return (
    <form action={updateOrderStatus.bind(null, slug, orderId)}>
      <input type="hidden" name="status" value={next.id} />
      <Button type="submit" variant="secondary" size={size} className="w-full">
        <ArrowRight className="size-4" /> {next.label[locale]}
      </Button>
    </form>
  );
}
