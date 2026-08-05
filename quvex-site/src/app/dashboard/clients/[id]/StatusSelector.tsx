"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { getStatusColor } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/i18n/I18nProvider";

const statuses = ["lead", "negotiation", "development", "completed", "support"];

export default function StatusSelector({ clientId, current }: { clientId: string; current: string }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(current);
  const supabase = createClient();
  const { t } = useT();

  const handleChange = async (newStatus: string) => {
    setStatus(newStatus);
    setOpen(false);
    await supabase.from("clients").update({ status: newStatus }).eq("id", clientId);
  };

  return (
    <div className="relative inline-block">
      <button onClick={() => setOpen(!open)} className="cursor-pointer group flex items-center gap-1">
        <Badge className={`${getStatusColor(status)} text-sm px-3 py-1 cursor-pointer group-hover:brightness-110 transition-all`}>
          {t(`status.${status}`)}
        </Badge>
        <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute left-0 top-full mt-2 w-48 bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-xl shadow-2xl shadow-black/50 z-20 p-1"
            >
              {statuses.map((s) => (
                <button
                  key={s}
                  onClick={() => handleChange(s)}
                  className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                    status === s ? "text-primary bg-primary/10" : "text-zinc-300 hover:text-white hover:bg-zinc-800"
                  }`}
                >
                  <span>{t(`status.${s}`)}</span>
                  {status === s && <Check className="w-4 h-4 text-primary" />}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
