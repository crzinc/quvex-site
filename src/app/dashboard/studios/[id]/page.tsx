"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building, Users, Calendar, DollarSign, MessageSquare, Trash2, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { deleteStudio } from "@/lib/studio-actions";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getStatusColor, formatDate, formatCurrency, getStatusLabel } from "@/lib/utils";
import type { Studio, StudioClient, StudioAppointment, Payment } from "@/types";

export default function DashboardStudioDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [studio, setStudio] = useState<Studio | null>(null);
  const [clients, setClients] = useState<StudioClient[]>([]);
  const [appointments, setAppointments] = useState<(StudioAppointment & { studio_clients?: { name: string }; studio_services?: { name: string } })[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [deleting, setDeleting] = useState(false);
  const supabase = useRef(createClient());

  useEffect(() => {
    const fetchData = async () => {
      const { data: studioData } = await supabase.current
        .from("studios")
        .select("*")
        .eq("id", params.id)
        .single();

      if (studioData) {
        setStudio(studioData);

        const [clientsResult, appointmentsResult, paymentsResult] = await Promise.all([
          supabase.current
            .from("studio_clients")
            .select("*")
            .eq("studio_id", studioData.id)
            .order("created_at", { ascending: false }),
          supabase.current
            .from("studio_appointments")
            .select("*, studio_clients(name), studio_services(name)")
            .eq("studio_id", studioData.id)
            .order("scheduled_at", { ascending: false })
            .limit(10),
          supabase.current
            .from("payments")
            .select("*")
            .eq("studio_id", studioData.id)
            .order("created_at", { ascending: false }),
        ]);

        if (clientsResult.data) setClients(clientsResult.data);
        if (appointmentsResult.data) setAppointments(appointmentsResult.data);
        if (paymentsResult.data) setPayments(paymentsResult.data);
      }
      setLoading(false);
    };

    fetchData();
  }, [params.id]);

  const updatePaymentStatus = async (paymentId: string, status: string) => {
    const { error } = await supabase.current
      .from("payments")
      .update({ status, confirmed_at: new Date().toISOString() })
      .eq("id", paymentId);

    if (!error) {
      setPayments(payments.map((p) => p.id === paymentId ? { ...p, status: status as Payment["status"], confirmed_at: new Date().toISOString() } : p));
    }
  };

  const handleDelete = async () => {
    if (!studio || confirmName.trim() !== studio.name.trim()) return;
    setDeleting(true);
    const result = await deleteStudio(studio.id, confirmName);
    setDeleting(false);

    if (!result.ok) {
      toast.error(result.error || "Не удалось удалить студию");
      return;
    }

    toast.success(`Студия «${studio.name}» удалена`);
    router.push("/dashboard/studios");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!studio) {
    return (
      <div className="text-center py-20">
        <p className="text-zinc-500">Студия не найдена</p>
        <Link href="/dashboard/studios" className="text-sm text-primary hover:underline mt-2 inline-block">
          ← К списку студий
        </Link>
      </div>
    );
  }

  const totalRevenue = payments.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amount, 0);
  const pendingPayments = payments.filter((p) => p.status === "pending");

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/studios" className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{studio.name}</h1>
            <Badge className={studio.is_active ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"}>
              {studio.is_active ? "Активна" : "Неактивна"}
            </Badge>
          </div>
          <p className="text-sm text-zinc-400">/{studio.slug}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Клиентов</p>
                <p className="text-2xl font-bold">{clients.length}</p>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Записей</p>
                <p className="text-2xl font-bold">{appointments.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Выручка</p>
                <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
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
                <p className="text-2xl font-bold">{pendingPayments.length}</p>
              </div>
              <DollarSign className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Информация</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Владелец</span>
              <span className="text-sm">{studio.owner_email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Телефон</span>
              <span className="text-sm">{studio.owner_phone || "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Адрес</span>
              <span className="text-sm">{studio.address || "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Создана</span>
              <span className="text-sm">{formatDate(studio.created_at)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Последние записи</CardTitle>
          </CardHeader>
          <CardContent>
            {appointments.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-4">Нет записей</p>
            ) : (
              <div className="space-y-3">
                {appointments.slice(0, 5).map((apt) => (
                  <div key={apt.id} className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/50">
                    <div>
                      <p className="text-sm font-medium">{apt.studio_clients?.name || "Клиент"}</p>
                      <p className="text-xs text-zinc-500">{apt.studio_services?.name || "Услуга"}</p>
                    </div>
                    <Badge className={getStatusColor(apt.status)}>
                      {apt.status === "completed" ? "Выполнено" : apt.status === "scheduled" ? "Запланировано" : apt.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Платежи</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-4">Нет платежей</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left p-4 text-zinc-400 font-medium">Дата</th>
                    <th className="text-left p-4 text-zinc-400 font-medium">Сумма</th>
                    <th className="text-left p-4 text-zinc-400 font-medium">Период</th>
                    <th className="text-left p-4 text-zinc-400 font-medium">Статус</th>
                    <th className="text-left p-4 text-zinc-400 font-medium">Действие</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b border-zinc-800/50">
                      <td className="p-4">{formatDate(payment.created_at)}</td>
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
                            <Button size="sm" onClick={() => updatePaymentStatus(payment.id, "paid")}>
                              Оплачено
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => updatePaymentStatus(payment.id, "overdue")}>
                              Просрочено
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-red-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-400">
            <Trash2 className="w-5 h-5" />
            Опасная зона
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            {!confirmOpen ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <p className="text-sm font-medium">Удалить студию</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Безвозвратно удалит студию, всех клиентов, записи, услуги, финансы и аккаунт владельца.
                  </p>
                </div>
                <Button variant="danger" onClick={() => setConfirmOpen(true)} className="flex-shrink-0">
                  <Trash2 className="w-4 h-4" />
                  Удалить студию
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-300">
                    Это действие нельзя отменить. Все данные студии <b>{studio.name}</b> будут удалены навсегда.
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm text-zinc-400 block">
                    Введите название студии <span className="text-zinc-600">«{studio.name}»</span>, чтобы подтвердить:
                  </label>
                  <input
                    value={confirmName}
                    onChange={(e) => setConfirmName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && confirmName.trim() === studio.name.trim()) handleDelete();
                    }}
                    placeholder={studio.name}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/25 transition-all duration-200"
                    autoFocus
                  />
                  {confirmName.trim() !== studio.name.trim() && confirmName.trim() !== "" && (
                    <p className="text-xs text-red-400">Название не совпадает</p>
                  )}
                </div>

                <div className="flex gap-3 justify-end">
                  <Button variant="outline" onClick={() => { setConfirmOpen(false); setConfirmName(""); }}>
                    Отмена
                  </Button>
                  <Button
                    variant="danger"
                    loading={deleting}
                    disabled={confirmName.trim() !== studio.name.trim()}
                    onClick={handleDelete}
                  >
                    <Trash2 className="w-4 h-4" />
                    Подтвердить удаление
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
