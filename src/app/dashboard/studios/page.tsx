"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Plus, Building } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { useT } from "@/i18n/I18nProvider";
import type { Studio, Plan } from "@/types";

export default function DashboardStudiosPage() {
  const [studios, setStudios] = useState<Studio[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = useRef(createClient());
  const { t } = useT();

  useEffect(() => {
    const fetchStudios = async () => {
      const [studiosResult, plansResult] = await Promise.all([
        supabase.current
          .from("studios")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase.current
          .from("plans")
          .select("*")
          .order("sort_order"),
      ]);

      if (studiosResult.data) setStudios(studiosResult.data);
      if (plansResult.data) setPlans(plansResult.data);
      setLoading(false);
    };

    fetchStudios();
  }, []);

  const getPlan = (studio: Studio) => plans.find((p) => p.id === studio.plan_id);
  const isOverdue = (studio: Studio) =>
    studio.subscription_end && new Date(studio.subscription_end) < new Date();

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
          <h1 className="text-2xl font-bold mb-1">{t("admin.studios.title")}</h1>
          <p className="text-sm text-zinc-400">{studios.length} {t("admin.studios.count")}</p>
        </div>
        <Link href="/dashboard/studios/new">
          <Button>
            <Plus className="w-4 h-4" /> {t("admin.studios.add")}
          </Button>
        </Link>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {studios.map((studio) => (
          <Link key={studio.id} href={`/dashboard/studios/${studio.id}`}>
            <Card className="hover:border-zinc-700 transition-colors cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Building className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{studio.name}</h3>
                      <p className="text-xs text-zinc-500">/{studio.slug}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    {getPlan(studio) && (
                      <Badge className="bg-primary/10 text-primary border-primary/20">
                        {getPlan(studio)?.name}
                      </Badge>
                    )}
                    {isOverdue(studio) && (
                      <Badge className="bg-red-500/10 text-red-400 border-red-500/20">
                        {t("subscription.overdue")}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">{t("admin.studios.owner")}</span>
                    <span className="text-zinc-300">{studio.owner_email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">{t("admin.studios.created")}</span>
                    <span className="text-zinc-300">{formatDate(studio.created_at)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">{t("admin.studios.status")}</span>
                    <Badge className={studio.is_active ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"}>
                      {studio.is_active ? t("admin.studios.active") : t("admin.studios.inactive")}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {studios.length === 0 && (
        <div className="text-center py-12">
          <Building className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-500">{t("admin.studios.empty")}</p>
        </div>
      )}
    </div>
  );
}
