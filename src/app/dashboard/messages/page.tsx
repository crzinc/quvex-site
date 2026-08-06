"use client";

import { useEffect, useState, useRef } from "react";
import { MessageSquare, AlertCircle, Bug, Lightbulb, CreditCard, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatDate, getStatusColor, getPriorityColor, getStatusLabel } from "@/lib/utils";
import { toast } from "sonner";
import { useT } from "@/i18n/I18nProvider";
import type { StudioMessage, Studio } from "@/types";

export default function DashboardMessagesPage() {
  const [messages, setMessages] = useState<(StudioMessage & { studio?: Studio })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<StudioMessage | null>(null);
  const [reply, setReply] = useState("");
  const [filter, setFilter] = useState("all");
  const supabase = useRef(createClient());
  const { t } = useT();

  const fetchMessages = async () => {
    const { data } = await supabase.current
      .from("studio_messages")
      .select("*, studios(name, slug), message_replies(*)")
      .order("created_at", { ascending: false });

    if (data) {
      const messagesWithReplies = data.map((msg) => ({
        ...msg,
        replies: msg.message_replies || [],
      }));
      setMessages(messagesWithReplies);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleReply = async () => {
    if (!selectedMessage || !reply.trim()) return;

    const { error } = await supabase.current.from("message_replies").insert({
      message_id: selectedMessage.id,
      content: reply,
      is_admin: true,
    });

    if (error) {
      toast.error(t("common.reply_send_error"));
    } else {
      toast.success(t("common.reply_sent"));
      setReply("");
      fetchMessages();
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.current
      .from("studio_messages")
      .update({ status })
      .eq("id", id);

    if (!error) {
      setMessages(messages.map((m) => m.id === id ? { ...m, status: status as StudioMessage["status"] } : m));
      if (selectedMessage?.id === id) {
        setSelectedMessage({ ...selectedMessage, status: status as StudioMessage["status"] });
      }
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "bug": return <Bug className="w-4 h-4 text-accent" />;
      case "feature": return <Lightbulb className="w-4 h-4 text-yellow-400" />;
      case "billing": return <CreditCard className="w-4 h-4 text-blue-400" />;
      default: return <AlertCircle className="w-4 h-4 text-zinc-400" />;
    }
  };

  const filteredMessages = filter === "all"
    ? messages
    : messages.filter((m) => m.status === filter);

  const unreadCount = messages.filter((m) => !m.read_by_admin).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">{t("admin.messages.title")}</h1>
        <p className="text-sm text-zinc-400">{unreadCount} {t("admin.messages.unread")}</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["all", "new", "in_progress", "resolved", "closed"].map((f) => (
          <Button
            key={f}
            variant={filter === f ? "primary" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f === "all" ? t("admin.messages.all") : getStatusLabel(f, t)}
          </Button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3">
          {filteredMessages.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500">{t("admin.messages.empty")}</p>
            </div>
          ) : (
            filteredMessages.map((msg) => (
              <Card
                key={msg.id}
                className={`cursor-pointer transition-colors ${
                  selectedMessage?.id === msg.id ? "border-primary" : "hover:border-zinc-700"
                } ${!msg.read_by_admin ? "border-l-2 border-l-primary" : ""}`}
                onClick={() => setSelectedMessage(msg)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(msg.type)}
                      <span className="font-medium text-sm">{msg.studio?.name || t("admin.messages.studio")}</span>
                    </div>
                    <Badge className={getPriorityColor(msg.priority)}>
                      {getStatusLabel(msg.priority, t)}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium mb-1">{msg.subject}</p>
                  <p className="text-xs text-zinc-500 line-clamp-2">{msg.message}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-zinc-600">{formatDate(msg.created_at)}</p>
                    <Badge className={getStatusColor(msg.status)}>
                      {getStatusLabel(msg.status, t)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="lg:col-span-2">
          {selectedMessage ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold">{selectedMessage.subject}</h2>
                    <p className="text-sm text-zinc-400">
                      {selectedMessage.studio?.name} • {formatDate(selectedMessage.created_at)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {selectedMessage.status === "new" && (
                      <Button size="sm" onClick={() => updateStatus(selectedMessage.id, "in_progress")}>
                        {t("admin.messages.to_work")}
                      </Button>
                    )}
                    {selectedMessage.status === "in_progress" && (
                      <Button size="sm" onClick={() => updateStatus(selectedMessage.id, "resolved")}>
                        {t("admin.messages.resolved_btn")}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="mb-6 p-4 rounded-xl bg-zinc-800/50">
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>

                <div className="space-y-4 mb-6">
                  <h3 className="font-medium text-sm text-zinc-400">{t("admin.messages.replies")} ({selectedMessage.replies?.length || 0})</h3>
                  {selectedMessage.replies?.map((reply) => (
                    <div
                      key={reply.id}
                      className={`p-4 rounded-xl ${
                        reply.is_admin ? "bg-primary/10 border border-primary/20" : "bg-zinc-800/50"
                      }`}
                    >
                      <p className="text-sm text-zinc-300 whitespace-pre-wrap">{reply.content}</p>
                      <p className="text-xs text-zinc-500 mt-2">
                        {reply.is_admin ? "Quvex" : selectedMessage.studio?.name} • {formatDate(reply.created_at)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder={t("admin.messages.reply_placeholder")}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleReply} disabled={!reply.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <MessageSquare className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-500">{t("admin.messages.select")}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
