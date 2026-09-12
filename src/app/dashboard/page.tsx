"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import StatsCards from "@/components/dashboard/StatsCards";
import RecentClients from "@/components/dashboard/RecentClients";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/I18nProvider";
import type { Client } from "@/types";

export default function DashboardPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [studiosCount, setStudiosCount] = useState(0);
  const [paidTotal, setPaidTotal] = useState(0);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const supabase = useRef(createClient());
  const { t } = useT();

  const fetchAll = async () => {
    setLoadError("");
    const [clientsRes, studiosRes, paymentsRes] = await Promise.all([
      supabase.current.from("clients").select("id,name,company,status,budget,created_at").order("created_at", { ascending: false }).limit(500),
      supabase.current.from("studios").select("id", { count: "exact", head: true }),
      supabase.current.from("payments").select("amount,status").limit(500),
    ]);
    if (clientsRes.error) setLoadError(clientsRes.error.message);
    else setClients((clientsRes.data as unknown as Client[]) || []);
    if (studiosRes.count !== null) setStudiosCount(studiosRes.count);
    if (paymentsRes.data) {
      setPaidTotal(paymentsRes.data.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.amount || 0), 0));
      setPendingTotal(paymentsRes.data.filter((p) => p.status === "pending" || p.status === "overdue").reduce((s, p) => s + Number(p.amount || 0), 0));
    }
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-zinc-900/50 border border-zinc-800 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-red-400 mb-4">{loadError}</p>
        <Button onClick={() => { setLoading(true); fetchAll(); }}>{t("common.retry")}</Button>
      </div>
    );
  }

  const now = new Date();
  const stats = {
    total_clients: clients.length,
    active_projects: clients.filter((c) => c.status === "development").length,
    monthly_leads: clients.filter((c) => {
      const d = new Date(c.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length,
    conversion_rate: clients.length > 0
      ? Math.round((clients.filter((c) => c.status === "completed" || c.status === "development").length / clients.length) * 100)
      : 0,
    revenue: clients.reduce((sum, c) => sum + (c.budget || 0), 0),
  };

  const statusCounts = clients.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">{t("dashboard.title")}</h1>
        <p className="text-sm text-zinc-400">{t("dashboard.subtitle")}</p>
      </div>

      <StatsCards stats={stats} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-6"><p className="text-sm text-zinc-400">{t("admin.dashboard.studios")}</p><p className="text-2xl font-bold mt-1">{studiosCount}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-zinc-400">{t("admin.dashboard.mrr")}</p><p className="text-2xl font-bold mt-1 text-emerald-400">{paidTotal.toLocaleString()} ₼</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-zinc-400">{t("admin.dashboard.pending")}</p><p className="text-2xl font-bold mt-1 text-yellow-400">{pendingTotal.toLocaleString()} ₼</p></CardContent></Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentClients clients={clients.slice(0, 5)} />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.status_title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(statusCounts).map(([status, count]) => {
                const total = clients.length || 1;
                const percentage = Math.round((count / total) * 100);
                return (
                  <div key={status}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-zinc-400 capitalize">{status}</span>
                      <span className="text-zinc-500">{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
