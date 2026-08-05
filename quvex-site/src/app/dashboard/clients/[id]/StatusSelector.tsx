"use client";

import { useState } from "react";
import { Check } from "lucide-react";
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
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="cursor-pointer">
        <Badge className={`${getStatusColor(status)} text-sm px-3 py-1 cursor-pointer hover:opacity-80 transition-opacity`}>
          {t(`status.${status}`)}
        </Badge>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-20 py-1">
            {statuses.map((s) => (
              <button
                key={s}
                onClick={() => handleChange(s)}
                className={`flex items-center justify-between w-full px-4 py-2 text-sm transition-colors ${
                  status === s ? "text-primary" : "text-zinc-300 hover:text-white hover:bg-zinc-800"
                }`}
              >
                <span>{t(`status.${s}`)}</span>
                {status === s && <Check className="w-4 h-4 text-primary" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
