# Quvex — гайд по масштабированию (для ИИ и разработчиков)

> Прочитай этот файл целиком, прежде чем выполнять любую задачу про новую нишу, новую роль, новый модуль, новые тарифы или изменение схемы БД. Здесь — архитектура, правила, которые нельзя нарушать, пошаговые рецепты и чек-лист «готово».

---

## 0. Контекст продукта (зачем всё так устроено)

- **Quvex** — мультитенантная вертикальная CRM для сервисного бизнеса Азербайджана. Первая ниша — автосервисы (СТО). Стратегия — в `STRATEGY.md`.
- **Порядок расширения:** сначала соседние авто-ниши (детейлинг, мойка, шиномонтаж, кузовной ремонт, магазины запчастей) — у них общий «объект» (машина) и общий конечный клиент (автовладелец). Только потом другие вертикали (клиники, салоны, фитнес).
- **Главный принцип:** *ниша = конфигурация, а не код.* Новая ниша — это файл в `src/niches/`, а не новые страницы, таблицы или `if (niche === …)`.
- **Пользователь** — владелец малого бизнеса, часто с телефона, слабо технически подкован. Простота важнее функций.
- **Языки:** азербайджанский (основной) и русский. Валюта — AZN (₼). Канал общения с клиентами — WhatsApp.

---

## 1. Стек и где что лежит

| Слой | Технология |
|---|---|
| Фронт и сервер | Next.js 16 (App Router, Server Components, Server Actions), React 19, TypeScript |
| Стили | Tailwind CSS v4, семантические токены в `src/app/globals.css` |
| БД, Auth | Supabase (Postgres + RLS + Auth), проект `quvex-site`, ref `ktkbdwwnloflzghihroj` |
| Хостинг | Vercel: пуш в `main` → автодеплой на quvex.org |

```
src/
  app/
    (marketing)/page.tsx        лендинг
    (auth)/                     login, register, forgot/reset-password, invite/[token]
    app/page.tsx                роутер после входа (создаёт бизнес из pending_business)
    app/new/                    добавить ещё один бизнес
    app/[tenant]/               CRM бизнеса (layout = меню по шаблону роли)
      page.tsx                  главный экран — выбирается по workspace.home
      orders/ clients/ catalog/ staff/ finance/ reminders/ settings/
    print/[tenant]/orders/[id]  печатная форма A4 (без меню)
    admin/                      админка платформы (только is_platform_admin)
  niches/                       ★ ШАБЛОНЫ НИШ: types.ts, shared.ts, <niche>.ts, index.ts
  config/plans.ts               ★ тарифы: цены, лимиты пользователей, скидки за период
  lib/
    auth.ts                     requireTenant / requirePermission / requireAdmin, permissions()
    actions/                    server actions: crm.ts, team.ts, auth.ts, admin.ts, leads.ts
    tenants.ts                  provisionTenant(): создание бизнеса из шаблона
    payroll.ts                  расчёт заработка мастеров
    search.ts                   поиск клиентов/машин (нормализованный госномер, телефон)
    supabase/                   клиенты server/client/proxy
  i18n/                         az.ts (источник типа Dictionary), ru.ts, server.ts
  components/
    ui/                         дизайн-система (Button, Card, Field, ActionForm…)
    app/                        компоненты CRM; app/home/* — экраны ролей
    admin/  auth/  landing/  brand/
  proxy.ts                      (в Next 16 middleware называется proxy) — сессия и защита /app /admin /print
supabase/
  migrations/                   все изменения схемы, по порядку
  tests/                        локальные SQL-тесты RLS и триггеров + run-local.sh
docs/                           USER_GUIDE.md, SCALING.md (этот файл)
```

---

## 2. Модель данных (кратко)

- `tenants` — бизнес. `niche` (id шаблона), `modules text[]`, `settings jsonb` (переопределения, `print_note`), `plan`, `user_limit`, `trial_ends_at`, `paid_until`, `status`, `order_seq`.
- `profiles` (1:1 с `auth.users`), `memberships (tenant_id, user_id, role, staff_id)` — роли `owner | manager | staff`.
- `invitations` — одноразовые ссылки (7 дней), `role`, `staff_id`.
- CRM: `clients`, `assets` (**обобщённый объект обслуживания**: машина/питомец/пациент; `kind`, `title`, `identifier`, `identifier_norm` generated, `attributes jsonb`), `catalog_items` (service|part, `stock`), `staff` (мастера, `commission_percent`), `orders` (`number` по тенанту, `status` = id из шаблона ниши, `attributes jsonb`, `subtotal`, `discount_percent`, `total`, `paid`, `debt` generated), `order_items`, `payments` (`direction in|out`), `reminders`.
- Платформа: `leads`, `billing_payments`.

