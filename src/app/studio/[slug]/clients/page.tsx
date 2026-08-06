"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Plus, Search, Car, Phone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getStatusColor, getStatusLabel, formatCurrency, getInitials } from "@/lib/utils";
import { useT } from "@/i18n/I18nProvider";
import type { StudioClient } from "@/types";

export default function StudioClientsPage() {
  const params = useParams<{ slug: string }>();
  const { t } = useT();
  const [clients, setClients] = useState<StudioClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const supabase = useRef(createClient());

  useEffect(() => {
    const fetchClients = async () => {
      const { data: studio } = await supabase.current
        .from("studios")
        .select("id")
        .eq("slug", params.slug)
        .single();

      if (!studio) return;

      const { data } = await supabase.current
        .from("studio_clients")
        .select("*")
        .eq("studio_id", studio.id)
        .order("created_at", { ascending: false });

      if (data) setClients(data);
      setLoading(false);
    };

    fetchClients();
  }, [params.slug]);

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.car_make.toLowerCase().includes(search.toLowerCase()) ||
      c.car_model.toLowerCase().includes(search.toLowerCase()) ||
      c.license_plate.toLowerCase().includes(search.toLowerCase())
  );

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
          <h1 className="text-2xl font-bold mb-1">{t("studio.clients.title")}</h1>
          <p className="text-sm text-zinc-400">{clients.length} {t("studio.clients.subtitle")}</p>
        </div>
        <Link href={`/studio/${params.slug}/clients/new`}>
          <Button>
            <Plus className="w-4 h-4" /> {t("studio.clients.new")}
          </Button>
        </Link>
      </div>

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
