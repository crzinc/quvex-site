import { ArrowRight, Check, ClipboardList, Droplets, MessageCircle, Package, Percent, Sparkles, Users, Wallet, Wrench } from "lucide-react";
import { getI18n } from "@/i18n/server";
import { getUser } from "@/lib/auth";
import { NICHES } from "@/niches";
import { PLANS } from "@/config/plans";
import { ButtonLink, Badge } from "@/components/ui";
import { Logo } from "@/components/Logo";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { LeadForm } from "@/components/landing/LeadForm";
import { cn } from "@/lib/utils";

const featureIcons = [ClipboardList, Users, MessageCircle, Package, Percent, Wallet];
const nicheIcons = { wrench: Wrench, sparkles: Sparkles, droplets: Droplets, disc: Wrench };

export default async function LandingPage() {
  const { locale, t } = await getI18n();
  const user = await getUser();
  const l = t.landing;

  return (
    <div className="overflow-x-clip bg-bg">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-bg/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm text-fg-muted md:flex">
            <a href="#features" className="hover:text-fg">{l.navFeatures}</a>
            <a href="#pricing" className="hover:text-fg">{l.navPricing}</a>
            <a href="#faq" className="hover:text-fg">{l.navFaq}</a>
          </nav>
          <div className="flex items-center gap-2">
            <LocaleSwitcher locale={locale} className="hidden sm:inline-flex" />
            {user ? (
              <ButtonLink href="/app" size="sm">CRM <ArrowRight className="size-4" /></ButtonLink>
            ) : (
              <>
                <ButtonLink href="/login" variant="ghost" size="sm">{l.login}</ButtonLink>
                <ButtonLink href="/register" size="sm">{l.start}</ButtonLink>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-14 pb-20 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-24">
        <div className="min-w-0">
          <Badge tone="orange" className="mb-6">{l.badge}</Badge>
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">{l.heroTitle}</h1>
          <p className="mt-6 max-w-xl text-lg text-pretty text-fg-muted">{l.heroSubtitle}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/register" size="lg" variant="accent">
              {l.heroCta} <ArrowRight className="size-4" />
            </ButtonLink>
            <ButtonLink href="#demo" size="lg" variant="secondary">{l.heroSecondary}</ButtonLink>
          </div>
          <p className="mt-4 text-sm text-fg-subtle">{l.heroNote}</p>
        </div>
        <div className="min-w-0">
          <HeroMockup locale={locale} />
        </div>
      </section>

      {/* Pains */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">{l.painTitle}</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {l.pains.map((pain) => (
              <p key={pain} className="rounded-xl bg-surface-2 p-5 text-sm leading-relaxed text-fg-muted">{pain}</p>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{l.featuresTitle}</h2>
          <p className="mt-3 text-fg-muted">{l.featuresSubtitle}</p>
        </div>
        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {l.features.map((f, i) => {
            const Icon = featureIcons[i];
            return (
              <div key={f.title} className="bg-surface p-6 sm:p-8">
                <Icon className="size-5 text-accent" strokeWidth={1.75} />
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-fg-muted">{f.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Steps */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight">{l.stepsTitle}</h2>
        <ol className="mt-8 grid gap-6 sm:grid-cols-3">
          {l.steps.map((s, i) => (
            <li key={s.title} className="relative">
              <span className="text-sm font-semibold text-accent tabular-nums">0{i + 1}</span>
              <h3 className="mt-2 font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-fg-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Niches */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight">{l.nichesTitle}</h2>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {NICHES.map((n) => {
            const Icon = nicheIcons[n.icon];
            return (
              <div key={n.id} className="flex items-start gap-4 rounded-xl border border-border bg-surface p-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-surface-2">
                  <Icon className="size-5" strokeWidth={1.75} />
                </span>
                <div>
                  <div className="font-medium">{n.name[locale]}</div>
                  <div className="mt-0.5 text-sm text-fg-muted">{n.tagline[locale]}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-20 border-y border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{l.pricingTitle}</h2>
            <p className="mt-3 text-fg-muted">{l.pricingSubtitle}</p>
          </div>
          <div className="mx-auto mt-12 grid max-w-3xl gap-4 sm:grid-cols-2">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={cn(
                  "flex flex-col rounded-2xl border bg-bg p-6 sm:p-8",
                  plan.popular ? "border-accent ring-4 ring-accent/10" : "border-border",
                )}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{t.plans[plan.id]}</h3>
                  {plan.popular && <Badge tone="orange">{l.popular}</Badge>}
                </div>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-semibold tracking-tight">{plan.price} ₼</span>
                  <span className="text-fg-muted">{t.common.perMonth}</span>
                </div>
                <ul className="mt-6 flex-1 space-y-3 text-sm">
                  {plan.features[locale].map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-accent" /> {f}
                    </li>
                  ))}
                </ul>
                <ButtonLink href="/register" className="mt-8" variant={plan.popular ? "accent" : "secondary"}>
                  {l.heroCta}
                </ButtonLink>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-20 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight">{l.faqTitle}</h2>
        <div className="mt-8 divide-y divide-border border-y border-border">
          {l.faq.map((item) => (
            <details key={item.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                {item.q}
                <span className="text-fg-subtle transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-fg-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Lead */}
      <section id="demo" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-20 sm:px-6">
        <div className="rounded-2xl bg-primary p-6 text-primary-fg sm:p-10">
          <h2 className="text-2xl font-semibold tracking-tight">{l.leadTitle}</h2>
          <p className="mt-2 max-w-xl opacity-70">{l.leadSubtitle}</p>
          <div className="mt-6 [&_input]:border-transparent [&_input]:bg-surface [&_input]:text-fg">
            <LeadForm t={l} />
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-fg-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <Logo />
            <span>· {l.footer}</span>
          </div>
          <div className="flex items-center gap-4">
            <LocaleSwitcher locale={locale} className="sm:hidden" />
            <span>© {new Date().getFullYear()} Quvex</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/** Static product preview built from real UI primitives — no screenshots to keep in sync. */
function HeroMockup({ locale }: { locale: "az" | "ru" }) {
  const rows =
    locale === "az"
      ? [
          ["Kompüter diaqnostikası", "20 ₼"],
          ["Yağ və filtrin dəyişdirilməsi", "15 ₼"],
          ["Mühərrik yağı 5W-30 × 4", "56 ₼"],
          ["Yağ filtri", "12 ₼"],
        ]
      : [
          ["Компьютерная диагностика", "20 ₼"],
          ["Замена масла и фильтра", "15 ₼"],
          ["Моторное масло 5W-30 × 4", "56 ₼"],
          ["Масляный фильтр", "12 ₼"],
        ];
  return (
    <div className="relative sm:pb-8">
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-accent/15 via-transparent to-transparent blur-2xl" />
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-xl shadow-stone-900/5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs text-fg-muted">{locale === "az" ? "Sifariş-naryad" : "Заказ-наряд"} №1042</div>
            <div className="mt-1 text-lg font-semibold">Toyota Camry · 90-RR-777</div>
            <div className="text-sm text-fg-muted">Elvin Məmmədov · 128 450 km</div>
          </div>
          <Badge tone="green">{locale === "az" ? "Hazırdır" : "Готов"}</Badge>
        </div>
        <div className="mt-5 divide-y divide-border rounded-xl border border-border text-sm">
          {rows.map(([name, price]) => (
            <div key={name} className="flex justify-between gap-4 px-4 py-2.5">
              <span className="truncate">{name}</span>
              <span className="tabular-nums text-fg-muted">{price}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-fg-muted">{locale === "az" ? "Cəmi" : "Итого"}</div>
            <div className="text-xl font-semibold tabular-nums">103 ₼</div>
          </div>
          <span className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#25D366] px-4 text-sm font-medium text-white">
            <MessageCircle className="size-4" /> WhatsApp
          </span>
        </div>
      </div>
      <div className="absolute -bottom-2 left-6 hidden rounded-xl border border-border bg-surface px-4 py-3 text-sm shadow-lg sm:block">
        <div className="text-xs text-fg-muted">{locale === "az" ? "Xatırlatma · 6 ay sonra" : "Напоминание · через 6 мес"}</div>
        <div className="font-medium">{locale === "az" ? "Yağın dəyişdirilməsi" : "Замена масла"}</div>
      </div>
    </div>
  );
}
