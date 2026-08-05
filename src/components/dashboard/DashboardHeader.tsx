"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Bell, Search, CheckCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDate } from "@/lib/utils";
import { useT } from "@/i18n/I18nProvider";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import type { User } from "@supabase/supabase-js";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  client_id: string;
  read: boolean;
  created_at: string;
}

export default function DashboardHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();
  const { t } = useT();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, [supabase]);

  useEffect(() => {
    const fetchNotifs = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      if (data) setNotifications(data as Notification[]);
    };
    fetchNotifs();

    const channel = supabase
      .channel("notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, (payload) => {
        setNotifications((prev) => [payload.new as Notification, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const markAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    await supabase.from("notifications").update({ read: true }).in("id", unreadIds);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-40 bg-dashboard-bg/80 backdrop-blur-xl border-b border-zinc-800/50 px-8 py-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              placeholder={t("header.search_placeholder")}
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-primary/50"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />

          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotif(!showNotif)}
              className={`relative p-2 text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-zinc-800/60 ${showNotif ? "bg-zinc-800/60 text-white" : ""}`}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-accent text-[10px] font-bold flex items-center justify-center text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotif && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="absolute right-0 top-full mt-2 w-96 max-h-96 bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50"
                >
                  <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                    <h4 className="text-sm font-semibold">{t("header.notif_title")}</h4>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs text-primary hover:underline flex items-center gap-1">
                        <CheckCheck className="w-3 h-3" /> {t("header.mark_read")}
                      </button>
                    )}
                  </div>
                  <div className="overflow-y-auto max-h-[300px]">
                    {notifications.length === 0 ? (
                      <p className="text-sm text-zinc-500 text-center py-8">{t("header.notif_empty")}</p>
                    ) : (
                      notifications.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => {
                            if (n.client_id) router.push(`/dashboard/clients/${n.client_id}`);
                            setShowNotif(false);
                          }}
                          className={`w-full text-left p-4 border-b border-zinc-800/50 hover:bg-zinc-800/50 transition-colors ${!n.read ? "bg-primary/5" : ""}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.type === "quiz" ? "bg-purple-400" : "bg-blue-400"} ${n.read ? "opacity-30" : ""}`} />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-white truncate">{n.title}</p>
                              <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">{n.message}</p>
                              <p className="text-[10px] text-zinc-600 mt-1">{formatDate(n.created_at)}</p>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-3 pl-4 border-l border-zinc-800">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
              {user?.email?.[0].toUpperCase() || "?"}
            </div>
            <div className="text-sm">
              <p className="text-white font-medium truncate max-w-[150px]">{user?.email || "Worker"}</p>
              <p className="text-xs text-zinc-500">{t("header.employee")}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
