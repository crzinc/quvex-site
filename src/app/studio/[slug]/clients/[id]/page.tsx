"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, Car, Calendar, DollarSign, Edit, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { getStatusColor, getStatusLabel, formatDate, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { useT } from "@/i18n/I18nProvider";
import { CAR_MAKES_LIST, getCarModels } from "@/lib/car-data";
import type { StudioClient, StudioAppointment, StudioService } from "@/types";

export default function StudioClientDetailPage() {
  const params = useParams<{ slug: string; id: string }>();
  const router = useRouter();
  const { t } = useT();
  const [client, setClient] = useState<StudioClient | null>(null);
  const [appointments, setAppointments] = useState<(StudioAppointment & { studio_services?: StudioService })[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    car_make: "",
    car_model: "",
    car_year: "",
    car_color: "",
    car_vin: "",
    license_plate: "",
    notes: "",
    status: "",
  });
  const supabase = useRef(createClient());

  useEffect(() => {
    const fetchData = async () => {
      const { data: clientData } = await supabase.current
        .from("studio_clients")
        .select("*")
        .eq("id", params.id)
        .single();

      if (clientData) {
        setClient(clientData);
        setForm({
          name: clientData.name,
          phone: clientData.phone,
          email: clientData.email,
          car_make: clientData.car_make,
          car_model: clientData.car_model,
          car_year: clientData.car_year?.toString() || "",
          car_color: clientData.car_color,
          car_vin: clientData.car_vin,
          license_plate: clientData.license_plate,
          notes: clientData.notes,
          status: clientData.status,
        });

        const { data: appointmentsData } = await supabase.current
          .from("studio_appointments")
          .select("*, studio_services(*)")
          .eq("client_id", params.id)
          .order("scheduled_at", { ascending: false })
          .limit(10);

        if (appointmentsData) setAppointments(appointmentsData);
      }
      setLoading(false);
    };

    fetchData();
  }, [params.id]);

  const handleSave = async () => {
    const { error } = await supabase.current
      .from("studio_clients")
      .update({
        name: form.name,
        phone: form.phone,
        email: form.email,
        car_make: form.car_make,
        car_model: form.car_model,
        car_year: form.car_year ? parseInt(form.car_year) : null,
        car_color: form.car_color,
        car_vin: form.car_vin,
        license_plate: form.license_plate,
        notes: form.notes,
        status: form.status,
      })
      .eq("id", params.id);

    if (error) {
      toast.error(t("common.save_error"));
    } else {
      toast.success(t("common.updated"));
      setEditing(false);
      setClient({ ...client!, ...form, status: form.status as StudioClient["status"], car_year: form.car_year ? parseInt(form.car_year) : null });
    }
  };

  const handleDelete = async () => {
    if (!confirm(t("common.confirm_delete"))) return;

    const { error } = await supabase.current
      .from("studio_clients")
      .delete()
      .eq("id", params.id);

    if (error) {
      toast.error(t("common.delete_error"));
    } else {
      toast.success(t("common.deleted"));
      router.push(`/studio/${params.slug}/clients`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-20">
        <p className="text-zinc-500">{t("studio.client.not_found")}</p>
        <Link href={`/studio/${params.slug}/clients`} className="text-sm text-primary hover:underline mt-2 inline-block">
          ← {t("studio.client.back_to_list")}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/studio/${params.slug}/clients`} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{client.name}</h1>
              <Badge className={getStatusColor(client.status)}>
                {getStatusLabel(client.status, t)}
              </Badge>
            </div>
            <p className="text-sm text-zinc-400">
              {client.car_make} {client.car_model}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditing(!editing)}>
            <Edit className="w-4 h-4" /> {editing ? t("studio.client.cancel") : t("studio.client.detail_edit")}
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            <Trash2 className="w-4 h-4" /> {t("studio.client.delete")}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t("studio.client.info_title")}</CardTitle>
                {editing && <Button onClick={handleSave}>{t("studio.client.detail_save")}</Button>}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {editing ? (
                <>
                  <Input label={t("studio.client.name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  <div className="grid grid-cols-2 gap-4">
                    <Input label={t("studio.clients.phone")} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                    <Input label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <Select
                    label={t("studio.client.status")}
                    value={form.status}
                    onChange={(value) => setForm({ ...form, status: value })}
                    options={[
                      { value: "new", label: t("status.new") },
                      { value: "regular", label: t("status.regular") },
                      { value: "vip", label: t("status.vip") },
                      { value: "inactive", label: t("status.inactive") },
                    ]}
                  />
                </>
              ) : (
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="w-4 h-4 text-zinc-500" />
                      <span className="text-zinc-300">{client.phone || "—"}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="w-4 h-4 text-zinc-500" />
                      <span className="text-zinc-300">{client.email || "—"}</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="w-4 h-4 text-zinc-500" />
                      <span className="text-zinc-300">{t("studio.client.created")}: {formatDate(client.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <DollarSign className="w-4 h-4 text-zinc-500" />
                      <span className="text-zinc-300">{t("studio.client.spent")}: {formatCurrency(client.total_spent)}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("studio.client.car_title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {editing ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <Combobox
                      label={t("studio.client.make")}
                      options={CAR_MAKES_LIST}
                      value={form.car_make}
                      onChange={(value) => setForm({ ...form, car_make: value, car_model: "" })}
                    />
                    <Combobox
                      label={t("studio.client.model")}
                      options={getCarModels(form.car_make)}
                      value={form.car_model}
                      onChange={(value) => setForm({ ...form, car_model: value })}
                      disabled={!form.car_make}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <Input label={t("studio.client.year")} type="number" value={form.car_year} onChange={(e) => setForm({ ...form, car_year: e.target.value })} />
                    <Input label={t("studio.client.color")} value={form.car_color} onChange={(e) => setForm({ ...form, car_color: e.target.value })} />
                    <Input label={t("studio.client.plate")} value={form.license_plate} onChange={(e) => setForm({ ...form, license_plate: e.target.value.toUpperCase() })} className="uppercase" />
                  </div>
                  <Input label="VIN" value={form.car_vin} onChange={(e) => setForm({ ...form, car_vin: e.target.value })} />
                </>
              ) : (
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-sm">
                      <Car className="w-4 h-4 text-zinc-500" />
                      <span className="text-zinc-300">{client.car_make} {client.car_model}</span>
                    </div>
                    {client.car_year && (
                      <div className="flex items-center gap-3 text-sm">
                        <Calendar className="w-4 h-4 text-zinc-500" />
                        <span className="text-zinc-300">{client.car_year} {t("studio.client.car_year")}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    {client.car_color && (
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-4 h-4 rounded-full bg-zinc-500" style={{ backgroundColor: client.car_color }} />
                        <span className="text-zinc-300">{client.car_color}</span>
                      </div>
                    )}
                    {client.license_plate && (
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-zinc-500">{t("studio.client.plate_label")}:</span>
                        <span className="text-zinc-300 font-mono">{client.license_plate}</span>
                      </div>
                    )}
                    {client.car_vin && (
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-zinc-500">VIN:</span>
                        <span className="text-zinc-300 font-mono text-xs">{client.car_vin}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("studio.client.notes_title")}</CardTitle>
            </CardHeader>
            <CardContent>
              {editing ? (
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={4}
                  placeholder={t("studio.client.notes_placeholder")}
                />
              ) : (
                <p className="text-sm text-zinc-300 leading-relaxed">{client.notes || t("studio.client.no_notes")}</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("studio.client.stats_title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">{t("studio.client.visits")}</span>
                <span className="text-lg font-bold">{client.total_visits}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">{t("studio.client.spent")}</span>
                <span className="text-lg font-bold">{formatCurrency(client.total_spent)}</span>
              </div>
              {client.last_visit && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">{t("studio.client.last_visit")}</span>
                  <span className="text-sm">{formatDate(client.last_visit)}</span>
                </div>
              )}
              {client.next_visit && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">{t("studio.client.next_visit")}</span>
                  <span className="text-sm text-primary">{formatDate(client.next_visit)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("studio.client.recent_visits")}</CardTitle>
            </CardHeader>
            <CardContent>
              {appointments.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-4">{t("studio.client.no_visits")}</p>
              ) : (
                <div className="space-y-3">
                  {appointments.map((apt) => (
                    <div key={apt.id} className="p-3 rounded-xl bg-zinc-800/50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{apt.studio_services?.name || t("studio.appointments.service")}</span>
                        <Badge className={getStatusColor(apt.status)}>
                          {getStatusLabel(apt.status, t)}
                        </Badge>
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">{formatDate(apt.scheduled_at)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("studio.client.quick_actions")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <a href={`tel:${client.phone}`}>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Phone className="w-4 h-4" /> {t("studio.client.call")}
                </Button>
              </a>
              <a href={`mailto:${client.email}`}>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Mail className="w-4 h-4" /> {t("studio.client.write")}
                </Button>
              </a>
              <Link href={`/studio/${params.slug}/appointments/new?client=${client.id}`}>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Calendar className="w-4 h-4" /> {t("studio.client.book_visit")}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
