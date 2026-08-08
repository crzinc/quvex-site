"use client";

import { useEffect, useState, useRef } from "react";
import { DollarSign, Clock, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getStatusColor, formatDate, formatCurrency, getStatusLabel } from "@/lib/utils";
import { useT } from "@/i18n/I18nProvider";
import type { Payment, Studio } from "@/types";

export default function DashboardPaymentsPage() {
  const [payments, setPayments] = useState<(Payment & { studio?: Studio })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const supabase = useRef(createClient());
  const { t } = useT();

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
    const { data: user } = await supabase.current.auth.getUser();
    const now = new Date().toISOString();
    const confirmedAt = status === "paid" ? now : null;

    const { error } = await supabase.current
      .from("payments")
      .update({
        status,
        confirmed_at: confirmedAt,
        confirmed_by: confirmedAt ? user.user?.id ?? null : null,
      })
      .eq("id", id);

    if (!error) {
      setPayments(payments.map((p) =>
        p.id === id
          ? {
              ...p,
              status: status as Payment["status"],
              confirmed_at: confirmedAt,
              confirmed_by: confirmedAt ? (user.user?.id ?? null) : null,
            }
          : p,
      ));
    }
  };

  const updatePeriod = async (id: string, field: "period_start" | "period_end", value: string) => {
    const { error } = await supabase.current
      .from("payments")
      .update({ [field]: value || null })
      .eq("id", id);

    if (!error) {
      setPayments(payments.map((p) => p.id === id ? { ...p, [field]: value || null } : p));
    }
  };

  const statusOptions = ["pending", "paid", "overdue", "cancelled"].map((s) => ({
    value: s,
    label: getStatusLabel(s, t),
  }));  const filteredPayments = filter === "all"
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
        <h1 className="text-2xl font-bold mb-1">{t("admin.payments.title")}</h1>
        <p className="text-sm text-zinc-400">{t("admin.payments.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">{t("admin.payments.total_revenue")}</p>
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
                <p className="text-sm text-zinc-400">{t("admin.payments.pending")}</p>
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
                <p className="text-sm text-zinc-400">{t("admin.payments.total")}</p>
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
            {f === "all" ? t("admin.payments.all") : getStatusLabel(f, t)}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left p-4 text-zinc-400 font-medium">{t("admin.payments.studio")}</th>
                  <th className="text-left p-4 text-zinc-400 font-medium">{t("admin.payments.date")}</th>
                  <th className="text-left p-4 text-zinc-400 font-medium">{t("admin.payments.amount")}</th>
                  <th className="text-left p-4 text-zinc-400 font-medium">{t("admin.payments.period")}</th>
                  <th className="text-left p-4 text-zinc-400 font-medium">{t("admin.payments.status")}</th>
                  <th className="text-left p-4 text-zinc-400 font-medium">{t("admin.payments.action")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-zinc-500">{t("admin.payments.empty")}</td>
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
                        <div className="flex items-center gap-2">
                          <input
                            type="date"
                            value={payment.period_start ?? ""}
                            onChange={(e) => updatePeriod(payment.id, "period_start", e.target.value)}
                            className="bg-zinc-900/50 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:border-primary/50"
                          />
                          <span>—</span>
                          <input
                            type="date"
                            value={payment.period_end ?? ""}
                            onChange={(e) => updatePeriod(payment.id, "period_end", e.target.value)}
                            className="bg-zinc-900/50 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:border-primary/50"
                          />
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className={getStatusColor(payment.status)}>
                          {getStatusLabel(payment.status, t)}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="relative">
                          <select
                            value={payment.status}
                            onChange={(e) => updateStatus(payment.id, e.target.value)}
                            className="w-36 appearance-none bg-zinc-900/50 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/25 cursor-pointer hover:border-zinc-700 transition-colors"
                          >
                            {statusOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-4 h-4 text-zinc-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
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
