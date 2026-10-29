import Link from "next/link";
import { getI18n } from "@/i18n/server";
import { ForgotPasswordForm } from "@/components/auth/PasswordForms";

export default async function ForgotPasswordPage() {
  const { t } = await getI18n();
  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-semibold tracking-tight">{t.auth.forgotTitle}</h1>
      <p className="mt-1 text-sm text-fg-muted">{t.auth.forgotSubtitle}</p>
      <ForgotPasswordForm t={t} />
      <Link href="/login" className="mt-6 inline-block text-sm text-fg-muted hover:text-fg">← {t.auth.backToLogin}</Link>
    </div>
  );
}
