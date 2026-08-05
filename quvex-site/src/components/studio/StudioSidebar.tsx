"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface StudioSidebarProps {
  slug: string;
  studioName: string;
  studioLogo?: string;
}

export default function StudioSidebar({ slug, studioName, studioLogo }: StudioSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const links = [
    { href: `/studio/${slug}`, label: "Dashboard", icon: LayoutDashboard },
    { href: `/studio/${slug}/clients`, label: "Клиенты", icon: Users },
    { href: `/studio/${slug}/services`, label: "Услуги", icon: Scissors },
    { href: `/studio/${slug}/appointments`, label: "Записи", icon: Calendar },
    { href: `/studio/${slug}/finance`, label: "Финансы", icon: Wallet },
    { href: `/studio/${slug}/messages`, label: "Сообщения", icon: MessageSquare },
    { href: `/studio/${slug}/settings`, label: "Настройки", icon: Settings },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Вы вышли из системы");
    router.push("/");
    router.refresh();
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-sidebar border-r border-zinc-800/50 flex flex-col z-50">
      <div className="p-6 border-b border-zinc-800/50">
        <Link href={`/studio/${slug}`} className="flex items-center gap-3">
          {studioLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={studioLogo} alt={studioName} className="w-16 h-16 rounded-xl object-cover" />
          ) : (
            <Image src="/logo.png" alt="Quvex CRM" width={64} height={64} className="rounded-xl" />
          )}
          <div className="flex flex-col">
            <span className="text-lg font-bold gradient-text">Quvex CRM</span>
            <span className="text-xs text-zinc-500 truncate">{studioName}</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => {
          const isActive = pathname === link.href || (link.href !== `/studio/${slug}` && pathname.startsWith(link.href));
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
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-zinc-800/50 space-y-2">
        <Link
          href={`/studio/${slug}/clients/new`}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all"
        >
          <Plus className="w-4 h-4" />
          Новый клиент
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-zinc-400 hover:text-accent hover:bg-accent/5 transition-all w-full"
        >
          <LogOut className="w-4 h-4" />
          Выйти
        </button>
      </div>
    </aside>
  );
}
