<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Quvex

Multi-tenant vertical CRM (Next.js 16 + Supabase + Vercel) for service businesses in Azerbaijan; first niche: auto service.

- **Before any task about new niches, roles, modules, plans, or the database schema, read `docs/SCALING.md` in full** — architecture, hard rules, step-by-step recipes and the definition of done.
- Product strategy: `STRATEGY.md`. End-user behaviour: `docs/USER_GUIDE.md` (update it when user-facing behaviour changes).
- Niche-specific behaviour lives only in `src/niches/` — never branch on `tenant.niche` in components or actions.
- UI text goes through `src/i18n/az.ts` and `src/i18n/ru.ts`; the user writes in Russian.
- Verify with `npx tsc --noEmit`, `npx eslint`, `npx next build`, and `supabase/tests/run-local.sh` for schema changes.
