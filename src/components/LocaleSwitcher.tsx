"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLocale } from "@/i18n/actions";
import { LOCALES, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export function LocaleSwitcher({ locale, className }: { locale: Locale; className?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className={cn("inline-flex rounded-lg border border-border p-0.5 text-xs font-medium", pending && "opacity-60", className)}>
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() =>
            startTransition(async () => {
              await setLocale(l);
              router.refresh();
            })
          }
          className={cn(
            "rounded-md px-2 py-1 uppercase transition-colors",
            l === locale ? "bg-surface-2 text-fg" : "text-fg-muted hover:text-fg",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