**Триггеры (не дублируй их логику в коде):** нумерация заказов; пересчёт `subtotal/total/paid` при изменении строк, оплат и скидки; списание/возврат склада; запрет скидки для staff; защита биллинга (`guard_tenant_billing`); защита последнего владельца; лимит пользователей (`enforce_user_limit`); `accept_invitation` (привязка/создание мастера).

---

## 3. Железные правила

1. **Нишевое — только в `src/niches/`.** Никаких `if (tenant.niche === "...")` в компонентах и экшенах. Нужна разница между нишами → добавь поле в `NicheConfig` и прочитай его.
2. **Новые поля объекта/заказа — в `attributes jsonb`** через `FieldDef` шаблона, а не новыми колонками. Колонка — только если по полю нужен индекс/поиск/ограничение для **всех** ниш (пример: `identifier_norm`).
3. **Каждая бизнес-таблица имеет `tenant_id` и RLS.** Политика изоляции — `(select public.is_platform_admin()) or tenant_id in (select public.my_tenant_ids())`: так проверка выполняется **один раз на запрос**, а не на каждую строку (не пиши `public.is_member(tenant_id)` в политиках SELECT — это вызов функции на каждую строку). Права ролей — **restrictive**-политики через `public.has_role(tenant_id, array[...])` (для DELETE/UPDATE одной строки это нормально), а для политик SELECT — `tenant_id in (select public.my_tenant_ids_with_role(array[...]))`. Права в UI (`permissions()` в `src/lib/auth.ts`) — зеркало БД, не замена.
4. **`security definer` функции** — всегда `set search_path = public`, проверка `auth.uid()`, `revoke execute ... from public, anon` где нужно.
5. **Миграции только добавляются.** Никогда не редактируй применённую миграцию — создай новую `supabase/migrations/YYYYMMDDHHMMSS_name.sql`.
6. **i18n:** любой текст в UI — через словарь. `src/i18n/az.ts` задаёт тип `Dictionary`; `ru.ts` обязан иметь те же ключи (иначе `tsc` упадёт). Нишевые тексты — `Localized` (`{ az, ru }`) прямо в шаблоне ниши.
7. **Деньги — в AZN**, формат через `money()`. Даты — `formatDate()` с таймзоной Asia/Baku. «Сегодня» — `bakuToday()`.
8. **Next 16 особенности:** `params`/`searchParams`/`cookies()` — асинхронные; типы страниц `PageProps<"/route">` (генерятся `npx next typegen`); после мутаций — `revalidatePath("/app/[tenant]", "layout")` (**шаблон маршрута, не литеральный путь** — иначе UI не обновится); `Date.now()`/`new Date()` в теле компонента запрещает линтер — выноси в хелперы (`daysAgo`, `daysUntil`).
9. **Формы** — `ActionForm` + server action `(…bound args, prevState, formData) => ActionState`. Валидация — zod. Ошибки пользователю — из словаря, детали — в `console.error`. Кнопки отправки — только `SubmitButton` / `PendingButton` (`components/ui/forms.tsx`): они блокируются и показывают спиннер, пока действие выполняется. Голый `<button type="submit">` в форме с server action не используй — пользователь не видит, что клик сработал.
10. **Скорость.** Пользователь — `getUser()` из `src/lib/auth.ts` (проверка JWT локально через `getClaims()`, без запроса к Supabase Auth); не вызывай `supabase.auth.getUser()` в страницах. Независимые запросы — в одном `Promise.all` (никаких последовательных `await` подряд). Не грузи на страницу сотни/тысячи строк «для поиска на клиенте» — ищи на сервере (пример: `searchClients` для формы нового заказа). Экшены над существующей строкой по id используют лёгкий `db(slug)` вместо `ctx(slug)` — RLS всё равно ограничивает доступ.
11. **Не ломай чужие данные в проде.** Тестовые данные — только с префиксом `e2e-`/`demo-` и удаляй их после. Реальные бизнесы (например, `amir`) не трогать.
12. **Секреты** не коммитить. В репозитории только публичные `NEXT_PUBLIC_*` (в `.env.production`). Service-role ключ приложению не нужен и не используется.

---

## 4. Рецепт: добавить новую нишу

Пример — «Шиномонтаж» (`tire_service`).

### Шаг 1. Конфиг ниши
Создай `src/niches/tire-service.ts` по образцу `auto-service.ts`:

