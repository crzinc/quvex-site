import { getI18n } from "@/i18n/server";
import { NICHES } from "@/niches";
import { Logo } from "@/components/Logo";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default async function NewBusinessPage() {
  const { locale, t } = await getI18n();
  const niches = NICHES.map((n) => ({ id: n.id, name: n.name[locale], tagline: n.tagline[locale], icon: n.icon, enabled: n.enabled }));
  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <Logo href="/app" />
      <h1 className="mt-10 text-2xl font-semibold tracking-tight">{t.auth.registerTitle}</h1>
      <RegisterForm t={t} niches={niches} mode="business" />
    </div>
  );
}
