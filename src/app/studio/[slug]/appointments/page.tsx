"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Plus, Calendar, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatDate, formatCurrency, getStatusColor, getStatusLabel } from "@/lib/utils";
import { toast } from "sonner";
import { useT } from "@/i18n/I18nProvider";
import type { StudioAppointment } from "@/types";

export default function StudioAppointmentsPage() {
  const params = useParams<{ slug: string }>();
  const { t } = useT();
  const [appointments, setAppointments] = useState<(StudioAppointment & { studio_clients?: { name: string; phone: string }; studio_services?: { name: string; price: number } })[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string; phone: string }[]>([]);
  const [services, setServices] = useState<{ id: string; name: string; price: number; duration_minutes: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
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
      toast.error(t("common.appointment_error"));
    } else {
      toast.success(t("common.appointment_created"));
      setShowForm(false);
      setForm({ client_id: "", service_id: "", scheduled_at: "", notes: "" });
      fetchData();
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const { data: apt } = await supabase.current
      .from("studio_appointments")
      .select("id, studio_id, client_id, final_price, status")
      .eq("id", id)
      .single();

    if (!apt) {
      toast.error(t("common.status_error"));
      return;
    }

    const previous = apt.status;
    const amount = Number(apt.final_price) || 0;

    if (status === "completed" && previous !== "completed") {
      const { error: txError } = await supabase.current.from("studio_transactions").insert({
        studio_id: apt.studio_id,
        appointment_id: apt.id,
        client_id: apt.client_id,
        type: "income",
        amount,
        category: "service",
        payment_method: "cash",
        description: t("common.completed_visit"),
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
              total_spent: Number(client.total_spent || 0) + amount,
              last_visit: new Date().toISOString().slice(0, 10),
            })
            .eq("id", apt.client_id);
        }
      }
    } else if (previous === "completed" && status !== "completed") {
      await supabase.current
        .from("studio_transactions")
        .delete()
        .eq("appointment_id", apt.id)
        .eq("type", "income");

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
              total_visits: Math.max((client.total_visits || 0) - 1, 0),
              total_spent: Math.max(Number(client.total_spent || 0) - amount, 0),
            })
            .eq("id", apt.client_id);
        }
      }
    }

    const { error } = await supabase.current
      .from("studio_appointments")
      .update({ status, completed_at: status === "completed" ? new Date().toISOString() : null })
      .eq("id", id);

    if (error) {
      toast.error(t("common.status_error"));
    } else {
      toast.success(t("common.status_updated"));
      fetchData();
    }
  };

  const filteredAppointments = appointments.filter((a) => {
    const matchesStatus = filter === "all" || a.status === filter;
    if (!matchesStatus) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (a.studio_clients?.name || "").toLowerCase().includes(q) ||
      (a.studio_clients?.phone || "").toLowerCase().includes(q) ||
      (a.studio_services?.name || "").toLowerCase().includes(q) ||
      a.status.toLowerCase().includes(q) ||
      getStatusLabel(a.status, t).toLowerCase().includes(q)
    );
  });

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
          <h1 className="text-2xl font-bold mb-1">{t("studio.appointments.title")}</h1>
          <p className="text-sm text-zinc-400">{appointments.length} {t("studio.appointments.count")}</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4" /> {t("studio.appointments.new")}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-medium mb-4">{t("studio.appointments.new")}</h3>
            <div className="space-y-4">
              <Select
                label={`${t("studio.appointments.client")} *`}
                value={form.client_id}
                onChange={(value) => setForm({ ...form, client_id: value })}
                options={clients.map((c) => ({ value: c.id, label: `${c.name} (${c.phone})` }))}
              />
              <Select
                label={t("studio.appointments.service")}
                value={form.service_id}
                onChange={(value) => setForm({ ...form, service_id: value })}
                options={services.map((s) => ({ value: s.id, label: `${s.name} - ${formatCurrency(s.price)}` }))}
              />
              <Input
                label={`${t("studio.appointments.datetime")} *`}
                type="datetime-local"
                value={form.scheduled_at}
                onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
              />
              <Input
                label={t("studio.appointments.notes")}
                placeholder={t("studio.appointments.notes_placeholder")}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
              <div className="flex gap-2">
                <Button onClick={handleCreate}>{t("studio.appointments.create")}</Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>{t("studio.appointments.cancel")}</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          placeholder={t("studio.appointments.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 transition-colors"
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        {["all", "scheduled", "in_progress", "completed", "cancelled", "no_show"].map((f) => (
          <Button
            key={f}
            variant={filter === f ? "primary" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f === "all" ? t("studio.appointments.all") : getStatusLabel(f, t)}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {filteredAppointments.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500">{search ? t("studio.list.no_results") : t("studio.appointments.empty")}</p>
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
                      {apt.client_id && apt.studio_clients?.name ? (
                        <Link
                          href={`/studio/${params.slug}/clients/${apt.client_id}`}
                          className="font-medium hover:text-primary hover:underline transition-colors"
                        >
                          {apt.studio_clients.name}
                        </Link>
                      ) : (
                        <p className="font-medium">{t("studio.appointments.client")}</p>
                      )}
                      <p className="text-sm text-zinc-400">
                        {apt.studio_services?.name || t("studio.appointments.service")} • {formatCurrency(apt.final_price)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatDate(apt.scheduled_at)}</p>
                      <p className="text-xs text-zinc-500">{apt.studio_clients?.phone}</p>
                    </div>
                    <Badge className={getStatusColor(apt.status)}>
                      {getStatusLabel(apt.status, t)}
                    </Badge>
                    <div className="w-36">
                      <Select
                        size="sm"
                        value={apt.status}
                        onChange={(value) => updateStatus(apt.id, value)}
                        options={[
                          { value: "scheduled", label: t("appointment.scheduled") },
                          { value: "in_progress", label: t("appointment.in_progress") },
                          { value: "completed", label: t("appointment.completed") },
                          { value: "cancelled", label: t("appointment.cancelled") },
                          { value: "no_show", label: t("appointment.no_show") },
                        ]}
                      />
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
