"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Link from "next/link";
import { useT } from "@/i18n/I18nProvider";

const statusOptions = [
  { value: "lead", label: "status.lead" },
  { value: "negotiation", label: "status.negotiation" },
  { value: "development", label: "status.development" },
  { value: "completed", label: "status.completed" },
  { value: "support", label: "status.support" },
];

export default function NewClientPage() {
  const router = useRouter();
  const supabase = createClient();
  const { t } = useT();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", company: "", status: "lead",
    budget: 0, description: "", source: "", next_action: "", next_action_date: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error(t("common.auth_error")); setLoading(false); return; }

    const { data, error } = await supabase.from("clients").insert({
      ...form,
      assigned_to: user.id,
    }).select().single();

    if (error) { toast.error(error.message); setLoading(false); return; }
    toast.success(t("common.saved"));
    router.push(`/dashboard/clients/${data.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/clients" className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{t("clients.add_btn")}</h1>
          <p className="text-sm text-zinc-400">{t("clients.title").toLowerCase()}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader><CardTitle>{t("client.info_title")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label={t("form.name")} placeholder={t("form.name_placeholder")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <Input label={t("form.email")} type="email" placeholder={t("form.email_placeholder")} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label={t("form.phone")} placeholder={t("form.phone_placeholder")} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <Input label={t("form.company")} placeholder={t("form.company_placeholder")} value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Select label={t("clients.table_status")} options={statusOptions.map(o => ({ ...o, label: t(o.label) }))} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} />
              <Input label={t("form.budget")} type="number" placeholder="5000" value={form.budget || ""} onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })} />
            </div>
            <Input label={t("form.source")} placeholder={t("form.source_placeholder")} value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} />
            <Textarea label={t("form.description")} placeholder={t("form.description_placeholder")} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label={t("form.next_action")} placeholder={t("form.next_action_placeholder")} value={form.next_action} onChange={(e) => setForm({ ...form, next_action: e.target.value })} />
              <Input label={t("form.next_action_date")} type="date" value={form.next_action_date} onChange={(e) => setForm({ ...form, next_action_date: e.target.value })} />
            </div>
            <Button type="submit" size="lg" className="w-full mt-6" loading={loading}>
              <Save className="w-4 h-4" /> {t("form.save")}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
