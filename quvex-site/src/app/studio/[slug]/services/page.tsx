"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Plus, Edit, Trash2, Scissors } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { formatCurrency, getCategoryLabel } from "@/lib/utils";
import { toast } from "sonner";
import type { StudioService } from "@/types";

export default function StudioServicesPage() {
  const params = useParams<{ slug: string }>();
  const [services, setServices] = useState<StudioService[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    duration_minutes: "60",
    category: "detailing",
  });
  const supabase = useRef(createClient());

  const fetchServices = async () => {
    const { data: studio } = await supabase.current
      .from("studios")
      .select("id")
      .eq("slug", params.slug)
      .single();

    if (!studio) return;

    const { data } = await supabase.current
      .from("studio_services")
      .select("*")
      .eq("studio_id", studio.id)
      .order("sort_order", { ascending: true });

    if (data) setServices(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.slug]);

  const handleSave = async () => {
    const { data: studio } = await supabase.current
      .from("studios")
      .select("id")
      .eq("slug", params.slug)
      .single();

    if (!studio) return;

    const serviceData = {
      studio_id: studio.id,
      name: form.name,
      description: form.description,
      price: parseFloat(form.price) || 0,
      duration_minutes: parseInt(form.duration_minutes) || 60,
      category: form.category,
    };

    if (editingId) {
      const { error } = await supabase.current
        .from("studio_services")
        .update(serviceData)
        .eq("id", editingId);

      if (error) {
        toast.error("Ошибка при обновлении услуги");
      } else {
        toast.success("Услуга обновлена");
        resetForm();
        fetchServices();
      }
    } else {
      const { error } = await supabase.current.from("studio_services").insert(serviceData);

      if (error) {
        toast.error("Ошибка при создании услуги");
      } else {
        toast.success("Услуга создана");
        resetForm();
        fetchServices();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить услугу?")) return;

    const { error } = await supabase.current.from("studio_services").delete().eq("id", id);

    if (error) {
      toast.error("Ошибка при удалении");
    } else {
      toast.success("Услуга удалена");
      fetchServices();
    }
  };

  const resetForm = () => {
    setForm({ name: "", description: "", price: "", duration_minutes: "60", category: "detailing" });
    setShowForm(false);
    setEditingId(null);
  };

  const startEdit = (service: StudioService) => {
    setForm({
      name: service.name,
      description: service.description,
      price: service.price.toString(),
      duration_minutes: service.duration_minutes.toString(),
      category: service.category,
    });
    setEditingId(service.id);
    setShowForm(true);
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
          <h1 className="text-2xl font-bold mb-1">Услуги</h1>
          <p className="text-sm text-zinc-400">{services.length} услуг</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="w-4 h-4" /> Добавить услугу
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-medium mb-4">{editingId ? "Редактировать услугу" : "Новая услуга"}</h3>
            <div className="space-y-4">
              <Input
                label="Название *"
                placeholder="Полировка кузова"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <Textarea
                label="Описание"
                placeholder="Описание услуги..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Цена (₽) *"
                  type="number"
                  placeholder="5000"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
                <Input
                  label="Длительность (мин)"
                  type="number"
                  placeholder="60"
                  value={form.duration_minutes}
                  onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
                />
                <Select
                  label="Категория"
                  value={form.category}
                  onChange={(value) => setForm({ ...form, category: value })}
                  options={[
                    { value: "detailing", label: "Детейлинг" },
                    { value: "wash", label: "Мойка" },
                    { value: "protection", label: "Защита" },
                    { value: "interior", label: "Интерьер" },
                    { value: "exterior", label: "Экстерьер" },
                    { value: "other", label: "Другое" },
                  ]}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave}>{editingId ? "Сохранить" : "Создать"}</Button>
                <Button variant="outline" onClick={resetForm}>Отмена</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => (
          <Card key={service.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Scissors className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">{service.name}</h3>
                    <Badge className="text-xs">{getCategoryLabel(service.category)}</Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => startEdit(service)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(service.id)}>
                    <Trash2 className="w-4 h-4 text-accent" />
                  </Button>
                </div>
              </div>
              {service.description && (
                <p className="text-sm text-zinc-400 mb-4 line-clamp-2">{service.description}</p>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">{service.duration_minutes} мин</span>
                <span className="text-lg font-bold text-primary">{formatCurrency(service.price)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {services.length === 0 && !showForm && (
        <div className="text-center py-12">
          <Scissors className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-500">Нет услуг</p>
          <p className="text-sm text-zinc-600 mt-1">Добавьте первую услугу для вашего автодетейлинга</p>
        </div>
      )}
    </div>
  );
}
