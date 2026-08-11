"use client";

import { Bell } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { useT } from "@/i18n/I18nProvider";
import LanguageSwitcher from "@/components/LanguageSwitcher";

interface StudioHeaderProps {
  slug: string;
}

export default function StudioHeader({ slug }: StudioHeaderProps) {
  const [notifications, setNotifications] = useState<{ id: string; subject: string; message: string; created_at: string }[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const supabase = useRef(createClient());
  const { t } = useT();

  useEffect(() => {
    supabase.current
      .from("studios")
      .select("id")
      .eq("slug", slug)
      .single()
      .then(async ({ data: studio }) => {
        if (!studio) return;
        const { data } = await supabase.current
          .from("studio_messages")
          .select("id, subject, message, created_at")
          .eq("studio_id", studio.id)
          .order("created_at", { ascending: false })
          .limit(5);
        if (data) setNotifications(data);
      });
  }, [slug]);

  return (
    <header className="sticky top-0 z-40 flex items-center justify-end px-8 py-4 bg-dashboard-bg/80 backdrop-blur-xl border-b border-zinc-800/50">
      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all ${showNotifications ? "bg-zinc-800 text-white" : ""}`}
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-[10px] bg-accent text-white rounded-full">
                {notifications.length}
              </Badge>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="absolute right-0 top-full mt-2 w-80 bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-xl shadow-2xl shadow-black/50 overflow-hidden"
              >
                <div className="p-4 border-b border-zinc-800">
                  <h3 className="font-medium text-sm">{t("studio.header.notif_title")}</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-sm text-zinc-500 text-center">{t("studio.header.notif_empty")}</div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className="p-4 border-b border-zinc-800/50 hover:bg-zinc-800/50 transition-colors">
                        <p className="text-sm font-medium">{n.subject}</p>
                        <p className="text-xs text-zinc-500 mt-1">{n.message}</p>
                        <p className="text-xs text-zinc-600 mt-2">{formatDate(n.created_at)}</p>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <LanguageSwitcher />
      </div>
    </header>
  );
}
