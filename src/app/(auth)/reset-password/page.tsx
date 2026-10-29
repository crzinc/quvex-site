import { getI18n } from "@/i18n/server";
import { getUser } from "@/lib/auth";
import { ButtonLink } from "@/components/ui";
import { ResetPasswordForm } from "@/components/auth/PasswordForms";

/** Reached from the e-mail link via /auth/callback, which signs the user in with a recovery session. */
export default async function ResetPasswordPage() {
  const { t } = await getI18n();
  const user = await getUser();
  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-semibold tracking-tight">{t.auth.resetTitle}</h1>
      {user ? (
        <>
          <p className="mt-1 text-sm text-fg-muted">{user.email}</p>
          <ResetPasswordForm t={t} />
        </>
      ) : (
        <>
          <p className="mt-3 text-sm text-fg-muted">{t.auth.resetExpired}</p>
          <ButtonLink href="/forgot-password" className="mt-6">{t.auth.sendResetLink}</ButtonLink>
        </>
      )}
    </div>
  );
}
