"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getStatusColor, getStatusLabel, formatCurrency, getInitials } from "@/lib/utils";
import { Users, Calendar, DollarSign, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useT } from "@/i18n/I18nProvider";
import type { StudioClient } from "@/types";

export default function StudioDashboardPage() {
  const params = useParams<{ slug: string }>();
  const { t } = useT();
  const [stats, setStats] = useState({
    total_clients: 0,
    new_clients: 0,
    appointments_today: 0,
    revenue_month: 0,
  });
  const [recentClients, setRecentClients] = useState<StudioClient[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = useRef(createClient());

  useEffect(() => {
    const fetchData = async () => {
      const { data: studio } = await supabase.current
        .from("studios")
        .select("id")
        .eq("slug", params.slug)
        .single();

      if (!studio) return;

      const [clientsResult, appointmentsResult, transactionsResult] = await Promise.all([
        supabase.current
          .from("studio_clients")
          .select("*")
          .eq("studio_id", studio.id)
          .order("created_at", { ascending: false }),
        supabase.current
          .from("studio_appointments")
          .select("*")
          .eq("studio_id", studio.id)
          .gte("scheduled_at", new Date().toISOString().split("T")[0])
          .lt("scheduled_at", new Date(Date.now() + 86400000).toISOString().split("T")[0]),
        supabase.current
          .from("studio_transactions")
          .select("amount")
          .eq("studio_id", studio.id)
          .eq("type", "income")
          .gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
      ]);

      const clients = clientsResult.data || [];
      const appointments = appointmentsResult.data || [];
      const revenue = transactionsResult.data?.reduce((sum, t) => sum + t.amount, 0) || 0;

      setStats({
        total_clients: clients.length,
        new_clients: clients.filter((c) => c.status === "new").length,
        appointments_today: appointments.length,
        revenue_month: revenue,
      });

      setRecentClients(clients.slice(0, 5));
      setLoading(false);
    };

    fetchData();
  }, [params.slug]);

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

  const statCards = [
    { title: t("studio.dashboard.total_clients"), value: stats.total_clients, icon: Users, color: "text-primary" },
    { title: t("studio.dashboard.new_clients"), value: stats.new_clients, icon: Users, color: "text-blue-400" },
    { title: t("studio.dashboard.appointments_today"), value: stats.appointments_today, icon: Calendar, color: "text-yellow-400" },
    { title: t("studio.dashboard.revenue_month"), value: formatCurrency(stats.revenue_month), icon: DollarSign, color: "text-emerald-400" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">{t("studio.dashboard.title")}</h1>
        <p className="text-sm text-zinc-400">{t("studio.dashboard.subtitle")}</p>
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

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t("studio.dashboard.recent_clients")}</CardTitle>
              <Link href={`/studio/${params.slug}/clients`} className="text-sm text-primary hover:underline">
                {t("studio.dashboard.all_clients")} →
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentClients.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-8">{t("studio.dashboard.no_clients")}</p>
            ) : (
              <div className="space-y-3">
                {recentClients.map((client) => (
                  <Link
                    key={client.id}
                    href={`/studio/${params.slug}/clients/${client.id}`}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                        {getInitials(client.name)}
                      </div>
                      <div>
                        <p className="font-medium text-white">{client.name}</p>
                        <p className="text-xs text-zinc-500">
                          {client.car_make} {client.car_model}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(client.status)}>
                      {getStatusLabel(client.status, t)}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t("studio.dashboard.quick_actions")}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              href={`/studio/${params.slug}/clients/new`}
              className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors"
            >
              <Users className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium text-white">{t("studio.dashboard.add_client")}</p>
                <p className="text-xs text-zinc-500">{t("studio.dashboard.add_client_desc")}</p>
              </div>
            </Link>
            <Link
              href={`/studio/${params.slug}/appointments/new`}
              className="flex items-center gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500/20 transition-colors"
            >
              <Calendar className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="font-medium text-white">{t("studio.dashboard.new_appointment")}</p>
                <p className="text-xs text-zinc-500">{t("studio.dashboard.new_appointment_desc")}</p>
              </div>
            </Link>
            <Link
              href={`/studio/${params.slug}/messages`}
              className="flex items-center gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
            >
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <div>
                <p className="font-medium text-white">{t("studio.dashboard.support")}</p>
                <p className="text-xs text-zinc-500">{t("studio.dashboard.support_desc")}</p>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
