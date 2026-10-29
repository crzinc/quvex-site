import { X } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { Badge, Card, CardHeader, Field, Input, PageHeader, Textarea } from "@/components/ui";
import { ActionForm, AutoSubmitSelect, ConfirmForm, SubmitButton } from "@/components/ui/forms";
import { InviteForm } from "@/components/app/InviteForm";
import { updateTenant } from "@/lib/actions/crm";
import { createInvitation, removeMember, revokeInvitation, setMemberRole, setMemberStaff } from "@/lib/actions/team";
import { fill } from "@/i18n/dictionaries";
import { planPrice } from "@/config/plans";
import { daysAgo, formatDate } from "@/lib/utils";
import type { Invitation, Role } from "@/lib/types";

const ROLES: Role[] = ["owner", "manager", "staff"];

export default async function SettingsPage({ params }: PageProps<"/app/[tenant]/settings">) {
  const { tenant: slug } = await params;
  const { supabase, tenant, niche, locale, t, user } = await requirePermission(slug, "settings");

  const [{ data: members }, { data: invites }, { data: staffList }] = await Promise.all([
    supabase.from("memberships").select("user_id, role, staff_id, profiles(full_name, email)").eq("tenant_id", tenant.id).order("created_at"),
    supabase
      .from("invitations")
      .select("*")
      .eq("tenant_id", tenant.id)
      .is("accepted_at", null)
      .gt("expires_at", daysAgo(0).toISOString())
      .order("created_at", { ascending: false })
      .returns<Invitation[]>(),
    supabase.from("staff").select("id, name").eq("tenant_id", tenant.id).eq("active", true).order("name"),
  ]);

  const used = (members?.length ?? 0) + (invites?.length ?? 0);
  const full = tenant.user_limit !== null && used >= tenant.user_limit;
  const linked = new Set((members ?? []).map((m) => m.staff_id).filter(Boolean));
  const unlinkedStaff = (staffList ?? []).filter((s) => !linked.has(s.id));

  return (
    <>
      <PageHeader title={t.settings.title} />
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <ActionForm action={updateTenant.bind(null, slug)} resetOnSuccess={false} successMessage={t.settings.saved} className="grid content-start gap-6">
          <Card>
            <CardHeader title={t.settings.business} />
            <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
              <Field label={t.auth.businessName} className="sm:col-span-2">
                <Input name="name" required defaultValue={tenant.name} />
              </Field>
              <Field label={t.auth.city}>
                <Input name="city" defaultValue={tenant.city ?? ""} />
              </Field>
              <Field label={t.common.phone} hint="WhatsApp">
                <Input name="phone" type="tel" defaultValue={tenant.phone ?? ""} />
              </Field>
              <Field label={t.settings.address} className="sm:col-span-2">
                <Input name="address" defaultValue={tenant.address ?? ""} />
              </Field>
              <Field label={t.settings.printNote} hint={t.settings.printNoteHint} className="sm:col-span-2">
                <Textarea
                  name="print_note"
                  rows={2}
                  maxLength={500}
                  placeholder={t.settings.printNotePlaceholder}
                  defaultValue={typeof tenant.settings?.print_note === "string" ? tenant.settings.print_note : ""}
                />
              </Field>
            </div>
          </Card>
          <Card>
            <CardHeader title={t.settings.modules} />
            <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
              <p className="text-sm text-fg-muted sm:col-span-2">{t.settings.modulesHint}</p>
              {niche.modules.map((m) => (
                <label key={m} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-sm">
                  <input type="checkbox" name={`module.${m}`} defaultChecked={tenant.modules.includes(m)} className="size-4 accent-[var(--accent)]" />
                  {t.settings.moduleNames[m]}
                </label>
              ))}
            </div>
          </Card>
          <div>
            <SubmitButton pendingLabel={t.common.saving}>{t.common.save}</SubmitButton>
          </div>
        </ActionForm>

        <div className="grid content-start gap-6">
          <Card>
            <CardHeader
              title={t.settings.team}
              action={
                <span className={full ? "text-xs font-medium text-amber-600" : "text-xs text-fg-muted"}>
                  {fill(t.settings.seats, { used, limit: tenant.user_limit ?? t.settings.unlimited })}
                </span>
              }
            />
            <ul className="divide-y divide-border">
              {(members ?? []).map((m) => {
                const p = m.profiles as unknown as { full_name: string | null; email: string | null } | null;
                const isMe = m.user_id === user.id;
                return (
                  <li key={m.user_id} className="flex items-center gap-3 px-4 py-3 text-sm sm:px-5">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">
                        {p?.full_name ?? p?.email} {isMe && <span className="font-normal text-fg-subtle">({t.settings.you})</span>}
                      </span>
                      <span className="block truncate text-xs text-fg-muted">{p?.email}</span>
                      {m.role === "staff" && !isMe && (
                        <form action={setMemberStaff.bind(null, slug, m.user_id)} className="mt-1.5">
                          <AutoSubmitSelect name="staff_id" defaultValue={m.staff_id ?? ""} aria-label={t.settings.linkedAs} className="h-7 text-xs">
                            <option value="">{t.settings.linkedAs}: —</option>
                            {(staffList ?? [])
                              .filter((s) => s.id === m.staff_id || !linked.has(s.id))
                              .map((s) => (
                                <option key={s.id} value={s.id}>{t.settings.linkedAs}: {s.name}</option>
                              ))}
                          </AutoSubmitSelect>
                        </form>
                      )}
                    </span>
                    {isMe ? (
                      <Badge>{t.settings.roles[m.role as Role]}</Badge>
                    ) : (
                      <>
                        <form action={setMemberRole.bind(null, slug, m.user_id)}>
                          <AutoSubmitSelect name="role" defaultValue={m.role} aria-label={t.settings.role}>
                            {ROLES.map((r) => (
                              <option key={r} value={r}>{t.settings.roles[r]}</option>
                            ))}
                          </AutoSubmitSelect>
                        </form>
                        <ConfirmForm action={removeMember.bind(null, slug, m.user_id)} message={t.common.confirmDelete}>
                          <button type="submit" className="rounded-md p-1.5 text-fg-subtle hover:bg-surface-2 hover:text-red-600" aria-label={t.settings.remove}>
                            <X className="size-4" />
                          </button>
                        </ConfirmForm>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
            <div className="border-t border-border p-4 sm:p-5">
              <h3 className="mb-2 text-sm font-semibold">{t.settings.invite}</h3>
              <InviteForm
                action={createInvitation.bind(null, slug)}
                t={t}
                businessName={tenant.name}
                staff={unlinkedStaff}
                full={full ? fill(t.settings.seatsFull, { limit: tenant.user_limit ?? 0 }) : undefined}
              />
            </div>
            {!!invites?.length && (
              <div className="border-t border-border px-4 py-3 sm:px-5">
                <h3 className="mb-2 text-xs font-medium text-fg-muted">{t.settings.pendingInvites}</h3>
                <ul className="grid gap-2">
                  {invites.map((i) => (
                    <li key={i.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="min-w-0 truncate">
                        {i.name ?? "—"} · {t.settings.roles[i.role]}
                        <span className="text-xs text-fg-subtle"> · {t.settings.expires} {formatDate(i.expires_at, locale)}</span>
                      </span>
                      <form action={revokeInvitation.bind(null, slug, i.id)}>
                        <button type="submit" className="text-xs text-fg-muted hover:text-red-600">{t.settings.revoke}</button>
                      </form>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          <Card className="p-4 sm:p-5">
            <dl className="grid gap-4 text-sm">
              <div>
                <dt className="text-xs text-fg-muted">{t.settings.niche}</dt>
                <dd className="mt-1 font-medium">{niche.name[locale]}</dd>
              </div>
              <div>
                <dt className="text-xs text-fg-muted">{t.settings.plan}</dt>
                <dd className="mt-1 flex items-center gap-2 font-medium">
                  {t.plans[tenant.plan]}
                  {tenant.plan !== "trial" && <span className="text-fg-muted">{planPrice(tenant.plan)} ₼{t.common.perMonth}</span>}
                </dd>
                <dd className="mt-1 text-xs text-fg-muted">
                  {tenant.plan === "trial"
                    ? `${t.admin.trialUntil}: ${formatDate(tenant.trial_ends_at, locale)}`
                    : `${t.admin.paidUntil}: ${formatDate(tenant.paid_until, locale)}`}
                </dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </>
  );
}
