"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function AdminNav({ items }: { items: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto text-sm">
      {items.map((i) => {
        const active = i.href === "/admin" ? pathname === i.href : pathname.startsWith(i.href);
        return (
          <Link
            key={i.href}
            href={i.href}
            className={cn("rounded-lg px-3 py-1.5 font-medium whitespace-nowrap", active ? "bg-surface-2 text-fg" : "text-fg-muted hover:text-fg")}
          >
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}
