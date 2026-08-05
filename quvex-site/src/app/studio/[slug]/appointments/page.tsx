"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Plus, Calendar, Clock, CheckCircle, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatDate, formatCurrency, getStatusColor } from "@/lib/utils";
import { toast } from "sonner";
import type { StudioAppointment } from "@/types";

export default function StudioAppointmentsPage() {
  const params = useParams<{ slug: string }>();
  const [appointments, setAppointments] = useState<(StudioAppointment & { studio_clients?: { name: string; phone: string }; studio_services?: { name: string; price: number } })[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string; phone: string }[]>([]);
  const [services, setServices] = useState<{ id: string; name: string; price: number; duration_minutes: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    client_id: "",
    service_id: "",
    scheduled_at: "",
    notes: "",
  });
  const supabase = useRef(createClient());

  const fetchData = async () => {
    const { data: studio } = await supabase.current
      .from("studios")
      .select("id")
      .eq("slug", params.slug)
      .single();

    if (!studio) return;

    const [appointmentsResult, clientsResult, servicesResult] = await Promise.all([
      supabase.current
        .from("studio_appointments")
        .select("*, studio_clients(name, phone), studio_services(name, price)")
        .eq("studio_id", studio.id)
        .order("scheduled_at", { ascending: false }),
      supabase.current
        .from("studio_clients")
        .select("id, name, phone")
        .eq("studio_id", studio.id)
        .order("name"),
      supabase.current
        .from("studio_services")
        .select("id, name, price, duration_minutes")
        .eq("studio_id", studio.id)
        .eq("is_active", true)
        .order("name"),
    ]);

    if (appointmentsResult.data) setAppointments(appointmentsResult.data);
    if (clientsResult.data) setClients(clientsResult.data);
    if (servicesResult.data) setServices(servicesResult.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.slug]);

  const handleCreate = async () => {
    const { data: studio } = await supabase.current
      .from("studios")
      .select("id")
      .eq("slug", params.slug)
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
      setShowForm(false);
      setForm({ client_id: "", service_id: "", scheduled_at: "", notes: "" });
      fetchData();
    }
  };

  const updateStatus = async (id: string, status: string) => {
    if (status === "completed") {
      const { data: apt } = await supabase.current
        .from("studio_appointments")
        .select("id, studio_id, client_id, final_price")
        .eq("id", id)
        .single();

      if (apt) {
        const { error: txError } = await supabase.current.from("studio_transactions").insert({
          studio_id: apt.studio_id,
          appointment_id: apt.id,
          client_id: apt.client_id,
          type: "income",
          amount: Number(apt.final_price) || 0,
          category: "service",
          payment_method: "cash",
          description: "Выполненная запись",
        });

        if (txError) console.error("Transaction insert error:", txError.message);

        if (apt.client_id) {
          const { data: client } = await supabase.current
            .from("studio_clients")
            .select("total_visits, total_spent")
            .eq("id", apt.client_id)
            .single();

          if (client) {
            await supabase.current
              .from("studio_clients")
              .update({
                total_visits: (client.total_visits || 0) + 1,
                total_spent: Number(client.total_spent || 0) + (Number(apt.final_price) || 0),
                last_visit: new Date().toISOString().slice(0, 10),
              })
              .eq("id", apt.client_id);
          }
        }
      }
    }

    const { error } = await supabase.current
      .from("studio_appointments")
      .update({ status, completed_at: status === "completed" ? new Date().toISOString() : null })
      .eq("id", id);

    if (error) {
      toast.error("Ошибка при обновлении");
    } else {
      toast.success("Статус обновлен");
      fetchData();
    }
  };

  const filteredAppointments = filter === "all"
    ? appointments
    : appointments.filter((a) => a.status === filter);

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
          <h1 className="text-2xl font-bold mb-1">Записи</h1>
          <p className="text-sm text-zinc-400">{appointments.length} записей</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4" /> Новая запись
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-medium mb-4">Новая запись</h3>
            <div className="space-y-4">
              <Select
                label="Клиент *"
                value={form.client_id}
                onChange={(value) => setForm({ ...form, client_id: value })}
                options={clients.map((c) => ({ value: c.id, label: `${c.name} (${c.phone})` }))}
              />
              <Select
                label="Услуга"
                value={form.service_id}
                onChange={(value) => setForm({ ...form, service_id: value })}
                options={services.map((s) => ({ value: s.id, label: `${s.name} - ${formatCurrency(s.price)}` }))}
              />
              <Input
                label="Дата и время *"
                type="datetime-local"
                value={form.scheduled_at}
                onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
              />
              <Input
                label="Заметки"
                placeholder="Дополнительная информация..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
              <div className="flex gap-2">
                <Button onClick={handleCreate}>Создать</Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Отмена</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2 flex-wrap">
        {["all", "scheduled", "in_progress", "completed", "cancelled"].map((f) => (
          <Button
            key={f}
            variant={filter === f ? "primary" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "Все" : f === "scheduled" ? "Запланировано" : f === "in_progress" ? "В работе" : f === "completed" ? "Выполнено" : "Отменено"}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {filteredAppointments.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500">Нет записей</p>
          </div>
        ) : (
          filteredAppointments.map((apt) => (
            <Card key={apt.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-zinc-800">
                      <Calendar className="w-5 h-5 text-zinc-400" />
                    </div>
                    <div>
                      <p className="font-medium">{apt.studio_clients?.name || "Клиент"}</p>
                      <p className="text-sm text-zinc-400">
                        {apt.studio_services?.name || "Услуга"} • {formatCurrency(apt.final_price)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatDate(apt.scheduled_at)}</p>
                      <p className="text-xs text-zinc-500">{apt.studio_clients?.phone}</p>
                    </div>
                    <Badge className={getStatusColor(apt.status)}>
                      {apt.status === "scheduled" ? "Запланировано" : apt.status === "in_progress" ? "В работе" : apt.status === "completed" ? "Выполнено" : "Отменено"}
                    </Badge>
                    <div className="flex gap-1">
                      {apt.status === "scheduled" && (
                        <Button variant="ghost" size="sm" onClick={() => updateStatus(apt.id, "in_progress")}>
                          <Clock className="w-4 h-4 text-yellow-400" />
                        </Button>
                      )}
                      {apt.status === "in_progress" && (
                        <Button variant="ghost" size="sm" onClick={() => updateStatus(apt.id, "completed")}>
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        </Button>
                      )}
                      {(apt.status === "scheduled" || apt.status === "in_progress") && (
                        <Button variant="ghost" size="sm" onClick={() => updateStatus(apt.id, "cancelled")}>
                          <XCircle className="w-4 h-4 text-accent" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
