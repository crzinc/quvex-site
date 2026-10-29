import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { AdminNav } from "@/components/admin/AdminNav";
import { Badge } from "@/components/ui";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile, locale, t } = await requireAdmin();
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <Logo href="/admin" />
            <Badge tone="orange">admin</Badge>
          </div>
          <AdminNav
            items={[
              { href: "/admin", label: t.admin.overview },
              { href: "/admin/tenants", label: t.admin.tenants },
              { href: "/admin/leads", label: t.admin.leads },
              { href: "/admin/niches", label: t.admin.niches },
            ]}
          />
          <div className="ml-auto flex items-center gap-3 text-sm text-fg-muted">
            <span className="hidden sm:inline">{profile.email}</span>
            <Link href="/app" className="hover:text-fg">CRM →</Link>
            <LocaleSwitcher locale={locale} />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
