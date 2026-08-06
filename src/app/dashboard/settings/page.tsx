"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { LogOut, Building, Plus } from "lucide-react";
import { useT } from "@/i18n/I18nProvider";

export default function SettingsPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [studioForm, setStudioForm] = useState({
    name: "",
    slug: "",
    owner_email: "",
    owner_phone: "",
    address: "",
    description: "",
  });
  const [studioLoading, setStudioLoading] = useState(false);
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

  const handleCreateStudio = async (e: React.FormEvent) => {
    e.preventDefault();
    setStudioLoading(true);

    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: studioForm.owner_email,
      password: Math.random().toString(36).slice(-8),
      email_confirm: true,
    });

    if (userError) {
      toast.error(t("admin.settings.user_create_error") + userError.message);
      setStudioLoading(false);
      return;
    }

    const { data: studio, error: studioError } = await supabase.from("studios").insert({
      name: studioForm.name,
      slug: studioForm.slug,
      owner_email: studioForm.owner_email,
      owner_phone: studioForm.owner_phone,
      address: studioForm.address,
      description: studioForm.description,
    }).select().single();

    if (studioError) {
      toast.error(t("admin.settings.studio_create_error") + studioError.message);
      setStudioLoading(false);
      return;
    }

    const { error: linkError } = await supabase.from("user_studios").insert({
      user_id: userData.user.id,
      studio_id: studio.id,
      role: "owner",
    });

    if (linkError) {
      toast.error(t("admin.settings.user_link_error") + linkError.message);
      setStudioLoading(false);
      return;
    }

    toast.success(t("admin.settings.studio_created") + studioForm.owner_email);
    setStudioForm({ name: "", slug: "", owner_email: "", owner_phone: "", address: "", description: "" });
    setStudioLoading(false);
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            {t("admin.settings.create_studio")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateStudio} className="space-y-4">
            <Input label={`${t("admin.settings.studio_name")} *`} placeholder={t("admin.settings.studio_name_placeholder")} value={studioForm.name} onChange={(e) => setStudioForm({ ...studioForm, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-") })} required />
            <Input label={t("admin.settings.slug")} placeholder={t("admin.settings.slug_placeholder")} value={studioForm.slug} onChange={(e) => setStudioForm({ ...studioForm, slug: e.target.value })} required />
            <Input label={`${t("admin.settings.owner_email")} *`} type="email" placeholder={t("admin.settings.owner_email_placeholder")} value={studioForm.owner_email} onChange={(e) => setStudioForm({ ...studioForm, owner_email: e.target.value })} required />
            <div className="grid grid-cols-2 gap-4">
              <Input label={t("admin.settings.phone")} type="tel" placeholder="+7 (999) 123-45-67" value={studioForm.owner_phone} onChange={(e) => setStudioForm({ ...studioForm, owner_phone: e.target.value })} />
              <Input label={t("admin.settings.address")} placeholder={t("admin.settings.address_placeholder")} value={studioForm.address} onChange={(e) => setStudioForm({ ...studioForm, address: e.target.value })} />
            </div>
            <Textarea label={t("admin.settings.description")} placeholder={t("admin.settings.description_placeholder")} value={studioForm.description} onChange={(e) => setStudioForm({ ...studioForm, description: e.target.value })} rows={3} />
            <Button type="submit" loading={studioLoading}>
              <Plus className="w-4 h-4" /> {t("admin.settings.create")}
            </Button>
          </form>
        </CardContent>
      </Card>

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
