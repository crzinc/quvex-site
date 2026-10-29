import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProfile, getUser } from "@/lib/auth";
import { getI18n } from "@/i18n/server";
import { provisionTenant, type NewBusiness } from "@/lib/tenants";
import { getNiche } from "@/niches";
import { Logo } from "@/components/Logo";
import { ButtonLink } from "@/components/ui";

/** Entry point after login: finishes pending sign-up provisioning and routes to the right business. */
export default async function AppIndex() {
  const user = await getUser();
  if (!user) redirect("/login");
  const supabase = await createClient();
  const { locale, t } = await getI18n();

  const { data: memberships } = await supabase
    .from("memberships")
    .select("role, tenants(slug, name, niche)")
    .eq("user_id", user.id);
  const tenants = (memberships ?? []).flatMap((m) => (m.tenants ? [m.tenants as unknown as { slug: string; name: string; niche: string }] : []));

  if (tenants.length === 0) {
    const pending = user.user_metadata?.pending_business as NewBusiness | null | undefined;
    if (pending?.name) {
      const tenant = await provisionTenant(supabase, pending, locale);
      await supabase.auth.updateUser({ data: { pending_business: null } });
      redirect(`/app/${tenant.slug}`);
    }
    const profile = await getProfile();
    redirect(profile?.is_platform_admin ? "/admin" : "/app/new");
  }
  if (tenants.length === 1) redirect(`/app/${tenants[0].slug}`);

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Logo href="/app" />
      <div className="mt-10 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
        {tenants.map((tn) => (
          <Link key={tn.slug} href={`/app/${tn.slug}`} className="flex items-center justify-between px-5 py-4 hover:bg-surface-2">
            <div>
              <div className="font-medium">{tn.name}</div>
              <div className="text-sm text-fg-muted">{getNiche(tn.niche).name[locale]}</div>
            </div>
            <ChevronRight className="size-4 text-fg-subtle" />
          </Link>
        ))}
      </div>
      <ButtonLink href="/app/new" variant="secondary" className="mt-4 w-full">+ {t.auth.registerTitle}</ButtonLink>
    </div>
  );
}
