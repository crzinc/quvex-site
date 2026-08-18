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
  const supabase = useRef(createClient());
  const { t } = useT();

  useEffect(() => {
    const fetchRequests = async () => {
      const { data } = await supabase.current
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });

      if (data) setRequests(data);
      setLoading(false);
    };

    fetchRequests();
  }, []);

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
        <h1 className="text-2xl font-bold mb-1">{t("admin.requests.title")}</h1>
        <p className="text-sm text-zinc-400">{requests.length} {t("admin.requests.count")}</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left p-4 text-zinc-400 font-medium">{t("admin.requests.name")}</th>
                  <th className="text-left p-4 text-zinc-400 font-medium">{t("admin.requests.contacts")}</th>
                  <th className="text-left p-4 text-zinc-400 font-medium">{t("admin.requests.source")}</th>
                  <th className="text-left p-4 text-zinc-400 font-medium">{t("admin.requests.budget")}</th>
                  <th className="text-left p-4 text-zinc-400 font-medium">{t("admin.requests.status")}</th>
                  <th className="text-left p-4 text-zinc-400 font-medium">{t("admin.requests.date")}</th>
                  <th className="text-left p-4 text-zinc-400 font-medium">{t("admin.requests.action")}</th>
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-zinc-500">{t("admin.requests.empty")}</td>
                  </tr>
                ) : (
                  requests.map((request) => (
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