```ts
import type { NicheConfig } from "./types";
import { defaultRoles, vehicleFields } from "./shared";

export const tireService: NicheConfig = {
  id: "tire_service",                 // стабильный id, хранится в tenants.niche — НЕ МЕНЯТЬ после релиза
  enabled: true,
  name: { az: "Təkər servisi", ru: "Шиномонтаж" },
  tagline: { az: "…", ru: "…" },
  icon: "disc",                        // иконка из union в types.ts (добавь новую в types + маппинги иконок)
  terms: { order: {…}, orders: {…}, asset: {…}, assets: {…}, staff: {…}, service: {…}, part: {…} },
  asset: vehicleFields,                // авто-ниши переиспользуют машину; не-авто — свой asset (см. шаг 1б)
  orderFields: [ { key: "tire_size", label: {…}, type: "text" } ],
  statuses: [                          // первый статус = статус нового заказа; kind: open | done | cancelled
    { id: "queue", label: {…}, kind: "open", tone: "slate" },
    …,
    { id: "closed", label: {…}, kind: "done", tone: "green" },
    { id: "cancelled", label: {…}, kind: "cancelled", tone: "red" },
  ],
  modules: ["orders", "inventory", "reminders", "staff", "finance"],
  reminderPresets: [ { id: "season", title: {…}, months: 6 } ],
  roles: defaultRoles,                 // или переопредели home/nav для ролей (см. car-wash.ts)
  catalog: [ /* стартовый прайс: kind, name {az,ru}, category {az,ru}, price, durationMin? */ ],
};
```

**1б. Не-авто ниша** (например, ветклиника): задай свой `asset` — `kind: "pet"`, `identifierLabel` («Кличка»/«Чип»), `fields` с типами `text|number|year`. Если нужен новый тип поля (например `date`, `select`) — добавь его в `FieldType` и обработай в `AssetFields.tsx` и в печатной форме.

### Шаг 2. Регистрация
`src/niches/index.ts`: импортируй и добавь в массив `NICHES` (порядок = порядок на экране регистрации).

### Шаг 3. Иконка
Если иконка новая — добавь ключ в union `icon` (`types.ts`) и в маппинги иконок: `src/app/(marketing)/page.tsx` (`nicheIcons`) и `src/components/auth/RegisterForm.tsx` (`icons`).

### Шаг 4. Лендинг (по необходимости)
Ниши выводятся на лендинге автоматически из `NICHES`. Если продукт выходит на новую вертикаль, а не авто — нужна отдельная посадочная (см. раздел 9).

### Шаг 5. Проверка
- `npx tsc --noEmit && npx eslint && npx next build`
- Зарегистрируй тестовый бизнес этой ниши (раздел 8), пройди: новый заказ → строки → статусы до «done» → оплата → печать → напоминание; проверь термины и статусы на обоих языках.

**Миграции для новой ниши не нужны.** Если оказались нужны — остановись и перепроверь правило 2.

---

## 5. Рецепт: роли и рабочие экраны

- Права ролей зашиты в БД (`has_role`) и в `permissions()` — меняются **редко** и только миграцией + правкой `permissions()` одновременно.
- Что видит роль (главный экран и меню) — **в шаблоне ниши**: `roles: Record<Role, RoleTemplate>`, где `home: "overview" | "board" | "my_work"`, `homeLabel`, `nav: NavId[]`.
- Новый вид главного экрана: добавь значение в `HomeView`, компонент в `src/components/app/home/`, ветку в `src/app/app/[tenant]/page.tsx`.
- Новая роль (например, `cashier`): миграция — расширить `check` в `memberships.role` и `invitations.role`, политики `has_role`; `Role` в `src/lib/types.ts`; `permissions()`; `roles` во всех нишах (TS заставит); словари `settings.roles`, `roleHints`; `InviteForm`.

---

## 6. Рецепт: модуль, тариф, текст

- **Модуль** (раздел, который бизнес может выключить): добавь в `ModuleId`, в `modules` нужных ниш, в `available` в `app/[tenant]/layout.tsx`, в `NavId`/`nav` шаблонов ролей, в словарь `settings.moduleNames`. Страницы модуля защищай `hasModule(...)` и при необходимости `requirePermission`.
- **Тарифы:** только `src/config/plans.ts` (цена, `userLimit`, тексты) + словарь `plans`. `TRIAL_USER_LIMIT` должен совпадать с `default` колонки `tenants.user_limit`. Лимит применяется в БД при смене тарифа админом (`setSubscription`/`recordBilling` пишут `user_limit`).
- **Тексты:** добавь ключ в `az.ts` и `ru.ts` в ту же секцию.

---

## 7. Рецепт: изменение схемы БД

1. Новый файл `supabase/migrations/<timestamp>_<name>.sql`. Пиши идемпотентно где можно; RLS для новых таблиц — сразу.
2. **Тест локально** (нужен локальный Postgres, например Postgres.app):
   ```bash
   supabase/tests/run-local.sh          # применяет ВСЕ миграции к временной БД и гоняет supabase/tests/*.sql
   ```
   Добавь свой тест `supabase/tests/<feature>.sql`: роли через `set role authenticated; set request.jwt.claim.sub = '<uuid>';`, недоверенные действия — в `do $$ … exception when others then raise notice …` или через `\set ON_ERROR_STOP 0`. Пустой `request.jwt.claim.sub` = доверенный SQL (как SQL Editor).
