"use client";

import { useEffect, useState, useRef } from "react";
import { DollarSign, CheckCircle, XCircle, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getStatusColor, formatDate, formatCurrency, getStatusLabel } from "@/lib/utils";
import type { Payment, Studio } from "@/types";

export default function DashboardPaymentsPage() {
  const [payments, setPayments] = useState<(Payment & { studio?: Studio })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const supabase = useRef(createClient());

  const fetchPayments = async () => {
    const { data } = await supabase.current
      .from("payments")
      .select("*, studios(name, slug)")
      .order("created_at", { ascending: false });

    if (data) setPayments(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.current
      .from("payments")
      .update({ status, confirmed_at: new Date().toISOString() })
      .eq("id", id);

    if (!error) {
      setPayments(payments.map((p) => p.id === id ? { ...p, status: status as Payment["status"], confirmed_at: new Date().toISOString() } : p));
    }
  };

  const filteredPayments = filter === "all"
    ? payments
    : payments.filter((p) => p.status === filter);

  const totalRevenue = payments.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = payments.filter((p) => p.status === "pending").reduce((sum, p) => sum + p.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Платежи</h1>
        <p className="text-sm text-zinc-400">Управление платежами клиентов</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Общая выручка</p>
                <p className="text-2xl font-bold text-emerald-400">{formatCurrency(totalRevenue)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-emerald-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Ожидает оплаты</p>
                <p className="text-2xl font-bold text-yellow-400">{formatCurrency(pendingAmount)}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Всего платежей</p>
                <p className="text-2xl font-bold">{payments.length}</p>
              </div>
              <DollarSign className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["all", "pending", "paid", "overdue", "cancelled"].map((f) => (
          <Button
            key={f}
            variant={filter === f ? "primary" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "Все" : getStatusLabel(f)}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left p-4 text-zinc-400 font-medium">Студия</th>
                  <th className="text-left p-4 text-zinc-400 font-medium">Дата</th>
                  <th className="text-left p-4 text-zinc-400 font-medium">Сумма</th>
                  <th className="text-left p-4 text-zinc-400 font-medium">Период</th>
                  <th className="text-left p-4 text-zinc-400 font-medium">Статус</th>
                  <th className="text-left p-4 text-zinc-400 font-medium">Действие</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-zinc-500">Нет платежей</td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => (
                    <tr key={payment.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-white">{payment.studio?.name || "—"}</p>
                          <p className="text-xs text-zinc-500">/{payment.studio?.slug}</p>
                        </div>
                      </td>
                      <td className="p-4 text-zinc-300">{formatDate(payment.created_at)}</td>
                      <td className="p-4 font-medium">{formatCurrency(payment.amount)}</td>
                      <td className="p-4 text-zinc-500">
                        {payment.period_start && payment.period_end
                          ? `${formatDate(payment.period_start)} — ${formatDate(payment.period_end)}`
                          : "—"}
                      </td>
                      <td className="p-4">
                        <Badge className={getStatusColor(payment.status)}>
                          {getStatusLabel(payment.status)}
                        </Badge>
                      </td>
                      <td className="p-4">
                        {payment.status === "pending" && (
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => updateStatus(payment.id, "paid")}>
                              <CheckCircle className="w-4 h-4 mr-1" /> Оплачено
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => updateStatus(payment.id, "overdue")}>
                              <XCircle className="w-4 h-4 mr-1" /> Просрочено
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
