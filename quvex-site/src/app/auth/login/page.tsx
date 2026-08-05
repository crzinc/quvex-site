"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";
import { useT } from "@/i18n/I18nProvider";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { t } = useT();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(t("common.login_error"));
      setLoading(false);
      return;
    }

    toast.success(t("common.login_success"));
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 hero-grid">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-xl p-8 glow">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-3 mb-6">
              <Image src="/logo.png" alt="Quvex CRM" width={80} height={80} className="rounded-2xl" />
              <span className="text-2xl font-bold gradient-text">Quvex CRM</span>
            </Link>
            <h1 className="text-2xl font-bold mb-2">{t("auth.title")}</h1>
            <p className="text-sm text-zinc-400">{t("auth.subtitle")}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label={t("auth.email_label")}
              type="email"
              placeholder="worker@quvex.dev"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div className="relative">
              <Input
                label={t("auth.password_label")}
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-zinc-500 hover:text-zinc-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Button type="submit" size="lg" className="w-full" loading={loading}>
              <LogIn className="w-4 h-4" />
              {t("auth.signin_btn")}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
