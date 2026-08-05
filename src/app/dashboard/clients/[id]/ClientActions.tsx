"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Trash2, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useT } from "@/i18n/I18nProvider";

export default function ClientActions({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { t } = useT();

  const handleDelete = async () => {
    if (!confirm(t("common.confirm_delete"))) return;
    const { error } = await supabase.from("clients").delete().eq("id", clientId);
    if (error) { toast.error(error.message); return; }
    toast.success(t("common.deleted"));
    router.push("/dashboard/clients");
    router.refresh();
  };

  return (
    <div className="relative">
      <Button variant="ghost" size="sm" onClick={() => setOpen(!open)}>
        <MoreHorizontal className="w-4 h-4" />
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-44 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-20 py-1">
            <button onClick={() => { setOpen(false); router.refresh(); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800">
              <Edit3 className="w-4 h-4" /> {t("client.edit")}
            </button>
            <button onClick={handleDelete} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-accent hover:bg-accent/5">
              <Trash2 className="w-4 h-4" /> {t("client.delete")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
