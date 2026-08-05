"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Plus, Building } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getStatusColor, formatDate, getStatusLabel } from "@/lib/utils";
import type { Studio } from "@/types";

export default function DashboardStudiosPage() {
  const [studios, setStudios] = useState<Studio[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = useRef(createClient());

  useEffect(() => {
    const fetchStudios = async () => {
      const { data } = await supabase.current
        .from("studios")
        .select("*")
        .order("created_at", { ascending: false });

      if (data) setStudios(data);
      setLoading(false);
    };

    fetchStudios();
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
          <h1 className="text-2xl font-bold mb-1">Студии</h1>
          <p className="text-sm text-zinc-400">{studios.length} студий</p>
        </div>
        <Link href="/dashboard/studios/new">
          <Button>
            <Plus className="w-4 h-4" /> Добавить студию
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
                  <Badge className={getStatusColor(studio.plan)}>
                    {getStatusLabel(studio.plan)}
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Владелец</span>
                    <span className="text-zinc-300">{studio.owner_email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Создана</span>
                    <span className="text-zinc-300">{formatDate(studio.created_at)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Статус</span>
                    <Badge className={studio.is_active ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"}>
                      {studio.is_active ? "Активна" : "Неактивна"}
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
          <p className="text-zinc-500">Нет студий</p>
        </div>
      )}
    </div>
  );
}
