"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getStatusColor, formatDate, formatCurrency, getInitials } from "@/lib/utils";
import { useT } from "@/i18n/I18nProvider";
import type { Client } from "@/types";

export default function ClientsPage() {
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
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">{t("clients.title")}</h1>
          <p className="text-sm text-zinc-400">{clients.length} {t("clients.title").toLowerCase()}</p>
        </div>
        <Link href="/dashboard/clients/new">
          <Button><Plus className="w-4 h-4" /> {t("clients.add_btn")}</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left p-4 text-zinc-400 font-medium">{t("clients.table_name")}</th>
                  <th className="text-left p-4 text-zinc-400 font-medium">{t("clients.table_company")}</th>
                  <th className="text-left p-4 text-zinc-400 font-medium">{t("clients.table_status")}</th>
                  <th className="text-left p-4 text-zinc-400 font-medium">{t("clients.table_budget")}</th>
                  <th className="text-left p-4 text-zinc-400 font-medium">{t("clients.table_date")}</th>
                  <th className="text-left p-4 text-zinc-400 font-medium">{t("clients.table_action")}</th>
                </tr>
              </thead>
              <tbody>
                {clients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-zinc-500">{t("clients.empty")}</td>
                  </tr>
                ) : (
                  clients.map((client) => (
                    <tr key={client.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                      <td className="p-4">
                        <Link href={`/dashboard/clients/${client.id}`} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                            {getInitials(client.name)}
                          </div>
                          <div>
                            <p className="font-medium text-white">{client.name}</p>
                            <p className="text-xs text-zinc-500">{client.email}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="p-4 text-zinc-300">{client.company}</td>
                      <td className="p-4">
                        <Badge className={getStatusColor(client.status)}>{t(`status.${client.status}`)}</Badge>
                      </td>
                      <td className="p-4 text-zinc-300">{client.budget ? formatCurrency(client.budget) : "—"}</td>
                      <td className="p-4 text-zinc-500">{formatDate(client.created_at)}</td>
                      <td className="p-4">
                        <Link href={`/dashboard/clients/${client.id}`} className="text-sm text-primary hover:underline">{t("clients.open")}</Link>
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
