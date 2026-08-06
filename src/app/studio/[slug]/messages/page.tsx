"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Send, MessageSquare, AlertCircle, Bug, Lightbulb, CreditCard } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { formatDate, getStatusColor, getPriorityColor, getStatusLabel } from "@/lib/utils";
import { toast } from "sonner";
import { useT } from "@/i18n/I18nProvider";
import type { StudioMessage } from "@/types";

export default function StudioMessagesPage() {
  const params = useParams<{ slug: string }>();
  const { t } = useT();
  const [messages, setMessages] = useState<StudioMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<StudioMessage | null>(null);
  const [reply, setReply] = useState("");
  const [form, setForm] = useState({
    subject: "",
    message: "",
    type: "support",
    priority: "normal",
  });
  const supabase = useRef(createClient());

  const fetchMessages = async () => {
    const { data: studio } = await supabase.current
      .from("studios")
      .select("id")
      .eq("slug", params.slug)
      .single();

    if (!studio) return;

    const { data } = await supabase.current
      .from("studio_messages")
      .select("*, message_replies(*)")
      .eq("studio_id", studio.id)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.slug]);

  const handleSend = async () => {
    const { data: studio } = await supabase.current
      .from("studios")
      .select("id")
      .eq("slug", params.slug)
      .single();

    if (!studio) return;

    const { error } = await supabase.current.from("studio_messages").insert({
      studio_id: studio.id,
      subject: form.subject,
      message: form.message,
      type: form.type,
      priority: form.priority,
    });

    if (error) {
      toast.error(t("common.message_send_error"));
    } else {
      toast.success(t("common.message_sent"));
      setShowForm(false);
      setForm({ subject: "", message: "", type: "support", priority: "normal" });
      fetchMessages();
    }
  };

  const handleReply = async () => {
    if (!selectedMessage || !reply.trim()) return;

    const { error } = await supabase.current.from("message_replies").insert({
      message_id: selectedMessage.id,
      content: reply,
      is_admin: false,
    });

    if (error) {
      toast.error(t("common.reply_send_error"));
    } else {
      toast.success(t("common.reply_sent"));
      setReply("");
      fetchMessages();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">{t("studio.messages.title")}</h1>
          <p className="text-sm text-zinc-400">{t("studio.messages.subtitle")}</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <MessageSquare className="w-4 h-4" /> {t("studio.messages.write")}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-medium mb-4">{t("studio.messages.new_title")}</h3>
            <div className="space-y-4">
              <Input
                label={`${t("studio.messages.subject")} *`}
                placeholder={t("studio.messages.subject_placeholder")}
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label={t("studio.messages.type")}
                  value={form.type}
                  onChange={(value) => setForm({ ...form, type: value })}
                  options={[
                    { value: "support", label: t("message_type.support") },
                    { value: "bug", label: t("message_type.bug") },
                    { value: "feature", label: t("message_type.feature") },
                    { value: "billing", label: t("message_type.billing") },
                    { value: "other", label: t("message_type.other") },
                  ]}
                />
                <Select
                  label={t("studio.messages.priority")}
                  value={form.priority}
                  onChange={(value) => setForm({ ...form, priority: value })}
                  options={[
                    { value: "low", label: t("priority.low") },
                    { value: "normal", label: t("priority.normal") },
                    { value: "high", label: t("priority.high") },
                    { value: "urgent", label: t("priority.urgent") },
                  ]}
                />
              </div>
              <Textarea
                label={`${t("studio.messages.message")} *`}
                placeholder={t("studio.messages.message_placeholder")}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={5}
              />
              <div className="flex gap-2">
                <Button onClick={handleSend}>{t("studio.messages.send")}</Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>{t("studio.messages.cancel")}</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500">{t("studio.messages.empty")}</p>
            </div>
          ) : (
            messages.map((msg) => (
              <Card
                key={msg.id}
                className={`cursor-pointer transition-colors ${
                  selectedMessage?.id === msg.id ? "border-primary" : "hover:border-zinc-700"
                }`}
                onClick={() => setSelectedMessage(msg)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(msg.type)}
                      <span className="font-medium text-sm">{msg.subject}</span>
                    </div>
                    <Badge className={getStatusColor(msg.status)}>
                      {getStatusLabel(msg.status, t)}
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-500 line-clamp-2">{msg.message}</p>
                  <p className="text-xs text-zinc-600 mt-2">{formatDate(msg.created_at)}</p>
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
                      {formatDate(selectedMessage.created_at)} • {t(`message_type.${selectedMessage.type}`)}
                    </p>
                  </div>
                  <Badge className={getPriorityColor(selectedMessage.priority)}>
                    {getStatusLabel(selectedMessage.priority, t)}
                  </Badge>
                </div>

                <div className="mb-6 p-4 rounded-xl bg-zinc-800/50">
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>

                <div className="space-y-4 mb-6">
                  <h3 className="font-medium text-sm text-zinc-400">{t("studio.messages.replies")} ({selectedMessage.replies?.length || 0})</h3>
                  {selectedMessage.replies?.map((reply) => (
                    <div
                      key={reply.id}
                      className={`p-4 rounded-xl ${
                        reply.is_admin ? "bg-primary/10 border border-primary/20" : "bg-zinc-800/50"
                      }`}
                    >
                      <p className="text-sm text-zinc-300 whitespace-pre-wrap">{reply.content}</p>
                      <p className="text-xs text-zinc-500 mt-2">
                        {reply.is_admin ? "Quvex" : t("studio.messages.you")} • {formatDate(reply.created_at)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder={t("studio.messages.reply_placeholder")}
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
                <p className="text-zinc-500">{t("studio.messages.select")}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