3. **Применить в прод** (Docker не нужен):
   ```bash
   supabase db query --linked -f supabase/migrations/<file>.sql
   supabase migration repair --status applied <timestamp> --linked
   supabase migration list --linked     # local == remote
   ```
4. Обнови типы в `src/lib/types.ts`, если менялись колонки.

> Если `supabase` не привязан: `supabase link --project-ref ktkbdwwnloflzghihroj`.

---

## 8. Проверка изменений (обязательно перед пушем)

1. `npx tsc --noEmit` · `npx eslint` · `npx next build` — без ошибок.
2. SQL-тесты: `supabase/tests/run-local.sh`.
3. **E2E в браузере на реальной базе** для пользовательских потоков:
   - Тестовых пользователей создавай SQL-сидом (без писем): вставка в `auth.users` + `auth.identities` с `extensions.crypt(password, extensions.gen_salt('bf'))`, email вида `e2e-…@quvex.test`, при необходимости `raw_user_meta_data.pending_business` — тогда бизнес создастся при первом входе.
   - Запусти `npx next dev -p <port>` (или `next build && next start` для скриншотов без dev-индикатора) и пройди сценарий через puppeteer-core с локальным Chrome.
   - Ждать обновления UI после действия — по изменению DOM (счётчик строк, текст), не по навигации.
   - **Удали тестовые данные:** `delete from tenants where slug like 'e2e-%'; delete from auth.users where email like 'e2e-%@quvex.test';`
4. Скриншоты ключевых экранов на десктопе (1440) и телефоне (390), светлая тема; проверь, что нет горизонтального скролла.

---

## 9. Масштабирование по этапам (стратегия → задачи)

| Этап | Цель | Что делать в коде |
|---|---|---|
| **1. СТО** (сейчас) | PMF в автосервисах | Улучшать текущие экраны; WhatsApp Business API; импорт из Excel; календарь записи |
| **2. Авто-соседи** | Детейлинг, мойка, шиномонтаж, кузовной | Новые файлы в `src/niches/` (рецепт 4); общая машина → единая история автовладельца |
| **3. Сеть автовладельцев** | Сетевой эффект | Публичная «сервисная книжка» по ссылке (новая публичная страница, данные по `assets.identifier_norm` с явным согласием); онлайн-запись |
| **4. Другие вертикали** | Клиники, салоны, фитнес | Не-авто `asset`, свои `statuses`, `orderFields`, роли; отдельная посадочная `(marketing)/<vertical>` с текстами из шаблона |
| **5. Платежи и финансы** | Доход с транзакций | Онлайн-оплата подписки (местный провайдер), автопродление, режим «только чтение» после окончания |

**Чего не делать:**
- визуальный конструктор шаблонов, пока ниш меньше ~5 — достаточно файлов;
- копировать страницы под нишу;
- хранить нишевые настройки в БД, пока их не нужно менять без деплоя (тогда — `tenants.settings` поверх шаблона);
- запускать две новые ниши одновременно (см. STRATEGY.md).

---

## 10. Деплой

- `git push origin main` → Vercel собирает и выкладывает на quvex.org (статус: `gh api repos/crzinc/quvex-site/commits/<sha>/status`).
- Регион функций Vercel — `syd1` (`vercel.json`), рядом с базой Supabase (ap-southeast-2, Сидней): каждый запрос к БД должен идти внутри одного региона. Если базу переносят — поменяй `regions` вместе с ней.
- Переменные окружения: публичные `NEXT_PUBLIC_SUPABASE_URL` и `NEXT_PUBLIC_SUPABASE_ANON_KEY` в закоммиченном `.env.production`; адрес сайта берётся из `VERCEL_PROJECT_PRODUCTION_URL`.
- Миграции применяются **отдельно** (раздел 7) — до деплоя кода, который на них опирается.
- Коммиты — только когда пользователь попросил. В конце коммита — строка `Co-Authored-By` по правилам сессии.

---

## 11. Чек-лист «готово»

- [ ] Нишевое — в `src/niches/`, без `if (niche === …)`
- [ ] Новые таблицы — с `tenant_id`, RLS, тестом в `supabase/tests/`
- [ ] Права: БД (`has_role`) и `permissions()` совпадают
- [ ] Тексты в `az.ts` и `ru.ts`
- [ ] `tsc`, `eslint`, `next build`, `run-local.sh` — зелёные
- [ ] E2E-сценарий пройден в браузере, тестовые данные удалены
- [ ] Миграция применена в прод и отмечена (`migration list` совпадает)
- [ ] `docs/USER_GUIDE.md` обновлён, если поменялось поведение для пользователя
- [ ] Этот файл обновлён, если поменялась архитектура или правила
