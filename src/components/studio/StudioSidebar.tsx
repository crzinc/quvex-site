"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Scissors,
  Calendar,
  Wallet,
  MessageSquare,
  Settings,
  LogOut,
  Plus,
  Menu,
  X,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useT } from "@/i18n/I18nProvider";

interface StudioSidebarProps {
  slug: string;
  studioName: string;
  studioLogo?: string;
}

export default function StudioSidebar({ slug, studioName, studioLogo }: StudioSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { t } = useT();
  const [open, setOpen] = useState(false);

  const links = [
    { href: `/studio/${slug}`, label: t("studio.sidebar.dashboard"), icon: LayoutDashboard },
    { href: `/studio/${slug}/clients`, label: t("studio.sidebar.clients"), icon: Users },
    { href: `/studio/${slug}/services`, label: t("studio.sidebar.services"), icon: Scissors },
    { href: `/studio/${slug}/appointments`, label: t("studio.sidebar.appointments"), icon: Calendar },
    { href: `/studio/${slug}/finance`, label: t("studio.sidebar.finance"), icon: Wallet },
    { href: `/studio/${slug}/messages`, label: t("studio.sidebar.messages"), icon: MessageSquare },
    { href: `/studio/${slug}/settings`, label: t("studio.sidebar.settings"), icon: Settings },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success(t("studio.logged_out"));
    router.push("/");
    router.refresh();
  };

  const nav = (
    <>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const isActive = pathname === link.href || (link.href !== `/studio/${slug}` && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all",
                isActive
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50",
              )}
            >
              <link.icon className="w-4 h-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-zinc-800/50 space-y-2">
        <Link
          href={`/studio/${slug}/clients/new`}
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all"
        >
          <Plus className="w-4 h-4" />
          {t("studio.sidebar.new_client")}
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-zinc-400 hover:text-accent hover:bg-accent/5 transition-all w-full"
        >
          <LogOut className="w-4 h-4" />
          {t("studio.sidebar.logout")}
        </button>
      </div>
    </>
  );

  const brand = (
    <Link href={`/studio/${slug}`} className="flex items-center gap-3" onClick={() => setOpen(false)}>
      {studioLogo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={studioLogo} alt={studioName} className="w-12 h-12 rounded-xl object-cover" />
      ) : (
        <Image src="/logo.png" alt="Quvex CRM" width={48} height={48} className="rounded-xl" />
      )}
      <div className="flex flex-col min-w-0">
        <span className="text-lg font-bold gradient-text">Quvex CRM</span>
        <span className="text-xs text-zinc-500 truncate max-w-[160px]">{studioName}</span>
      </div>
    </Link>
  );

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label="Menu"
        className="lg:hidden fixed top-4 left-4 z-[60] p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-sidebar border-r border-zinc-800/50 flex-col z-50">
        <div className="p-6 border-b border-zinc-800/50">{brand}</div>
        {nav}
      </aside>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-sidebar border-r border-zinc-800 flex flex-col">
            <div className="p-6 border-b border-zinc-800/50 pr-14">{brand}</div>
            {nav}
          </aside>
        </div>
      )}
    </>
  );
}
