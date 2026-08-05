"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Plus, TrendingUp, TrendingDown, Wallet, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatDate, formatCurrency, getPaymentMethodLabel } from "@/lib/utils";
import { toast } from "sonner";
import type { StudioTransaction } from "@/types";

export default function StudioFinancePage() {
  const params = useParams<{ slug: string }>();
  const supabase = useRef(createClient());
  const [transactions, setTransactions] = useState<StudioTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type: "income",
    amount: "",
    category: "service",
    payment_method: "cash",
    description: "",
  });

  const fetchTransactions = async () => {
    const { data: studio } = await supabase.current
      .from("studios")
      .select("id")
      .eq("slug", params.slug)
      .single();

    if (!studio) return;

    const { data } = await supabase.current
      .from("studio_transactions")
      .select("*")
      .eq("studio_id", studio.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (data) setTransactions(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.slug]);

  const handleAdd = async () => {
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) {
      toast.error("Введите корректную сумму");
      return;
    }

    const { data: studio } = await supabase.current
      .from("studios")
      .select("id")
      .eq("slug", params.slug)
      .single();

    if (!studio) return;

    const { error } = await supabase.current.from("studio_transactions").insert({
      studio_id: studio.id,
      type: form.type,
      amount,
      category: form.category,
      payment_method: form.payment_method,
      description: form.description,
    });

    if (error) {
      toast.error("Ошибка при добавлении операции");
    } else {
      toast.success(form.type === "income" ? "Доход добавлен" : "Расход добавлен");
      setForm({ type: "income", amount: "", category: "service", payment_method: "cash", description: "" });
      setShowForm(false);
      fetchTransactions();
    }
  };

  const income = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + Number(t.amount), 0);
  const expenses = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + Number(t.amount), 0);
  const monthIncome = transactions
    .filter((t) => t.type === "income" && new Date(t.created_at).getMonth() === new Date().getMonth())
    .reduce((sum, t) => sum + Number(t.amount), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    { title: "Доход за месяц", value: formatCurrency(monthIncome), icon: TrendingUp, color: "text-emerald-400" },
    { title: "Всего доход", value: formatCurrency(income), icon: ArrowDownLeft, color: "text-emerald-400" },
    { title: "Расходы", value: formatCurrency(expenses), icon: TrendingDown, color: "text-accent" },
    { title: "Баланс", value: formatCurrency(income - expenses), icon: Wallet, color: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Финансы</h1>
          <p className="text-sm text-zinc-400">Доходы и расходы студии</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4" /> Добавить операцию
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">{card.title}</p>
                  <p className="text-2xl font-bold mt-1">{card.value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-zinc-800/50 ${card.color}`}>
                  <card.icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-medium mb-4">Новая операция</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Тип"
                  value={form.type}
                  onChange={(value) => setForm({ ...form, type: value })}
                  options={[
                    { value: "income", label: "Доход" },
                    { value: "expense", label: "Расход" },
                    { value: "refund", label: "Возврат" },
                  ]}
                />
                <Input
                  label="Сумма (₽) *"
                  type="number"
                  placeholder="5000"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Категория"
                  value={form.category}
                  onChange={(value) => setForm({ ...form, category: value })}
                  options={[
                    { value: "service", label: "Услуга" },
                    { value: "product", label: "Товар" },
                    { value: "subscription", label: "Подписка" },
                    { value: "other", label: "Другое" },
                  ]}
                />
                <Select
                  label="Способ оплаты"
                  value={form.payment_method}
                  onChange={(value) => setForm({ ...form, payment_method: value })}
                  options={[
                    { value: "cash", label: "Наличные" },
                    { value: "card", label: "Карта" },
                    { value: "transfer", label: "Перевод" },
                    { value: "other", label: "Другое" },
                  ]}
                />
              </div>
              <Input
                label="Описание"
                placeholder="Например: полировка BMW X5"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <div className="flex gap-2">
                <Button onClick={handleAdd}>Добавить</Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Отмена</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-12">Нет операций</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left p-4 text-zinc-400 font-medium">Дата</th>
                    <th className="text-left p-4 text-zinc-400 font-medium">Тип</th>
                    <th className="text-left p-4 text-zinc-400 font-medium">Описание</th>
                    <th className="text-left p-4 text-zinc-400 font-medium">Способ</th>
                    <th className="text-right p-4 text-zinc-400 font-medium">Сумма</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id} className="border-b border-zinc-800/50">
                      <td className="p-4 text-zinc-500">{formatDate(t.created_at)}</td>
                      <td className="p-4">
                        <span
                          className={
                            t.type === "income"
                              ? "text-emerald-400 flex items-center gap-1.5"
                              : "text-accent flex items-center gap-1.5"
                          }
                        >
                          {t.type === "income" ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                          {t.type === "income" ? "Доход" : t.type === "expense" ? "Расход" : "Возврат"}
                        </span>
                      </td>
                      <td className="p-4 text-zinc-300">{t.description || "—"}</td>
                      <td className="p-4 text-zinc-500">{getPaymentMethodLabel(t.payment_method)}</td>
                      <td
                        className={`p-4 text-right font-medium ${
                          t.type === "income" ? "text-emerald-400" : "text-accent"
                        }`}
                      >
                        {t.type === "income" ? "+" : "−"}
                        {formatCurrency(Number(t.amount))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
