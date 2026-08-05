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
import { getStatusColor, formatDate, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import type { StudioClient, StudioAppointment, StudioService } from "@/types";

export default function StudioClientDetailPage() {
  const params = useParams<{ slug: string; id: string }>();
  const router = useRouter();
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
      toast.error("Ошибка при сохранении");
    } else {
      toast.success("Клиент обновлен");
      setEditing(false);
      setClient({ ...client!, ...form, status: form.status as StudioClient["status"], car_year: form.car_year ? parseInt(form.car_year) : null });
    }
  };

  const handleDelete = async () => {
    if (!confirm("Вы уверены, что хотите удалить клиента?")) return;

    const { error } = await supabase.current
      .from("studio_clients")
      .delete()
      .eq("id", params.id);

    if (error) {
      toast.error("Ошибка при удалении");
    } else {
      toast.success("Клиент удален");
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
        <p className="text-zinc-500">Клиент не найден</p>
        <Link href={`/studio/${params.slug}/clients`} className="text-sm text-primary hover:underline mt-2 inline-block">
          ← К списку клиентов
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
                {client.status === "new" ? "Новый" : client.status === "regular" ? "Постоянный" : client.status === "vip" ? "VIP" : "Неактивный"}
              </Badge>
            </div>
            <p className="text-sm text-zinc-400">
              {client.car_make} {client.car_model}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditing(!editing)}>
            <Edit className="w-4 h-4" /> {editing ? "Отмена" : "Редактировать"}
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            <Trash2 className="w-4 h-4" /> Удалить
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Информация о клиенте</CardTitle>
                {editing && <Button onClick={handleSave}>Сохранить</Button>}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {editing ? (
                <>
                  <Input label="Имя" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Телефон" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                    <Input label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <Select
                    label="Статус"
                    value={form.status}
                    onChange={(value) => setForm({ ...form, status: value })}
                    options={[
                      { value: "new", label: "Новый" },
                      { value: "regular", label: "Постоянный" },
                      { value: "vip", label: "VIP" },
                      { value: "inactive", label: "Неактивный" },
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
                      <span className="text-zinc-300">Создан: {formatDate(client.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <DollarSign className="w-4 h-4 text-zinc-500" />
                      <span className="text-zinc-300">Потрачено: {formatCurrency(client.total_spent)}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Автомобиль</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {editing ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Марка" value={form.car_make} onChange={(e) => setForm({ ...form, car_make: e.target.value })} />
                    <Input label="Модель" value={form.car_model} onChange={(e) => setForm({ ...form, car_model: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <Input label="Год" type="number" value={form.car_year} onChange={(e) => setForm({ ...form, car_year: e.target.value })} />
                    <Input label="Цвет" value={form.car_color} onChange={(e) => setForm({ ...form, car_color: e.target.value })} />
                    <Input label="Гос. номер" value={form.license_plate} onChange={(e) => setForm({ ...form, license_plate: e.target.value })} />
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
                        <span className="text-zinc-300">{client.car_year} год</span>
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
                        <span className="text-zinc-500">Номер:</span>
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
              <CardTitle>Заметки</CardTitle>
            </CardHeader>
            <CardContent>
              {editing ? (
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={4}
                  placeholder="Заметки о клиенте..."
                />
              ) : (
                <p className="text-sm text-zinc-300 leading-relaxed">{client.notes || "Нет заметок"}</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Статистика</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Визитов</span>
                <span className="text-lg font-bold">{client.total_visits}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Потрачено</span>
                <span className="text-lg font-bold">{formatCurrency(client.total_spent)}</span>
              </div>
              {client.last_visit && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Последний визит</span>
                  <span className="text-sm">{formatDate(client.last_visit)}</span>
                </div>
              )}
              {client.next_visit && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Следующий визит</span>
                  <span className="text-sm text-primary">{formatDate(client.next_visit)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Последние визиты</CardTitle>
            </CardHeader>
            <CardContent>
              {appointments.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-4">Нет визитов</p>
              ) : (
                <div className="space-y-3">
                  {appointments.map((apt) => (
                    <div key={apt.id} className="p-3 rounded-xl bg-zinc-800/50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{apt.studio_services?.name || "Услуга"}</span>
                        <Badge className={getStatusColor(apt.status)}>
                          {apt.status === "completed" ? "Выполнено" : apt.status === "scheduled" ? "Запланировано" : apt.status}
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
              <CardTitle>Быстрые действия</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <a href={`tel:${client.phone}`}>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Phone className="w-4 h-4" /> Позвонить
                </Button>
              </a>
              <a href={`mailto:${client.email}`}>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Mail className="w-4 h-4" /> Написать
                </Button>
              </a>
              <Link href={`/studio/${params.slug}/appointments/new?client=${client.id}`}>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Calendar className="w-4 h-4" /> Записать на визит
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
