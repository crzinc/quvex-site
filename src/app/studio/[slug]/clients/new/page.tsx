"use client";

import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function StudioNewClientPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const supabase = useRef(createClient());
  const [loading, setLoading] = useState(false);
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
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: studio } = await supabase.current
      .from("studios")
      .select("id")
      .eq("slug", params.slug)
      .single();

    if (!studio) {
      toast.error("Студия не найдена");
      setLoading(false);
      return;
    }

    const { error } = await supabase.current.from("studio_clients").insert({
      studio_id: studio.id,
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
      status: "new",
    });

    if (error) {
      toast.error("Ошибка при создании клиента");
    } else {
      toast.success("Клиент создан");
      router.push(`/studio/${params.slug}/clients`);
    }

    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/studio/${params.slug}/clients`} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Новый клиент</h1>
          <p className="text-sm text-zinc-400">Добавьте информацию о клиенте и его автомобиле</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Контактная информация</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Имя *"
              placeholder="Иван Иванов"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Телефон"
                type="tel"
                placeholder="+7 (999) 123-45-67"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <Input
                label="Email"
                type="email"
                placeholder="client@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Автомобиль</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Марка"
                placeholder="Toyota"
                value={form.car_make}
                onChange={(e) => setForm({ ...form, car_make: e.target.value })}
              />
              <Input
                label="Модель"
                placeholder="Camry"
                value={form.car_model}
                onChange={(e) => setForm({ ...form, car_model: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Год"
                type="number"
                placeholder="2020"
                value={form.car_year}
                onChange={(e) => setForm({ ...form, car_year: e.target.value })}
              />
              <Input
                label="Цвет"
                placeholder="Белый"
                value={form.car_color}
                onChange={(e) => setForm({ ...form, car_color: e.target.value })}
              />
              <Input
                label="Гос. номер"
                placeholder="А123БВ777"
                value={form.license_plate}
                onChange={(e) => setForm({ ...form, license_plate: e.target.value })}
              />
            </div>
            <Input
              label="VIN"
              placeholder="JTDKN3DU5A0123456"
              value={form.car_vin}
              onChange={(e) => setForm({ ...form, car_vin: e.target.value })}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Заметки</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Дополнительная информация о клиенте или его предпочтениях..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={4}
            />
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Link href={`/studio/${params.slug}/clients`}>
            <Button type="button" variant="outline">Отмена</Button>
          </Link>
          <Button type="submit" loading={loading}>Создать клиента</Button>
        </div>
      </form>
    </div>
  );
}
