"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Plus,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useT } from "@/i18n/I18nProvider";

const links = [
  { href: "/dashboard", label: "sidebar.dashboard", icon: LayoutDashboard },
  { href: "/dashboard/clients", label: "sidebar.clients", icon: Users },
  { href: "/dashboard/settings", label: "sidebar.settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { t } = useT();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success(t("common.logout_success"));
    router.push("/");
    router.refresh();
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-sidebar border-r border-zinc-800/50 flex flex-col z-50">
      <div className="p-6 border-b border-zinc-800/50">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.png" alt="Quvex CRM" width={64} height={64} className="rounded-xl" />
          <span className="text-lg font-bold gradient-text">Quvex CRM</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all",
                isActive
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50",
              )}
            >
              <link.icon className="w-4 h-4" />
              {t(link.label)}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-zinc-800/50 space-y-2">
        <Link
          href="/dashboard/clients/new"
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all"
        >
          <Plus className="w-4 h-4" />
          {t("sidebar.new_client")}
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-zinc-400 hover:text-accent hover:bg-accent/5 transition-all w-full"
        >
          <LogOut className="w-4 h-4" />
          {t("sidebar.logout")}
        </button>
      </div>
    </aside>
  );
}
