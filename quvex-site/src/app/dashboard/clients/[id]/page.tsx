"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, Building, Calendar, DollarSign } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useT } from "@/i18n/I18nProvider";
import ClientActions from "./ClientActions";
import ClientNotes from "./ClientNotes";
import StatusSelector from "./StatusSelector";
import type { Client } from "@/types";

export default function ClientDetailPage() {
  const params = useParams();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useRef(createClient());
  const { t } = useT();

  useEffect(() => {
    supabase.current.from("clients").select("*").eq("id", params.id).single().then(({ data }) => {
      if (data) setClient(data as unknown as Client);
      setLoading(false);
    });
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-20">
        <p className="text-zinc-500">Client not found</p>
        <Link href="/dashboard/clients" className="text-sm text-primary hover:underline mt-2 inline-block">← Back to clients</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/clients" className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{client.name}</h1>
              <StatusSelector clientId={client.id} current={client.status} />
            </div>
            <p className="text-sm text-zinc-400">{client.company}</p>
          </div>
        </div>
        <ClientActions clientId={client.id} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>{t("client.info_title")}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-zinc-500" />
                    <span className="text-zinc-300">{client.email || "—"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-zinc-500" />
                    <span className="text-zinc-300">{client.phone || "—"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Building className="w-4 h-4 text-zinc-500" />
                    <span className="text-zinc-300">{client.company || "—"}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-zinc-500" />
                    <span className="text-zinc-300">{formatDate(client.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <DollarSign className="w-4 h-4 text-zinc-500" />
                    <span className="text-zinc-300">{client.budget ? formatCurrency(client.budget) : "—"}</span>
                  </div>
                  {client.source && (
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-zinc-500">{t("client.source")}:</span>
                      <span className="text-zinc-300">{client.source}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t("client.desc_title")}</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-300 leading-relaxed">{client.description || t("client.desc_empty")}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t("client.next_action_title")}</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-300">{client.next_action || t("client.next_action_empty")}</p>
                {client.next_action_date && (
                  <Badge variant="warning">{formatDate(client.next_action_date)}</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <ClientNotes clientId={client.id} />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>{t("client.status_title")}</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-zinc-400">{t("client.status_current")}</p>
                <StatusSelector clientId={client.id} current={client.status} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t("client.quiz_title")}</CardTitle></CardHeader>
            <CardContent>
              {client.quiz_results ? (
                <div className="space-y-2 text-sm">
                  <p><span className="text-zinc-500">{t("client.quiz_business")}:</span> {client.quiz_results.business_type}</p>
                  <p><span className="text-zinc-500">{t("client.quiz_budget")}:</span> {client.quiz_results.budget}</p>
                  <p><span className="text-zinc-500">{t("client.quiz_timeline")}:</span> {client.quiz_results.timeline}</p>
                </div>
              ) : (
                <p className="text-sm text-zinc-500">{t("client.quiz_empty")}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t("client.quick_actions")}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Link href={`mailto:${client.email}`}>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Mail className="w-4 h-4" /> {t("client.email_btn")}
                </Button>
              </Link>
              <a href={`tel:${client.phone}`}>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Phone className="w-4 h-4" /> {t("client.call_btn")}
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
