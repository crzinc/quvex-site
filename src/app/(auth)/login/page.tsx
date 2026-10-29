import type { Metadata } from "next";
import Link from "next/link";
import { getI18n } from "@/i18n/server";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Login" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { t } = await getI18n();
  const { next } = await searchParams;
  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-semibold tracking-tight">{t.auth.loginTitle}</h1>
      <p className="mt-1 text-sm text-fg-muted">{t.auth.loginSubtitle}</p>
      <LoginForm t={t} next={typeof next === "string" ? next : "/app"} />
      <p className="mt-6 text-sm text-fg-muted">
        {t.auth.noAccount}{" "}
        <Link href="/register" className="font-medium text-fg underline-offset-4 hover:underline">
          {t.auth.register}
        </Link>
      </p>
    </div>
  );
}
