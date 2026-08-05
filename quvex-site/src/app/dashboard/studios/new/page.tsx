"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building, KeyRound, CheckCircle2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { toast } from "sonner";
import { createStudioAccount, type StudioAccountInput } from "@/lib/studio-actions";

export default function DashboardNewStudioPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ studio_id: string; name: string; owner_email: string; password: string } | null>(null);
  const [form, setForm] = useState({
    name: "",
    owner_email: "",
    owner_phone: "",
    address: "",
    description: "",
    plan: "basic",
    password: "",
    payment_amount: "",
    payment_method: "cash",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const input: StudioAccountInput = {
      name: form.name,
      owner_email: form.owner_email,
      owner_phone: form.owner_phone,
      address: form.address,
      description: form.description,
      plan: form.plan as StudioAccountInput["plan"],
      password: form.password || undefined,
      payment_amount: form.payment_amount ? parseFloat(form.payment_amount) : undefined,
      payment_method: form.payment_method as StudioAccountInput["payment_method"],
    };

    const res = await createStudioAccount(input);

    if (res.error) {
      toast.error(res.error);
      setLoading(false);
      return;
    }

    setResult(res);
    setLoading(false);
  };

  if (result) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/studios" className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Студия создана</h1>
            <p className="text-sm text-zinc-400">Передайте эти данные владельцу студии</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3 text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
              <p className="font-medium text-white">Аккаунт для студии «{result.name}» готов</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-zinc-800/50">
                <p className="text-xs text-zinc-500 mb-1">Логин (email)</p>
                <p className="font-mono text-sm">{result.owner_email}</p>
              </div>
              <div className="p-4 rounded-xl bg-zinc-800/50">
                <p className="text-xs text-zinc-500 mb-1">Пароль</p>
                <p className="font-mono text-sm flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-yellow-400" />
                  {result.password}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
              <p className="text-xs text-zinc-400 mb-1">Ссылка для входа в CRM</p>
              <p className="font-mono text-sm text-primary">
                {typeof window !== "undefined" ? window.location.origin : ""}/auth/login
              </p>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Link href={`/dashboard/studios`}>
                <Button variant="outline">К списку студий</Button>
              </Link>
              <Link href={`/dashboard/studios/${result.studio_id}`}>
                <Button>
                  <ExternalLink className="w-4 h-4" /> Открыть студию
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/studios" className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Новая студия</h1>
          <p className="text-sm text-zinc-400">Создайте аккаунт для автодетейлинг студии</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Студия
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Название студии *"
              placeholder="Мой Автодетейлинг"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Email владельца *"
                type="email"
                placeholder="owner@studio.com"
                value={form.owner_email}
                onChange={(e) => setForm({ ...form, owner_email: e.target.value })}
                required
              />
              <Input
                label="Телефон владельца"
                type="tel"
                placeholder="+7 (999) 123-45-67"
                value={form.owner_phone}
                onChange={(e) => setForm({ ...form, owner_phone: e.target.value })}
              />
            </div>
            <Input
              label="Адрес"
              placeholder="ул. Примерная, 123"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
            <Textarea
              label="Описание"
              placeholder="Краткое описание студии..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Тариф и доступ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Тариф"
                value={form.plan}
                onChange={(value) => setForm({ ...form, plan: value })}
                options={[
                  { value: "basic", label: "Базовый — 1 990 ₽/мес" },
                  { value: "pro", label: "Про — 4 990 ₽/мес" },
                  { value: "enterprise", label: "Корпоративный — 14 900 ₽/мес" },
                ]}
              />
              <Input
                label="Внесённая сумма (₽)"
                type="number"
                placeholder="1990"
                value={form.payment_amount}
                onChange={(e) => setForm({ ...form, payment_amount: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Способ оплаты"
                value={form.payment_method}
                onChange={(value) => setForm({ ...form, payment_method: value })}
                options={[
                  { value: "cash", label: "Наличные" },
                  { value: "transfer", label: "Перевод" },
                  { value: "card", label: "Карта" },
                  { value: "other", label: "Другое" },
                ]}
              />
              <Input
                label="Пароль (необязательно)"
                placeholder="Оставьте пустым — сгенерируется"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Link href="/dashboard/studios">
            <Button type="button" variant="outline">Отмена</Button>
          </Link>
          <Button type="submit" loading={loading}>
            Создать студию
          </Button>
        </div>
      </form>
    </div>
  );
}
