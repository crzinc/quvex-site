"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Settings, LogOut, Building, Palette, LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getStudioTheme, cn } from "@/lib/utils";
import { toast } from "sonner";

const THEME_PRESETS: { name: string; primary: string; primary_dark: string; primary_light: string }[] = [
  { name: "Фиолетовый", primary: "#a855f7", primary_dark: "#7c3aed", primary_light: "#c084fc" },
  { name: "Синий", primary: "#3b82f6", primary_dark: "#2563eb", primary_light: "#60a5fa" },
  { name: "Бирюзовый", primary: "#14b8a6", primary_dark: "#0d9488", primary_light: "#2dd4bf" },
  { name: "Изумрудный", primary: "#10b981", primary_dark: "#059669", primary_light: "#34d399" },
  { name: "Янтарный", primary: "#f59e0b", primary_dark: "#d97706", primary_light: "#fbbf24" },
  { name: "Красный", primary: "#ef4444", primary_dark: "#dc2626", primary_light: "#f87171" },
  { name: "Розовый", primary: "#ec4899", primary_dark: "#db2777", primary_light: "#f472b6" },
  { name: "Белый", primary: "#fafafa", primary_dark: "#e4e4e7", primary_light: "#ffffff" },
];

export default function StudioSettingsPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const supabase = useRef(createClient());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    address: "",
    description: "",
    owner_phone: "",
    logo_url: "",
  });
  const [theme, setTheme] = useState(getStudioTheme(null));

  useEffect(() => {
    const fetchStudio = async () => {
      const { data } = await supabase.current
        .from("studios")
        .select("name, address, description, owner_phone, logo_url, settings")
        .eq("slug", params.slug)
        .single();

      if (data) {
        setForm({
          name: data.name || "",
          address: data.address || "",
          description: data.description || "",
          owner_phone: data.owner_phone || "",
          logo_url: data.logo_url || "",
        });
        setTheme(getStudioTheme(data.settings as Record<string, unknown>));
      }
      setLoading(false);
    };

    fetchStudio();
  }, [params.slug]);

  const handleSave = async () => {
    setSaving(true);

    const { error } = await supabase.current
      .from("studios")
      .update({
        name: form.name,
        address: form.address,
        description: form.description,
        owner_phone: form.owner_phone,
        logo_url: form.logo_url,
        settings: {
          primary_color: theme.primary,
          primary_dark: theme.primary_dark,
          primary_light: theme.primary_light,
        },
      })
      .eq("slug", params.slug);

    if (error) {
      toast.error("Ошибка при сохранении");
    } else {
      toast.success("Настройки сохранены");
      router.refresh();
    }

    setSaving(false);
  };

  const handleLogout = async () => {
    await supabase.current.auth.signOut();
    toast.success("Вы вышли из системы");
    router.push("/");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Настройки</h1>
        <p className="text-sm text-zinc-400">Настройки и персонализация вашей CRM</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Информация о студии
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Название студии"
            placeholder="Мой Автодетейлинг"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Адрес"
              placeholder="ул. Примерная, 123"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
            <Input
              label="Телефон"
              type="tel"
              placeholder="+7 (999) 123-45-67"
              value={form.owner_phone}
              onChange={(e) => setForm({ ...form, owner_phone: e.target.value })}
            />
          </div>
          <Textarea
            label="Описание"
            placeholder="Описание вашего автодетейлинга..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Персонализация
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm text-zinc-400 mb-3">Цвет вашей CRM</p>
            <div className="flex flex-wrap gap-3">
              {THEME_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  title={preset.name}
                  onClick={() => setTheme({ primary: preset.primary, primary_dark: preset.primary_dark, primary_light: preset.primary_light })}
                  className={cn(
                    "w-10 h-10 rounded-xl border-2 transition-all cursor-pointer",
                    theme.primary === preset.primary
                      ? "border-white scale-110 shadow-lg"
                      : "border-zinc-700 hover:border-zinc-500",
                  )}
                  style={{ backgroundColor: preset.primary }}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm text-zinc-400 mb-2">Свой цвет (hex)</p>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={theme.primary}
                onChange={(e) => setTheme({ ...theme, primary: e.target.value })}
                className="w-10 h-10 rounded-xl border border-zinc-700 bg-transparent cursor-pointer"
              />
              <Input
                placeholder="#a855f7"
                value={theme.primary}
                onChange={(e) => setTheme({ ...theme, primary: e.target.value })}
                className="max-w-[200px]"
              />
            </div>
          </div>

          <div>
            <p className="text-sm text-zinc-400 mb-2">Логотип студии (URL)</p>
            <Input
              placeholder="https://.../logo.png"
              value={form.logo_url}
              onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
            />
          </div>

          <div className="p-4 rounded-xl bg-zinc-800/50">
            <p className="text-xs text-zinc-500 mb-3">Предпросмотр</p>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: theme.primary }}
              >
                А
              </div>
              <div className="flex gap-2">
                <span className="px-3 py-1.5 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: theme.primary }}>
                  Кнопка
                </span>
                <span className="px-3 py-1.5 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: theme.primary_dark }}>
                  Кнопка
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button onClick={handleSave} loading={saving}>Сохранить</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Управление аккаунтом
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" onClick={() => router.push("/auth/login")}>
            <LogIn className="w-4 h-4" /> Сменить пользователя
          </Button>
          <Button variant="danger" onClick={handleLogout}>
            <LogOut className="w-4 h-4" /> Выйти из системы
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
