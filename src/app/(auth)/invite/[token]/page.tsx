import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { getI18n } from "@/i18n/server";
import { fill } from "@/i18n/dictionaries";
import { acceptInvitation } from "@/lib/actions/team";
import { logout } from "@/lib/actions/auth";
import { Badge, Button, ButtonLink } from "@/components/ui";
import { InviteRegisterForm } from "@/components/auth/InviteRegisterForm";
import type { Role } from "@/lib/types";

export default async function InvitePage({ params }: PageProps<"/invite/[token]">) {
  const { token } = await params;
  const { t } = await getI18n();
  const supabase = await createClient();
  const { data } = await supabase.rpc("invitation_preview", { p_token: token });
  const invite = (data as { tenant_name: string; role: Role; valid: boolean }[] | null)?.[0];
  const user = await getUser();

  if (!invite?.valid) {
    return (
      <div className="w-full max-w-sm">
        <p className="text-sm text-fg-muted">{t.invite.invalid}</p>
        <ButtonLink href="/login" variant="secondary" className="mt-6">{t.auth.loginButton}</ButtonLink>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-semibold tracking-tight">{fill(t.invite.title, { business: invite.tenant_name })}</h1>
      <div className="mt-3 flex items-center gap-2 text-sm text-fg-muted">
        {t.invite.as}: <Badge tone="orange">{t.settings.roles[invite.role]}</Badge>
      </div>
      <p className="mt-2 text-sm text-fg-muted">{t.settings.roleHints[invite.role]}</p>

      {user ? (
        <div className="mt-8">
          <div className="rounded-xl border border-border bg-surface px-4 py-3 text-sm">
            <span className="text-fg-muted">{t.invite.signedInAs}:</span> {user.email}
          </div>
          <form action={acceptInvitation.bind(null, token)} className="mt-4">
            <Button type="submit" size="lg" variant="accent" className="w-full">{t.invite.accept}</Button>
          </form>
          <form action={logout} className="mt-3">
            <input type="hidden" name="next" value={`/invite/${token}`} />
            <button type="submit" className="text-sm text-fg-muted hover:text-fg">{t.invite.notYou}</button>
          </form>
        </div>
      ) : (
        <>
          <h2 className="mt-8 text-sm font-semibold">{t.invite.createAccount}</h2>
          <InviteRegisterForm t={t} token={token} />
          <p className="mt-6 text-sm text-fg-muted">
            {t.invite.orLogin}{" "}
            <Link href={`/login?next=/invite/${token}`} className="font-medium text-fg underline-offset-4 hover:underline">
              {t.auth.loginButton}
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
