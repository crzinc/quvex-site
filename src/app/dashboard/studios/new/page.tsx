"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building, KeyRound, CheckCircle2, ExternalLink, Inbox, Search, Mail, Phone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { createStudioAccount, type StudioAccountInput } from "@/lib/studio-actions";
import { useT } from "@/i18n/I18nProvider";
import { createClient } from "@/lib/supabase/client";
import { cn, getStatusColor, getStatusLabel, formatCurrency } from "@/lib/utils";
import type { Client, Plan, SubscriptionPeriod } from "@/types";

const PERIODS: { value: SubscriptionPeriod; labelKey: string; months: number; discount: number }[] = [
  { value: "monthly", labelKey: "subscription.period_monthly", months: 1, discount: 0 },
  { value: "quarterly", labelKey: "subscription.period_quarterly", months: 3, discount: 10 },
  { value: "yearly", labelKey: "subscription.period_yearly", months: 12, discount: 20 },
];

function RequestPicker({
  requests,
  selectedId,
  onSelect,
}: {
  requests: Client[];
  selectedId: string | null;
  onSelect: (client: Client | null) => void;
}) {
  const { t } = useT();
  const [query, setQuery] = useState("");

  const filtered = requests.filter((r) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      r.name.toLowerCase().includes(q) ||
      (r.company || "").toLowerCase().includes(q) ||
      (r.email || "").toLowerCase().includes(q) ||
      (r.phone || "").toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("admin.studios.request_search")}
          className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/25 transition-all duration-200"
        />
      </div>

      <div className="mt-2 max-h-56 overflow-y-auto space-y-1">
        {filtered.length === 0 ? (
          <p className="text-sm text-zinc-500 py-4 text-center">{t("admin.studios.no_requests")}</p>
        ) : (
          filtered.map((r) => {
            const isSelected = r.id === selectedId;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => onSelect(isSelected ? null : r)}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-xl border transition-colors flex items-center gap-3",
                  isSelected
                    ? "bg-primary/10 border-primary/40"
                    : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50",
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white truncate">{r.name || "—"}</p>
                    {r.company && <p className="text-xs text-zinc-500 truncate">{r.company}</p>}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-500 mt-0.5">
                    {r.email && (
                      <span className="flex items-center gap-1 min-w-0">
                        <Mail className="w-3 h-3 shrink-0" />
                        <span className="truncate">{r.email}</span>
                      </span>
                    )}
                    {r.phone && (
                      <span className="flex items-center gap-1 shrink-0">
                        <Phone className="w-3 h-3" />
                        {r.phone}
                      </span>
                    )}
                    {r.budget ? <span className="text-zinc-400 shrink-0">{formatCurrency(r.budget)}</span> : null}
                  </div>
                </div>
                <Badge className={cn("shrink-0", getStatusColor(r.status))}>
                  {getStatusLabel(r.status, t)}
                </Badge>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function DashboardNewStudioPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ studio_id: string; name: string; owner_email: string; password: string } | null>(null);
  const { t } = useT();
  const [requests, setRequests] = useState<Client[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const supabase = useRef(createClient());
  const [plans, setPlans] = useState<Plan[]>([]);
  const [form, setForm] = useState({
    name: "",
    owner_email: "",
    owner_phone: "",
    address: "",
    description: "",
    password: "",
    plan_id: "",
    subscription_period: "monthly" as SubscriptionPeriod,
  });

  useEffect(() => {
    supabase.current.from("plans").select("*").order("sort_order").then(({ data }) => {
      if (data) setPlans(data as Plan[]);
    });
    supabase.current.from("clients").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setRequests(data as unknown as Client[]);
    });
  }, []);

  const selectedPlan = plans.find((p) => p.id === form.plan_id);
  const selectedPeriod = PERIODS.find((p) => p.value === form.subscription_period)!;
  const planPrice = selectedPlan
    ? Number(selectedPlan[selectedPeriod.value === "monthly" ? "price_monthly" : selectedPeriod.value === "quarterly" ? "price_quarterly" : "price_yearly"])
    : 0;

  const applyRequest = (client: Client | null) => {
    setSelectedRequestId(client?.id ?? null);
    if (!client) return;
    setForm({
      ...form,
      name: client.company || client.name,
      owner_email: client.email || "",
      owner_phone: client.phone || "",
      description: client.description || client.company || "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.plan_id) {
      toast.error(t("subscription.select_plan"));
      return;
    }
    setLoading(true);

    const input: StudioAccountInput = {
      name: form.name,
      owner_email: form.owner_email,
      owner_phone: form.owner_phone,
      address: form.address,
      description: form.description,
      password: form.password || undefined,
      plan_id: form.plan_id,
      subscription_period: form.subscription_period,
    };

    const res = await createStudioAccount(input);

    if (res.error) {
      toast.error(res.error);
      setLoading(false);
      return;
    }

    setResult(res);
    setLoading(false);
  };

  if (result) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/studios" className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{t("admin.studios.created_title")}</h1>
            <p className="text-sm text-zinc-400">{t("admin.studios.created_subtitle")}</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3 text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
              <p className="font-medium text-white">{t("admin.studios.ready")} «{result.name}»</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-zinc-800/50">
                <p className="text-xs text-zinc-500 mb-1">{t("admin.studios.login")}</p>
                <p className="font-mono text-sm">{result.owner_email}</p>
              </div>
              <div className="p-4 rounded-xl bg-zinc-800/50">
                <p className="text-xs text-zinc-500 mb-1">{t("admin.studios.password_label")}</p>
                <p className="font-mono text-sm flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-yellow-400" />
                  {result.password}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
              <p className="text-xs text-zinc-400 mb-1">{t("admin.studios.login_link")}</p>
              <p className="font-mono text-sm text-primary">
                {typeof window !== "undefined" ? window.location.origin : ""}/auth/login
              </p>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Link href={`/dashboard/studios`}>
                <Button variant="outline">{t("admin.studios.to_list")}</Button>
              </Link>
              <Link href={`/dashboard/studios/${result.studio_id}`}>
                <Button>
                  <ExternalLink className="w-4 h-4" /> {t("admin.studios.open")}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/studios" className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{t("admin.studios.new_title")}</h1>
          <p className="text-sm text-zinc-400">{t("admin.studios.new_subtitle")}</p>
        </div>
      </div>

      {requests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Inbox className="w-5 h-5" />
              {t("admin.studios.fill_from_request")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-400 mb-3">{t("admin.studios.fill_from_request_desc")}</p>
            <RequestPicker requests={requests} selectedId={selectedRequestId} onSelect={applyRequest} />
            {selectedRequestId && (
              <button
                type="button"
                onClick={() => applyRequest(null)}
                className="mt-3 inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
                {t("admin.studios.clear_request")}
              </button>
            )}
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              {t("admin.studios.studio_card")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label={`${t("admin.studios.name")} *`}
              placeholder={t("admin.studios.name_placeholder")}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={`${t("admin.studios.owner_email")} *`}
                type="email"
                placeholder="owner@studio.com"
                value={form.owner_email}
                onChange={(e) => setForm({ ...form, owner_email: e.target.value })}
                required
              />
              <Input
                label={t("admin.studios.owner_phone")}
                type="tel"
                placeholder="+7 (999) 123-45-67"
                value={form.owner_phone}
                onChange={(e) => setForm({ ...form, owner_phone: e.target.value })}
              />
            </div>
            <Input
              label={t("admin.studios.address")}
              placeholder="ул. Примерная, 123"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
            <Textarea
              label={t("admin.studios.description")}
              placeholder={t("admin.studios.description_placeholder")}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
            />
            <Input
              label={t("admin.studios.password")}
              placeholder={t("admin.studios.password_placeholder")}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("subscription.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setForm({ ...form, plan_id: plan.id })}
                  className={cn(
                    "text-left p-4 rounded-xl border transition-all duration-200",
                    form.plan_id === plan.id
                      ? "bg-primary/10 border-primary/40 ring-1 ring-primary/25"
                      : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700",
                  )}
                >
                  <p className="font-medium mb-1">{plan.name}</p>
                  <p className="text-xs text-zinc-500 mb-3">{t("subscription.max_clients_label")}: {plan.max_clients ? plan.max_clients : "∞"}</p>
                  <p className="text-lg font-bold text-primary">{formatCurrency(plan.price_monthly)}<span className="text-xs text-zinc-500 font-normal"> / {t("subscription.month")}</span></p>
                </button>
              ))}
            </div>

            <div>
              <p className="text-sm font-medium mb-2">{t("subscription.period_title")}</p>
              <div className="grid sm:grid-cols-3 gap-3">
                {PERIODS.map((period) => (
                  <button
                    key={period.value}
                    type="button"
                    onClick={() => setForm({ ...form, subscription_period: period.value })}
                    className={cn(
                      "text-left p-3 rounded-xl border transition-all duration-200",
                      form.subscription_period === period.value
                        ? "bg-primary/10 border-primary/40 ring-1 ring-primary/25"
                        : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700",
                    )}
                  >
                    <p className="text-sm font-medium">{t(period.labelKey)}</p>
                    <p className="text-xs text-zinc-500">
                      {period.discount > 0
                        ? t("subscription.save", { discount: period.discount })
                        : `${period.months} ${t("subscription.month")}`}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {selectedPlan && (
              <div className="p-4 rounded-xl bg-zinc-800/50 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{t("subscription.payable")}</p>
                  <p className="text-xs text-zinc-500">
                    {selectedPlan.name} · {t(selectedPeriod.labelKey)}
                  </p>
                </div>
                <p className="text-xl font-bold">{formatCurrency(planPrice)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Link href="/dashboard/studios">
            <Button type="button" variant="outline">{t("admin.studios.cancel")}</Button>
          </Link>
          <Button type="submit" loading={loading}>
            {t("admin.studios.create")}
          </Button>
        </div>
      </form>
    </div>
  );
}
