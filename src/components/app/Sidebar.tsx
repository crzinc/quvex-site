"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ClipboardList, LayoutGrid, Package, Settings, Shield, Users, UserCog, Wallet, LogOut, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { logout } from "@/lib/actions/auth";

const icons = { dashboard: LayoutGrid, orders: ClipboardList, clients: Users, catalog: Package, staff: UserCog, finance: Wallet, reminders: Bell, settings: Settings, admin: Shield };

export interface NavItem {
  id: keyof typeof icons;
  href: string;
  label: string;
  badge?: number;
}

function isActive(pathname: string, href: string, exact: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({
  items,
  base,
  tenantName,
  nicheName,
  logoutLabel,
  moreLabel,
  footer,
}: {
  items: NavItem[];
  base: string;
  tenantName: string;
  nicheName: string;
  logoutLabel: string;
  moreLabel: string;
  footer?: React.ReactNode;
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  // Mobile bottom bar shows the first four destinations; the rest go into "more".
  const primary = items.slice(0, 4);
  const secondary = items.slice(4);

  const link = (item: NavItem, compact = false) => {
    const Icon = icons[item.id];
    const active = isActive(pathname, item.href, item.href === base);
    return (
      <Link
        key={item.id}
        href={item.href}
        onClick={() => setMoreOpen(false)}
        className={cn(
          compact
            ? "flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium"
            : "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          active ? "text-fg" : "text-fg-muted hover:text-fg",
          !compact && active && "bg-surface-2",
          !compact && !active && "hover:bg-surface-2/60",
        )}
      >
        <Icon className={cn(compact ? "size-5" : "size-4", active && "text-accent")} strokeWidth={1.75} />
        <span className={cn(compact && "max-w-16 truncate")}>{item.label}</span>
        {!compact && !!item.badge && (
          <span className="ml-auto rounded-md bg-accent-soft px-1.5 text-xs text-accent tabular-nums">{item.badge}</span>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Desktop */}
      <aside className="no-print sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-border bg-surface lg:flex">
        <div className="border-b border-border px-4 py-4">
          <Link href="/app" className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-fg">
              {tenantName.slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{tenantName}</span>
              <span className="block truncate text-xs text-fg-muted">{nicheName}</span>
            </span>
          </Link>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">{items.map((i) => link(i))}</nav>
        <div className="flex items-center justify-between gap-2 border-t border-border p-3">
          {footer}
          <form action={logout}>
            <button type="submit" className="rounded-lg p-2 text-fg-muted hover:bg-surface-2 hover:text-fg" title={logoutLabel}>
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile */}
      <header className="no-print sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-surface/90 px-4 backdrop-blur lg:hidden">
        <Link href="/app" className="truncate text-sm font-semibold">{tenantName}</Link>
        {footer}
      </header>
      <nav className="no-print fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {primary.map((i) => link(i, true))}
        {secondary.length > 0 && (
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            className={cn("flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium", moreOpen ? "text-fg" : "text-fg-muted")}
          >
            <MoreHorizontal className="size-5" strokeWidth={1.75} />
            <span>{moreLabel}</span>
          </button>
        )}
      </nav>
      {moreOpen && (
        <div className="no-print fixed inset-0 z-20 bg-black/20 lg:hidden" onClick={() => setMoreOpen(false)}>
          <div
            className="absolute inset-x-3 bottom-20 flex flex-col gap-0.5 rounded-xl border border-border bg-surface p-2 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {secondary.map((i) => link(i))}
            <form action={logout}>
              <button type="submit" className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-fg-muted hover:bg-surface-2">
                <LogOut className="size-4" /> {logoutLabel}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
