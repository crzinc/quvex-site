"use client";

import { motion } from "framer-motion";
import { Users, Briefcase, TrendingUp, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/I18nProvider";

interface StatsCardsProps {
  stats: {
    total_clients: number;
    active_projects: number;
    monthly_leads: number;
    conversion_rate: number;
    revenue: number;
  };
}

const cards = [
  { key: "total_clients", label: "dashboard.stat_total", icon: Users, color: "text-blue-400 bg-blue-500/10", format: (v: number) => v.toString() },
  { key: "active_projects", label: "dashboard.stat_active", icon: Briefcase, color: "text-emerald-400 bg-emerald-500/10", format: (v: number) => v.toString() },
  { key: "monthly_leads", label: "dashboard.stat_leads", icon: TrendingUp, color: "text-purple-400 bg-purple-500/10", format: (v: number) => v.toString() },
  { key: "revenue", label: "dashboard.stat_revenue", icon: DollarSign, color: "text-yellow-400 bg-yellow-500/10", format: (v: number) => `₼${(v / 1000).toFixed(1)}K` },
];

export default function StatsCards({ stats }: StatsCardsProps) {
  const { t } = useT();

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <Card className="hover:bg-zinc-900/80 transition-colors">
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-zinc-400">{t(card.label)}</span>
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", card.color)}>
                  <card.icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold">
                {card.format(stats[card.key as keyof typeof stats] as number)}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
