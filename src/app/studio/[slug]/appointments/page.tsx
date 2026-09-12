"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Plus, Calendar, Search, Pencil, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatDateTime, formatCurrency, getStatusColor, getStatusLabel } from "@/lib/utils";
import { getCachedStudioId } from "@/lib/use-studio";
import { toast } from "sonner";
import { useT } from "@/i18n/I18nProvider";
import type { StudioAppointment } from "@/types";

type Apt = StudioAppointment & { studio_clients?: { name: string; phone: string }; studio_services?: { name: string; price: number } };

const emptyForm = { client_id: "", service_id: "", scheduled_at: "", notes: "", technician_name: "", payment_method: "cash" };

export default function StudioAppointmentsPage() {
  const params = useParams<{ slug: string }>();
  const { t } = useT();
  const [appointments, setAppointments] = useState<Apt[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string; phone: string }[]>([]);
  const [services, setServices] = useState<{ id: string; name: string; price: number; duration_minutes: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [filter, setFilter] = useState("all");
  const [dateTab, setDateTab] = useState("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const supabase = useRef(createClient());

  const fetchData = async () => {
    setLoadError("");
    const studioId = await getCachedStudioId(supabase.current, params.slug as string);

    if (!studioId) {
      setLoadError("Studio not found");
      setLoading(false);
      return;
    }

    const [appointmentsResult, clientsResult, servicesResult] = await Promise.all([
      supabase.current
        .from("studio_appointments")
        .select("id, client_id, service_id, scheduled_at, status, final_price, notes, technician_name, studio_clients(name, phone), studio_services(name, price)")
        .eq("studio_id", studioId)
        .order("scheduled_at", { ascending: false })
        .limit(100),
      supabase.current
        .from("studio_clients")
        .select("id, name, phone")
        .eq("studio_id", studioId)
        .order("name")
        .limit(200),
      supabase.current
        .from("studio_services")
        .select("id, name, price, duration_minutes")
        .eq("studio_id", studioId)
        .eq("is_active", true)
        .order("name")
        .limit(200),
    ]);

    if (appointmentsResult.error) setLoadError(appointmentsResult.error.message);
    else if (appointmentsResult.data) setAppointments(appointmentsResult.data as unknown as Apt[]);
    if (clientsResult.data) setClients(clientsResult.data);
    if (servicesResult.data) setServices(servicesResult.data);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.slug]);

  const hasOverlap = (scheduledAt: string, excludeId?: string | null) => {
    const target = new Date(scheduledAt).getTime();
    if (Number.isNaN(target)) return false;
    return appointments.some((a) => {
      if (excludeId && a.id === excludeId) return false;
      if (a.status === "cancelled") return false;
      const cur = new Date(a.scheduled_at).getTime();
      return Math.abs(cur - target) < 60 * 60 * 1000;
    });
  };

  const handleSave = async () => {
    if (!form.client_id || !form.scheduled_at) {
      toast.error(t("common.fill_client_date"));
      return;
    }
    if (hasOverlap(form.scheduled_at, editingId)) {
      toast.error(t("studio.appointments.overlap_error"));
      return;
    }
    const studioId = await getCachedStudioId(supabase.current, params.slug as string);
    if (!studioId) return;

    const service = services.find((s) => s.id === form.service_id);
    const payload = {
      studio_id: studioId,
      client_id: form.client_id,
      service_id: form.service_id || null,
      scheduled_at: form.scheduled_at,
      price: service?.price || 0,
      final_price: service?.price || 0,
      notes: form.notes,
      technician_name: form.technician_name,
    };

    if (editingId) {
      const { error } = await supabase.current.from("studio_appointments").update(payload).eq("id", editingId);
      if (error) toast.error(error.message);
      else {
        toast.success(t("common.status_updated"));
        setShowForm(false);
        setEditingId(null);
        setForm(emptyForm);
        fetchData();
      }
    } else {
      const { error } = await supabase.current.from("studio_appointments").insert(payload);
      if (error) toast.error(t("common.appointment_error"));
      else {
        toast.success(t("common.appointment_created"));
        setShowForm(false);
        setForm(emptyForm);
        fetchData();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("studio.appointments.delete_confirm"))) return;
    const { error } = await supabase.current.from("studio_appointments").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(t("common.deleted"));
      fetchData();
    }
  };

  const startEdit = (apt: Apt) => {
    setEditingId(apt.id);
    setForm({
      client_id: apt.client_id || "",
      service_id: apt.service_id || "",
      scheduled_at: apt.scheduled_at ? new Date(apt.scheduled_at).toISOString().slice(0, 16) : "",
      notes: apt.notes || "",
      technician_name: (apt as { technician_name?: string }).technician_name || "",
      payment_method: "cash",
    });
    setShowForm(true);
  };

  const updateStatus = async (id: string, status: string, paymentMethod = "cash") => {
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
        payment_method: paymentMethod,
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
      await supabase.current.from("studio_transactions").delete().eq("appointment_id", apt.id).eq("type", "income");
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

    if (error) toast.error(t("common.status_error"));
    else {
      toast.success(t("common.status_updated"));
      fetchData();
    }
  };

  const isToday = (d: string) => {
    const dt = new Date(d);
    const now = new Date();
    return dt.getFullYear() === now.getFullYear() && dt.getMonth() === now.getMonth() && dt.getDate() === now.getDate();
  };
  const isTomorrow = (d: string) => {
    const dt = new Date(d);
    const tmr = new Date();
    tmr.setDate(tmr.getDate() + 1);
    return dt.getFullYear() === tmr.getFullYear() && dt.getMonth() === tmr.getMonth() && dt.getDate() === tmr.getDate();
  };

  const filteredAppointments = appointments.filter((a) => {
    if (filter !== "all" && a.status !== filter) return false;
    if (dateTab === "today" && !isToday(a.scheduled_at)) return false;
    if (dateTab === "tomorrow" && !isTomorrow(a.scheduled_at)) return false;
    if (dateTab === "overdue" && !(new Date(a.scheduled_at) < new Date() && a.status === "scheduled")) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (a.studio_clients?.name || "").toLowerCase().includes(q) ||
      (a.studio_clients?.phone || "").toLowerCase().includes(q) ||
      (a.studio_services?.name || "").toLowerCase().includes(q) ||
      getStatusLabel(a.status, t).toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-2xl bg-zinc-900/50 border border-zinc-800 animate-pulse" />
        ))}
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-red-400 mb-4">{loadError}</p>
        <Button onClick={() => { setLoading(true); fetchData(); }}>{t("common.retry")}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold mb-1">{t("studio.appointments.title")}</h1>
          <p className="text-sm text-zinc-400">{appointments.length} {t("studio.appointments.count")}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/studio/${params.slug}/appointments/new`}>
            <Button variant="outline">{t("studio.appointments.new_page")}</Button>
          </Link>
          <Button onClick={() => { setEditingId(null); setForm(emptyForm); setShowForm(!showForm); }}>
            <Plus className="w-4 h-4" /> {t("studio.appointments.new")}
          </Button>
        </div>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-medium mb-4">{editingId ? t("studio.appointments.edit_title") : t("studio.appointments.new")}</h3>
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Select
                  label={`${t("studio.appointments.client")} *`}
                  value={form.client_id}
                  onChange={(value) => setForm({ ...form, client_id: value })}
                  options={clients.map((c) => ({ value: c.id, label: `${c.name} (${c.phone || t("studio.appointments.no_phone")})` }))}
                />
                <Select
                  label={t("studio.appointments.service")}
                  value={form.service_id}
                  onChange={(value) => setForm({ ...form, service_id: value })}
                  options={services.map((s) => ({ value: s.id, label: `${s.name} - ${formatCurrency(s.price)}` }))}
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label={`${t("studio.appointments.datetime")} *`}
                  type="datetime-local"
                  value={form.scheduled_at}
                  onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                />
                <Input
                  label={t("studio.appointments.technician")}
                  placeholder={t("studio.appointments.technician_placeholder")}
                  value={form.technician_name}
                  onChange={(e) => setForm({ ...form, technician_name: e.target.value })}
                />
              </div>
              <Input
                label={t("studio.appointments.notes")}
                placeholder={t("studio.appointments.notes_placeholder")}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
              <div className="flex gap-2">
                <Button onClick={handleSave}>{editingId ? t("studio.services.save") : t("studio.appointments.create")}</Button>
                <Button variant="outline" onClick={() => { setShowForm(false); setEditingId(null); }}>{t("studio.appointments.cancel")}</Button>
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
        {(["all", "today", "tomorrow", "overdue"] as const).map((d) => (
          <Button key={d} variant={dateTab === d ? "primary" : "outline"} size="sm" onClick={() => setDateTab(d)}>
            {t(`studio.appointments.date_${d}`)}
          </Button>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {["all", "scheduled", "in_progress", "completed", "cancelled", "no_show"].map((f) => (
          <Button key={f} variant={filter === f ? "primary" : "outline"} size="sm" onClick={() => setFilter(f)}>
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="p-2 rounded-lg bg-zinc-800 flex-shrink-0">
                      <Calendar className="w-5 h-5 text-zinc-400" />
                    </div>
                    <div className="min-w-0">
                      {apt.client_id && apt.studio_clients?.name ? (
                        <Link href={`/studio/${params.slug}/clients/${apt.client_id}`} className="font-medium hover:text-primary hover:underline transition-colors">
                          {apt.studio_clients.name}
                        </Link>
                      ) : (
                        <p className="font-medium">{t("studio.appointments.client")}</p>
                      )}
                      <p className="text-sm text-zinc-400 truncate">
                        {apt.studio_services?.name || t("studio.appointments.service")} • {formatCurrency(apt.final_price)}
                      </p>
                      {(apt as { technician_name?: string }).technician_name && (
                        <p className="text-xs text-zinc-500">{(apt as { technician_name?: string }).technician_name}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                    <div className="text-left sm:text-right">
                      <p className="text-sm font-medium whitespace-nowrap">{formatDateTime(apt.scheduled_at)}</p>
                      <p className="text-xs text-zinc-500">{apt.studio_clients?.phone}</p>
                    </div>
                    <Badge className={getStatusColor(apt.status)}>{getStatusLabel(apt.status, t)}</Badge>
                    <div className="w-36">
                      <Select
                        size="sm"
                        value={apt.status}
                        onChange={(value) => updateStatus(apt.id, value, form.payment_method)}
                        options={[
                          { value: "scheduled", label: t("appointment.scheduled") },
                          { value: "in_progress", label: t("appointment.in_progress") },
                          { value: "completed", label: t("appointment.completed") },
                          { value: "cancelled", label: t("appointment.cancelled") },
                          { value: "no_show", label: t("appointment.no_show") },
                        ]}
                      />
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => startEdit(apt)} aria-label="Edit">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(apt.id)} aria-label="Delete">
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
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
