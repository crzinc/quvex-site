"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Building,
  MessageSquare,
  DollarSign,
  FileText,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useT } from "@/i18n/I18nProvider";

const links = [
  { href: "/dashboard", label: "sidebar.dashboard", icon: LayoutDashboard },
  { href: "/dashboard/clients", label: "sidebar.clients", icon: Users },
  { href: "/dashboard/requests", label: "sidebar.requests", icon: FileText },
  { href: "/dashboard/studios", label: "sidebar.studios", icon: Building },
  { href: "/dashboard/payments", label: "sidebar.payments", icon: DollarSign },
  { href: "/dashboard/messages", label: "sidebar.messages", icon: MessageSquare },
  { href: "/dashboard/settings", label: "sidebar.settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { t } = useT();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success(t("common.logout_success"));
    router.push("/");
    router.refresh();
  };

  const navLinks = links.map((link) => {
    const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
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
        <link.icon className="w-4 h-4" aria-hidden />
        {t(link.label)}
      </Link>
    );
  });

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
        <div className="p-6 border-b border-zinc-800/50">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="Quvex CRM" width={64} height={64} className="rounded-xl" />
            <span className="text-lg font-bold gradient-text">Quvex Admin</span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1" aria-label="Admin">{navLinks}</nav>
        <div className="p-4 border-t border-zinc-800/50 space-y-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-zinc-400 hover:text-accent hover:bg-accent/5 transition-all w-full"
          >
            <LogOut className="w-4 h-4" />
            {t("sidebar.logout")}
          </button>
        </div>
      </aside>
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-sidebar border-r border-zinc-800 flex flex-col">
            <div className="p-6 border-b border-zinc-800/50 pr-14">
              <span className="text-lg font-bold gradient-text">Quvex Admin</span>
            </div>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">{navLinks}</nav>
            <div className="p-4 border-t border-zinc-800/50">
              <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-zinc-400 hover:text-accent w-full">
                <LogOut className="w-4 h-4" />
                {t("sidebar.logout")}
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
