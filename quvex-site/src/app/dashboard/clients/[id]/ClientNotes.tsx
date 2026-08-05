"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { formatDate, getInitials } from "@/lib/utils";
import { useT } from "@/i18n/I18nProvider";
import { toast } from "sonner";

interface Note {
  id: string; content: string; created_by: string; created_at: string;
}

export default function ClientNotes({ clientId }: { clientId: string }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const { t } = useT();

  useEffect(() => {
    const loadNotes = async () => {
      const { data } = await supabase.from("notes").select("*").eq("client_id", clientId).order("created_at", { ascending: false });
      if (data) setNotes(data as Note[]);
    };
    loadNotes();
  }, [clientId, supabase]);

  const handleAdd = async () => {
    if (!content.trim()) return;
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("notes").insert({ client_id: clientId, content: content.trim(), created_by: user.email });
    if (error) { toast.error(error.message); } else {
      setContent("");
      const { data } = await supabase.from("notes").select("*").eq("client_id", clientId).order("created_at", { ascending: false });
      if (data) setNotes(data as Note[]);
      toast.success("Note added");
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader><CardTitle>{t("client.notes_title")}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Textarea placeholder={t("client.notes_placeholder")} value={content} onChange={(e) => setContent(e.target.value)} rows={2} />
          <Button onClick={handleAdd} loading={loading} className="self-end"><Plus className="w-4 h-4" /></Button>
        </div>
        <div className="space-y-3">
          {notes.length === 0 && <p className="text-sm text-zinc-500 text-center py-4">{t("client.notes_empty")}</p>}
          {notes.map((note) => (
            <div key={note.id} className="p-3 rounded-xl bg-zinc-800/30 border border-zinc-800">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-medium text-primary">{getInitials(note.created_by)}</div>
                <span className="text-xs text-zinc-500">{note.created_by}</span>
                <span className="text-xs text-zinc-600">{formatDate(note.created_at)}</span>
              </div>
              <p className="text-sm text-zinc-300 whitespace-pre-wrap">{note.content}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
