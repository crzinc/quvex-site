"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getStatusColor, formatDate, getInitials } from "@/lib/utils";
import { useT } from "@/i18n/I18nProvider";
import type { Client } from "@/types";

export default function RecentClients({ clients }: { clients: Client[] }) {
  const { t } = useT();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.recent_title")}</CardTitle>
        <Link href="/dashboard/clients" className="text-sm text-primary hover:underline flex items-center gap-1">
          {t("dashboard.recent_all")} <ArrowRight className="w-3 h-3" />
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {clients.map((client, i) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                href={`/dashboard/clients/${client.id}`}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-zinc-800/50 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary flex-shrink-0">
                  {getInitials(client.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{client.name}</p>
                  <p className="text-xs text-zinc-500 truncate">{client.company}</p>
                </div>
                <div className="text-right">
                  <Badge className={getStatusColor(client.status)}>{t(`status.${client.status}`)}</Badge>
                  <p className="text-xs text-zinc-600 mt-1">{formatDate(client.created_at)}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
