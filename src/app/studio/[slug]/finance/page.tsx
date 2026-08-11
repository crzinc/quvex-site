"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Plus, TrendingUp, TrendingDown, Wallet, ArrowDownLeft, ArrowUpRight, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatDate, formatCurrency, getPaymentMethodLabel, getCategoryLabel } from "@/lib/utils";
import { toast } from "sonner";
import { useT } from "@/i18n/I18nProvider";
import type { StudioTransaction } from "@/types";

export default function StudioFinancePage() {
  const params = useParams<{ slug: string }>();
  const { t } = useT();
  const supabase = useRef(createClient());
  const [transactions, setTransactions] = useState<StudioTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    type: "income",
    amount: "",
    category: "service",
    payment_method: "cash",
    description: "",
  });

  const fetchTransactions = async () => {
    const { data: studio } = await supabase.current
      .from("studios")
      .select("id")
      .eq("slug", params.slug)
      .single();

    if (!studio) return;

    const { data } = await supabase.current
      .from("studio_transactions")
      .select(
        "*, studio_clients(name, phone, car_make, car_model, license_plate), studio_appointments(service_id, scheduled_at, technician_name, studio_services(name))",
      )
      .eq("studio_id", studio.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (data) setTransactions(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.slug]);

  const handleAdd = async () => {
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) {
      toast.error(t("common.invalid_amount"));
      return;
    }

    const { data: studio } = await supabase.current
      .from("studios")
      .select("id")
      .eq("slug", params.slug)
      .single();

    if (!studio) return;

    const { error } = await supabase.current.from("studio_transactions").insert({
      studio_id: studio.id,
      type: form.type,
      amount,
      category: form.category,
      payment_method: form.payment_method,
      description: form.description,
    });

    if (error) {
      toast.error(t("common.transaction_error"));
    } else {
      toast.success(form.type === "income" ? t("common.income_added") : t("common.expense_added"));
      setForm({ type: "income", amount: "", category: "service", payment_method: "cash", description: "" });
      setShowForm(false);
      fetchTransactions();
    }
  };

  const income = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + Number(t.amount), 0);
  const expenses = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + Number(t.amount), 0);
  const monthIncome = transactions
    .filter((t) => t.type === "income" && new Date(t.created_at).getMonth() === new Date().getMonth())
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const filteredTransactions = transactions.filter((tx) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (tx.description || "").toLowerCase().includes(q) ||
      getPaymentMethodLabel(tx.payment_method, t).toLowerCase().includes(q) ||
      (tx.type === "income" ? t("studio.finance.income") : tx.type === "expense" ? t("studio.finance.expense") : t("studio.finance.refund")).toLowerCase().includes(q) ||
      String(Number(tx.amount)).includes(q) ||
      (tx.studio_clients?.name || "").toLowerCase().includes(q) ||
      (tx.studio_clients?.car_make || "").toLowerCase().includes(q) ||
      (tx.studio_clients?.car_model || "").toLowerCase().includes(q) ||
      (tx.studio_clients?.license_plate || "").toLowerCase().includes(q) ||
      (tx.studio_appointments?.studio_services?.name || "").toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    { title: t("studio.finance.month_income"), value: formatCurrency(monthIncome), icon: TrendingUp, color: "text-emerald-400" },
    { title: t("studio.finance.total_income"), value: formatCurrency(income), icon: ArrowDownLeft, color: "text-emerald-400" },
    { title: t("studio.finance.expenses"), value: formatCurrency(expenses), icon: TrendingDown, color: "text-accent" },
    { title: t("studio.finance.balance"), value: formatCurrency(income - expenses), icon: Wallet, color: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">{t("studio.finance.title")}</h1>
          <p className="text-sm text-zinc-400">{t("studio.finance.subtitle")}</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4" /> {t("studio.finance.add")}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">{card.title}</p>
                  <p className="text-2xl font-bold mt-1">{card.value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-zinc-800/50 ${card.color}`}>
                  <card.icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-medium mb-4">{t("studio.finance.new_op")}</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label={t("studio.finance.type")}
                  value={form.type}
                  onChange={(value) => setForm({ ...form, type: value })}
                  options={[
                    { value: "income", label: t("studio.finance.income") },
                    { value: "expense", label: t("studio.finance.expense") },
                    { value: "refund", label: t("studio.finance.refund") },
                  ]}
                />
                <Input
                  label={`${t("studio.finance.amount")} *`}
                  type="number"
                  placeholder="5000"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label={t("studio.finance.category")}
                  value={form.category}
                  onChange={(value) => setForm({ ...form, category: value })}
                  options={[
                    { value: "service", label: t("category.service") },
                    { value: "product", label: t("category.product") },
                    { value: "subscription", label: t("category.subscription") },
                    { value: "other", label: t("category.other") },
                  ]}
                />
                <Select
                  label={t("studio.finance.method")}
                  value={form.payment_method}
                  onChange={(value) => setForm({ ...form, payment_method: value })}
                  options={[
                    { value: "cash", label: t("payment_method.cash") },
                    { value: "card", label: t("payment_method.card") },
                    { value: "transfer", label: t("payment_method.transfer") },
                    { value: "other", label: t("payment_method.other") },
                  ]}
                />
              </div>
              <Input
                label={t("studio.finance.description")}
                placeholder={t("studio.finance.description_placeholder")}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <div className="flex gap-2">
                <Button onClick={handleAdd}>{t("studio.finance.add_btn")}</Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>{t("studio.finance.cancel")}</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          placeholder={t("studio.finance.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 transition-colors"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {filteredTransactions.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-12">{search ? t("studio.list.no_results") : t("studio.finance.empty")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left p-4 text-zinc-400 font-medium">{t("studio.finance.date")}</th>
                    <th className="text-left p-4 text-zinc-400 font-medium">{t("studio.finance.type_col")}</th>
                    <th className="text-left p-4 text-zinc-400 font-medium">{t("studio.finance.source_col")}</th>
                    <th className="text-left p-4 text-zinc-400 font-medium">{t("studio.finance.desc_col")}</th>
                    <th className="text-left p-4 text-zinc-400 font-medium">{t("studio.finance.method_col")}</th>
                    <th className="text-right p-4 text-zinc-400 font-medium">{t("studio.finance.amount_col")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((tx) => {
                    const client = tx.studio_clients;
                    const service = tx.studio_appointments?.studio_services?.name;
                    const car = [client?.car_make, client?.car_model].filter(Boolean).join(" ");
                    return (
                      <tr key={tx.id} className="border-b border-zinc-800/50">
                        <td className="p-4 text-zinc-500 whitespace-nowrap">{formatDate(tx.created_at)}</td>
                        <td className="p-4">
                          <span
                            className={
                              tx.type === "income"
                                ? "text-emerald-400 flex items-center gap-1.5"
                                : "text-accent flex items-center gap-1.5"
                            }
                          >
                            {tx.type === "income" ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                            {tx.type === "income" ? t("studio.finance.income") : tx.type === "expense" ? t("studio.finance.expense") : t("studio.finance.refund")}
                          </span>
                        </td>
                        <td className="p-4">
                          {client ? (
                            <div>
                              <p className="text-zinc-200 font-medium">{client.name}</p>
                              <p className="text-xs text-zinc-500">
                                {[car, client.license_plate, client.phone].filter(Boolean).join(" · ") || "—"}
                              </p>
                            </div>
                          ) : service ? (
                            <p className="text-zinc-200">{service}</p>
                          ) : (
                            <p className="text-zinc-500">{getCategoryLabel(tx.category, t)}</p>
                          )}
                        </td>
                        <td className="p-4 text-zinc-300">{tx.description || "—"}</td>
                        <td className="p-4 text-zinc-500">{getPaymentMethodLabel(tx.payment_method, t)}</td>
                        <td
                          className={`p-4 text-right font-medium whitespace-nowrap ${
                            tx.type === "income" ? "text-emerald-400" : "text-accent"
                          }`}
                        >
                          {tx.type === "income" ? "+" : "−"}
                          {formatCurrency(Number(tx.amount))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
