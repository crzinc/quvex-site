"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getStatusColor, getStatusLabel, formatDate, formatCurrency, getInitials, getQuizBudgetLabel } from "@/lib/utils";
import { useT } from "@/i18n/I18nProvider";
import type { Client } from "@/types";

export default function DashboardRequestsPage() {
  const [requests, setRequests] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const supabase = useRef(createClient());
  const { t } = useT();

  useEffect(() => {
    const fetchRequests = async () => {
      const { data, error } = await supabase.current
        .from("clients")
        .select("id,name,email,phone,company,status,source,budget,created_at")
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) setLoadError(error.message);
      else if (data) setRequests(data as unknown as Client[]);
      setLoading(false);
    };

    fetchRequests();
  }, []);

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
    return <div className="text-center py-12 text-sm text-red-400">{loadError}</div>;
  }

  const q = search.trim().toLowerCase();
  const filtered = requests.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (!q) return true;
    return (r.name || "").toLowerCase().includes(q) || (r.email || "").toLowerCase().includes(q) || (r.phone || "").includes(search.trim());
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">{t("admin.requests.title")}</h1>
        <p className="text-sm text-zinc-400">{filtered.length} {t("admin.requests.count")}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder={t("admin.studios.request_search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-primary/50"
        />
        <div className="flex gap-2 flex-wrap">
          {(["all", "lead", "negotiation", "development", "completed", "support"] as const).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`text-xs px-3 py-2 rounded-lg border transition-colors ${statusFilter === s ? "bg-primary/10 text-primary border-primary/30" : "text-zinc-400 border-zinc-800 hover:text-white"}`}>
              {s === "all" ? t("admin.payments.all") : getStatusLabel(s, t)}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th scope="col" className="text-left p-4 text-zinc-400 font-medium">{t("admin.requests.name")}</th>
                  <th scope="col" className="text-left p-4 text-zinc-400 font-medium">{t("admin.requests.contacts")}</th>
                  <th scope="col" className="text-left p-4 text-zinc-400 font-medium">{t("admin.requests.source")}</th>
                  <th scope="col" className="text-left p-4 text-zinc-400 font-medium">{t("admin.requests.budget")}</th>
                  <th scope="col" className="text-left p-4 text-zinc-400 font-medium">{t("admin.requests.status")}</th>
                  <th scope="col" className="text-left p-4 text-zinc-400 font-medium">{t("admin.requests.date")}</th>
                  <th scope="col" className="text-left p-4 text-zinc-400 font-medium">{t("admin.requests.action")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-zinc-500">{t("admin.requests.empty")}</td>
                  </tr>
                ) : (
                  filtered.map((request) => (
                    <tr key={request.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                            {getInitials(request.name)}
                          </div>
                          <div>
                            <p className="font-medium text-white">{request.name}</p>
                            {request.company && <p className="text-xs text-zinc-500">{request.company}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          {request.email && (
                            <div className="flex items-center gap-2 text-xs text-zinc-400">
                              <Mail className="w-3 h-3" /> {request.email}
                            </div>
                          )}
                          {request.phone && (
                            <div className="flex items-center gap-2 text-xs text-zinc-400">
                              <Phone className="w-3 h-3" /> {request.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-zinc-400">{request.source || "—"}</td>
                      <td className="p-4 text-zinc-300">{request.quiz_results?.budget ? getQuizBudgetLabel(request.quiz_results.budget, t) : request.budget ? formatCurrency(request.budget) : "—"}</td>
                      <td className="p-4">
                        <Badge className={getStatusColor(request.status)}>
                          {getStatusLabel(request.status, t)}
                        </Badge>
                      </td>
                      <td className="p-4 text-zinc-500">{formatDate(request.created_at)}</td>
                      <td className="p-4">
                        <Link href={`/dashboard/clients/${request.id}`} className="text-sm text-primary hover:underline">
                          {t("admin.requests.open")}
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
