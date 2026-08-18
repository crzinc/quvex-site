"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, Calendar, DollarSign, Trash2, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { deleteStudio, renewStudioSubscription } from "@/lib/studio-actions";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getStatusColor, formatDate, formatCurrency, getStatusLabel, cn } from "@/lib/utils";
import { useT } from "@/i18n/I18nProvider";
import type { Studio, StudioClient, StudioAppointment, Payment, Plan, SubscriptionPeriod } from "@/types";

const RENEW_PERIODS: { value: SubscriptionPeriod; labelKey: string }[] = [
  { value: "monthly", labelKey: "subscription.period_monthly" },
  { value: "quarterly", labelKey: "subscription.period_quarterly" },
  { value: "yearly", labelKey: "subscription.period_yearly" },
];

export default function DashboardStudioDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useT();
  const [studio, setStudio] = useState<Studio | null>(null);
  const [clients, setClients] = useState<StudioClient[]>([]);
  const [appointments, setAppointments] = useState<(StudioAppointment & { studio_clients?: { name: string }; studio_services?: { name: string } })[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [renewPlanId, setRenewPlanId] = useState("");
  const [renewPeriod, setRenewPeriod] = useState<SubscriptionPeriod>("monthly");
  const [renewing, setRenewing] = useState(false);
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

        const [clientsResult, appointmentsResult, paymentsResult, plansResult] = await Promise.all([
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
          supabase.current
            .from("plans")
            .select("*")
            .order("sort_order"),
        ]);

        if (clientsResult.data) setClients(clientsResult.data);
        if (appointmentsResult.data) setAppointments(appointmentsResult.data);
        if (paymentsResult.data) setPayments(paymentsResult.data);
        if (plansResult.data) {
          setPlans(plansResult.data);
          setRenewPlanId(studioData.plan_id || plansResult.data[0]?.id || "");
        }
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

  const handleRenew = async () => {
    if (!studio || !renewPlanId) return;
    setRenewing(true);
    const result = await renewStudioSubscription(studio.id, renewPlanId, renewPeriod);
    setRenewing(false);

    if (!result.ok) {
      toast.error(result.error || "Ошибка продления");
      return;
    }

    toast.success(t("subscription.renewed"));
    const { data: studioData } = await supabase.current
      .from("studios")
      .select("*")
      .eq("id", studio.id)
      .single();
    if (studioData) setStudio(studioData);
    const { data: paymentsResult } = await supabase.current
      .from("payments")
      .select("*")
      .eq("studio_id", studio.id)
      .order("created_at", { ascending: false });
    if (paymentsResult) setPayments(paymentsResult);
  };

  const handleDelete = async () => {
    if (!studio || confirmName.trim() !== studio.name.trim()) return;
    setDeleting(true);
    const result = await deleteStudio(studio.id, confirmName);
    setDeleting(false);

    if (!result.ok) {
      toast.error(result.error || t("admin.studios.delete_failed"));
      return;
    }

    toast.success(`${t("admin.studios.delete_success")} «${studio.name}»`);
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
        <p className="text-zinc-500">{t("admin.studios.not_found")}</p>
        <Link href="/dashboard/studios" className="text-sm text-primary hover:underline mt-2 inline-block">
          ← {t("admin.studios.to_list")}
        </Link>
      </div>
    );
  }

  const totalRevenue = payments.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amount, 0);
  const pendingPayments = payments.filter((p) => p.status === "pending");
  const currentPlan = plans.find((p) => p.id === studio.plan_id);
  const overdue = studio.subscription_end && new Date(studio.subscription_end) < new Date();
  const renewPrice = (() => {
    const plan = plans.find((p) => p.id === renewPlanId);
    if (!plan) return 0;
    return Number(renewPeriod === "monthly" ? plan.price_monthly : renewPeriod === "quarterly" ? plan.price_quarterly : plan.price_yearly);
  })();

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
              {studio.is_active ? t("admin.studios.active") : t("admin.studios.inactive")}
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
                <p className="text-sm text-zinc-400">{t("admin.studios.detail_clients")}</p>
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
                <p className="text-sm text-zinc-400">{t("admin.studios.detail_appointments")}</p>
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
                <p className="text-sm text-zinc-400">{t("admin.studios.detail_revenue")}</p>
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
                <p className="text-sm text-zinc-400">{t("admin.studios.detail_pending")}</p>
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
            <CardTitle>{t("admin.studios.detail_info")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">{t("admin.studios.detail_owner")}</span>
              <span className="text-sm">{studio.owner_email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">{t("admin.studios.detail_phone")}</span>
              <span className="text-sm">{studio.owner_phone || "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">{t("admin.studios.detail_address")}</span>
              <span className="text-sm">{studio.address || "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">{t("admin.studios.detail_created")}</span>
              <span className="text-sm">{formatDate(studio.created_at)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("admin.studios.recent_appointments")}</CardTitle>
          </CardHeader>
          <CardContent>
            {appointments.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-4">{t("admin.studios.no_appointments")}</p>
            ) : (
              <div className="space-y-3">
                {appointments.slice(0, 5).map((apt) => (
                  <div key={apt.id} className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/50">
                    <div>
                      <p className="text-sm font-medium">{apt.studio_clients?.name || t("studio.appointments.client")}</p>
                      <p className="text-xs text-zinc-500">{apt.studio_services?.name || t("studio.appointments.service")}</p>
                    </div>
                    <Badge className={getStatusColor(apt.status)}>
                      {getStatusLabel(apt.status, t)}
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
          <CardTitle className="flex items-center gap-2">
            {t("subscription.title")}
            {overdue && (
              <Badge className="bg-red-500/10 text-red-400 border-red-500/20">
                {t("subscription.overdue")}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-zinc-800/50">
              <p className="text-xs text-zinc-500 mb-1">{t("subscription.plan")}</p>
              <p className="text-sm font-medium">{currentPlan?.name || "—"}</p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-800/50">
              <p className="text-xs text-zinc-500 mb-1">{t("subscription.period")}</p>
              <p className="text-sm font-medium capitalize">{t(`subscription.period_${studio.subscription_period}`)}</p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-800/50">
              <p className="text-xs text-zinc-500 mb-1">{t("subscription.start")}</p>
              <p className="text-sm font-medium">{studio.subscription_start ? formatDate(studio.subscription_start) : "—"}</p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-800/50">
              <p className="text-xs text-zinc-500 mb-1">{t("subscription.end")}</p>
              <p className="text-sm font-medium">{studio.subscription_end ? formatDate(studio.subscription_end) : "—"}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-3">
            <p className="text-sm font-medium">{t("subscription.renew_title")}</p>
            <div className="grid sm:grid-cols-3 gap-3">
              <select
                value={renewPlanId}
                onChange={(e) => setRenewPlanId(e.target.value)}
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50"
              >
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>{plan.name}</option>
                ))}
              </select>
              <div className="flex gap-2">
                {RENEW_PERIODS.map((period) => (
                  <button
                    key={period.value}
                    type="button"
                    onClick={() => setRenewPeriod(period.value)}
                    className={cn(
                      "flex-1 px-3 py-2 rounded-xl border text-sm transition-all",
                      renewPeriod === period.value
                        ? "bg-primary/10 border-primary/40 text-white"
                        : "bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:border-zinc-700",
                    )}
                  >
                    {t(period.labelKey)}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <p className="text-lg font-bold">{formatCurrency(renewPrice)}</p>
                <Button onClick={handleRenew} loading={renewing} className="flex-shrink-0">
                  {t("subscription.renew_btn")}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.studios.payments")}</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-4">{t("admin.studios.no_payments")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left p-4 text-zinc-400 font-medium">{t("admin.payments.date")}</th>
                    <th className="text-left p-4 text-zinc-400 font-medium">{t("admin.payments.amount")}</th>
                    <th className="text-left p-4 text-zinc-400 font-medium">{t("admin.payments.period")}</th>
                    <th className="text-left p-4 text-zinc-400 font-medium">{t("admin.payments.status")}</th>
                    <th className="text-left p-4 text-zinc-400 font-medium">{t("admin.payments.action")}</th>
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
                          {getStatusLabel(payment.status, t)}
                        </Badge>
                      </td>
                      <td className="p-4">
                        {payment.status === "pending" && (
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => updatePaymentStatus(payment.id, "paid")}>
                              {t("admin.payments.paid_btn")}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => updatePaymentStatus(payment.id, "overdue")}>
                              {t("admin.payments.overdue_btn")}
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
            {t("admin.studios.danger_zone")}
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
                  <p className="text-sm font-medium">{t("admin.studios.delete")}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {t("admin.studios.delete_desc")}
                  </p>
                </div>
                <Button variant="danger" onClick={() => setConfirmOpen(true)} className="flex-shrink-0">
                  <Trash2 className="w-4 h-4" />
                  {t("admin.studios.delete")}
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
                    {t("admin.studios.delete_warning")} <b>{studio.name}</b>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm text-zinc-400 block">
                    {t("admin.studios.delete_confirm_label")} <span className="text-zinc-600">«{studio.name}»</span>
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
                    <p className="text-xs text-red-400">{t("admin.studios.name_mismatch")}</p>
                  )}
                </div>

                <div className="flex gap-3 justify-end">
                  <Button variant="outline" onClick={() => { setConfirmOpen(false); setConfirmName(""); }}>
                    {t("admin.studios.cancel")}
                  </Button>
                  <Button
                    variant="danger"
                    loading={deleting}
                    disabled={confirmName.trim() !== studio.name.trim()}
                    onClick={handleDelete}
                  >
                    <Trash2 className="w-4 h-4" />
                    {t("admin.studios.delete_confirm")}
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
