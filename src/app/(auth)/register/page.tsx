import type { Metadata } from "next";
import Link from "next/link";
import { getI18n } from "@/i18n/server";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { NICHES } from "@/niches";

export const metadata: Metadata = { title: "Qeydiyyat" };

export default async function RegisterPage() {
  const { locale, t } = await getI18n();
  const niches = NICHES.map((n) => ({ id: n.id, name: n.name[locale], tagline: n.tagline[locale], icon: n.icon, enabled: n.enabled }));
  return (
    <div className="w-full max-w-lg">
      <h1 className="text-2xl font-semibold tracking-tight">{t.auth.registerTitle}</h1>
      <p className="mt-1 text-sm text-fg-muted">{t.auth.registerSubtitle}</p>
      <RegisterForm t={t} niches={niches} mode="register" />
      <p className="mt-6 text-sm text-fg-muted">
        {t.auth.haveAccount}{" "}
        <Link href="/login" className="font-medium text-fg underline-offset-4 hover:underline">
          {t.auth.loginButton}
        </Link>
      </p>
    </div>
  );
}
