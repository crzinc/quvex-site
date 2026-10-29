import Link from "next/link";
import { QuvexMark, QuvexWordmark } from "@/components/brand/QuvexMark";
import { cn } from "@/lib/utils";

/** Brand lockup: monogram + wordmark. `size` is the mark height in px; the wordmark scales with it. */
export function Logo({ href = "/", size = 28, className }: { href?: string; size?: number; className?: string }) {
  return (
    <Link href={href} aria-label="Quvex" className={cn("inline-flex shrink-0 items-center text-fg", className)} style={{ gap: size * 0.32 }}>
      <QuvexMark style={{ height: size, width: "auto" }} />
      <QuvexWordmark style={{ height: size * 0.4, width: "auto", marginTop: size * 0.08 }} />
    </Link>
  );
}
