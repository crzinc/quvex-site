"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import StatsCards from "@/components/dashboard/StatsCards";
import RecentClients from "@/components/dashboard/RecentClients";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useT } from "@/i18n/I18nProvider";
import type { Client } from "@/types";

export default function DashboardPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = useRef(createClient());
  const { t } = useT();

  useEffect(() => {
    supabase.current.from("clients").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setClients(data as unknown as Client[]);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-zinc-400">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  const stats = {
    total_clients: clients.length,
    active_projects: clients.filter((c) => c.status === "development").length,
    monthly_leads: clients.filter(
      (c) => new Date(c.created_at).getMonth() === new Date().getMonth()
    ).length,
    conversion_rate: clients.length > 0
      ? Math.round(
          (clients.filter((c) => c.status === "completed" || c.status === "development").length /
            clients.length) * 100
        )
      : 0,
    revenue: clients.reduce((sum, c) => sum + (c.budget || 0), 0),
  };

  const statusCounts = clients.reduce(
    (acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">{t("dashboard.title")}</h1>
        <p className="text-sm text-zinc-400">{t("dashboard.subtitle")}</p>
      </div>

      <StatsCards stats={stats} />

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
                const total = clients.length;
                const percentage = Math.round((count / total) * 100);
                return (
                  <div key={status}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-zinc-400 capitalize">{t(`status.${status}`)}</span>
                      <span className="text-zinc-500">{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all"
                        style={{ width: `${percentage}%` }}
                      />
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
