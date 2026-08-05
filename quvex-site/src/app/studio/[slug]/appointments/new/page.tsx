"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

function NewAppointmentForm({ slug }: { slug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClient = searchParams.get("client") || "";
  const supabase = useRef(createClient());
  const [clients, setClients] = useState<{ id: string; name: string; phone: string }[]>([]);
  const [services, setServices] = useState<{ id: string; name: string; price: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    client_id: "",
    service_id: "",
    scheduled_at: "",
    notes: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      const { data: studio } = await supabase.current
        .from("studios")
        .select("id")
        .eq("slug", slug)
        .single();

      if (!studio) return;

      const [clientsResult, servicesResult] = await Promise.all([
        supabase.current
          .from("studio_clients")
          .select("id, name, phone")
          .eq("studio_id", studio.id)
          .order("name"),
        supabase.current
          .from("studio_services")
          .select("id, name, price")
          .eq("studio_id", studio.id)
          .eq("is_active", true)
          .order("name"),
      ]);

      if (clientsResult.data) setClients(clientsResult.data);
      if (servicesResult.data) setServices(servicesResult.data);
      setForm((f) => ({ ...f, client_id: preselectedClient || f.client_id }));
      setLoading(false);
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const handleCreate = async () => {
    if (!form.client_id || !form.scheduled_at) {
      toast.error("Укажите клиента и дату");
      return;
    }

    setSaving(true);

    const { data: studio } = await supabase.current
      .from("studios")
      .select("id")
      .eq("slug", slug)
      .single();

    if (!studio) return;

    const service = services.find((s) => s.id === form.service_id);
    const { error } = await supabase.current.from("studio_appointments").insert({
      studio_id: studio.id,
      client_id: form.client_id,
      service_id: form.service_id || null,
      scheduled_at: form.scheduled_at,
      price: service?.price || 0,
      final_price: service?.price || 0,
      notes: form.notes,
    });

    if (error) {
      toast.error("Ошибка при создании записи");
    } else {
      toast.success("Запись создана");
      router.push(`/studio/${slug}/appointments`);
      router.refresh();
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Новая запись
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select
          label="Клиент *"
          value={form.client_id}
          onChange={(value) => setForm({ ...form, client_id: value })}
          options={clients.map((c) => ({ value: c.id, label: `${c.name} (${c.phone || "без телефона"})` }))}
        />
        <Select
          label="Услуга"
          value={form.service_id}
          onChange={(value) => setForm({ ...form, service_id: value })}
          options={services.map((s) => ({ value: s.id, label: `${s.name} — ${formatCurrency(s.price)}` }))}
        />
        <Input
          label="Дата и время *"
          type="datetime-local"
          value={form.scheduled_at}
          onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
        />
        <Textarea
          label="Заметки"
          placeholder="Дополнительная информация..."
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={3}
        />
        <div className="flex gap-2">
          <Button onClick={handleCreate} loading={saving}>Создать запись</Button>
          <Link href={`/studio/${slug}/appointments`}>
            <Button variant="outline">Отмена</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function StudioNewAppointmentPage() {
  const params = useParams<{ slug: string }>();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/studio/${params.slug}/appointments`} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Новая запись</h1>
          <p className="text-sm text-zinc-400">Записать клиента на обслуживание</p>
        </div>
      </div>

      <Suspense fallback={<div className="flex items-center justify-center min-h-[40vh]"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
        <NewAppointmentForm slug={params.slug} />
      </Suspense>
    </div>
  );
}
