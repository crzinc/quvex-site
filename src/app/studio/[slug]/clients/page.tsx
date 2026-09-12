"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Plus, Search, Car, Phone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getStatusColor, getStatusLabel, formatCurrency, getInitials, cn } from "@/lib/utils";
import { getCachedStudioId } from "@/lib/use-studio";
import { useT } from "@/i18n/I18nProvider";
import type { StudioClient, Plan } from "@/types";

export default function StudioClientsPage() {
  const params = useParams<{ slug: string }>();
  const { t } = useT();
  const [clients, setClients] = useState<StudioClient[]>([]);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const supabase = useRef(createClient());

  useEffect(() => {
    const fetchClients = async () => {
      const studioId = await getCachedStudioId(supabase.current, params.slug as string);

      if (!studioId) {
        setLoadError("Studio not found");
        setLoading(false);
        return;
      }

      const { data: studioRow } = await supabase.current
        .from("studios")
        .select("plan_id")
        .eq("id", studioId)
        .single();

      const [clientsResult, planResult] = await Promise.all([
        supabase.current
          .from("studio_clients")
          .select("id, name, email, phone, car_make, car_model, car_year, license_plate, status, total_visits, total_spent, created_at")
          .eq("studio_id", studioId)
          .order("created_at", { ascending: false })
          .limit(200),
        studioRow?.plan_id
          ? supabase.current.from("plans").select("*").eq("id", studioRow.plan_id).single()
          : Promise.resolve({ data: null }),
      ]);

      if (clientsResult.error) setLoadError(clientsResult.error.message);
      else if (clientsResult.data) setClients(clientsResult.data as unknown as StudioClient[]);
      if (planResult.data) setPlan(planResult.data);
      setLoading(false);
    };

    fetchClients();
  }, [params.slug]);

  const q = search.trim().toLowerCase();
  const filteredClients = clients.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (!q) return true;
    return (
      (c.name || "").toLowerCase().includes(q) ||
      (c.phone || "").includes(search.trim()) ||
      (c.car_make || "").toLowerCase().includes(q) ||
      (c.car_model || "").toLowerCase().includes(q) ||
      (c.license_plate || "").toLowerCase().includes(q)
    );
  });

  const maxClients = plan?.max_clients ?? null;
  const limitReached = maxClients !== null && clients.length >= maxClients;
  const usagePercent = maxClients ? Math.min(100, Math.round((clients.length / maxClients) * 100)) : 100;

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-2xl bg-zinc-900/50 border border-zinc-800 animate-pulse" />
        ))}
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-red-400 mb-4">{loadError}</p>
        <Button onClick={() => window.location.reload()}>{t("common.retry")}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold mb-1">{t("studio.clients.title")}</h1>
          <p className="text-sm text-zinc-400">{clients.length} {t("studio.clients.subtitle")}</p>
        </div>
        <Link href={`/studio/${params.slug}/clients/new`} className={limitReached ? "pointer-events-none opacity-50" : undefined}>
          <Button>
            <Plus className="w-4 h-4" /> {t("studio.clients.new")}
          </Button>
        </Link>
      </div>

      {maxClients !== null && (
        <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-400">{t("subscription.clients_usage", { used: clients.length, max: maxClients })}</span>
            <span className={cn("text-sm font-medium", limitReached ? "text-red-400" : "text-zinc-300")}>
              {usagePercent}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", limitReached ? "bg-red-500" : "bg-primary")}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
          {limitReached && (
            <p className="text-xs text-red-400 mt-2">{t("subscription.clients_limit_reached")}</p>
          )}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          placeholder={t("studio.clients.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 transition-colors"
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["all", "new", "regular", "vip", "inactive"] as const).map((s) => (
          <Button key={s} variant={statusFilter === s ? "primary" : "outline"} size="sm" onClick={() => setStatusFilter(s)}>
            {s === "all" ? t("studio.appointments.all") : getStatusLabel(s, t)}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left p-4 text-zinc-400 font-medium">{t("studio.clients.name")}</th>
                  <th className="text-left p-4 text-zinc-400 font-medium">{t("studio.clients.car")}</th>
                  <th className="text-left p-4 text-zinc-400 font-medium">{t("studio.clients.phone")}</th>
                  <th className="text-left p-4 text-zinc-400 font-medium">{t("studio.clients.status")}</th>
                  <th className="text-left p-4 text-zinc-400 font-medium">{t("studio.client.visits")}</th>
                  <th className="text-left p-4 text-zinc-400 font-medium">{t("studio.clients.spent")}</th>
                  <th className="text-left p-4 text-zinc-400 font-medium">{t("studio.clients.action")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-zinc-500">
                      {search ? t("studio.clients.no_results") : t("studio.clients.empty")}
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => (
                    <tr key={client.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                      <td className="p-4">
                        <Link href={`/studio/${params.slug}/clients/${client.id}`} className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                            {getInitials(client.name)}
                          </div>
                          <div>
                            <p className="font-medium text-white">{client.name}</p>
                            {client.email && <p className="text-xs text-zinc-500">{client.email}</p>}
                          </div>
                        </Link>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Car className="w-4 h-4 text-zinc-500" />
                          <span className="text-zinc-300">
                            {client.car_make} {client.car_model}
                            {client.car_year && ` (${client.car_year})`}
                          </span>
                        </div>
                        {client.license_plate && (
                          <p className="text-xs text-zinc-500 mt-1">{client.license_plate}</p>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-zinc-500" />
                          <span className="text-zinc-300">{client.phone || "—"}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className={getStatusColor(client.status)}>
                          {getStatusLabel(client.status, t)}
                        </Badge>
                      </td>
                      <td className="p-4 text-zinc-300">{client.total_visits}</td>
                      <td className="p-4 text-zinc-300">{formatCurrency(client.total_spent)}</td>
                      <td className="p-4">
                        <Link href={`/studio/${params.slug}/clients/${client.id}`} className="text-sm text-primary hover:underline">
                          {t("studio.clients.open")}
                        </Link>
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
