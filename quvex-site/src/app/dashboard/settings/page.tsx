"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { useT } from "@/i18n/I18nProvider";

export default function SettingsPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { t } = useT();

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) { toast.error(error.message); } else {
      toast.success(t("common.employee_created"));
      setEmail(""); setPassword("");
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">{t("settings.title")}</h1>
        <p className="text-sm text-zinc-400">{t("settings.subtitle")}</p>
      </div>

      <Card>
        <CardHeader><CardTitle>{t("settings.create_title")}</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <Input label={t("settings.email_label")} type="email" placeholder="worker@quvex.dev" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input label={t("settings.password_label")} type="password" placeholder="Min 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            <Button type="submit" loading={loading}>{t("settings.create_btn")}</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t("settings.logout_title")}</CardTitle></CardHeader>
        <CardContent>
          <Button variant="danger" onClick={handleLogout}>
            <LogOut className="w-4 h-4" /> {t("settings.logout_btn")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
