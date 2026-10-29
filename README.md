# Quvex

Вертикальная мультитенантная CRM для бизнеса Азербайджана. Старт: автосервисы (СТО); есть шаблоны детейлинга и автомойки.
Стек: Next.js 16 (App Router) · Supabase (Postgres + Auth + RLS) · Tailwind v4 · Vercel.

## Три части в одном приложении

| Часть | Маршрут | Кто видит |
| --- | --- | --- |
| Лендинг + заявки | `/`, `/register`, `/login` | все |
| CRM бизнеса | `/app/[tenant]/…` | участники бизнеса (RLS) |
| Админка платформы | `/admin/…` | `profiles.is_platform_admin = true` |

## Запуск

1. Проект Supabase: `quvex-site` (ref `ktkbdwwnloflzghihroj`), уже привязан и с применёнными миграциями.
   Для нового проекта: `supabase link --project-ref <ref> && supabase db push` (или выполните файлы из `supabase/migrations` по порядку).
2. Скопируйте `.env.example` → `.env.local`, впишите URL и publishable/anon key проекта.
3. `npm install && npm run dev` → http://localhost:3000
4. Зарегистрируйтесь через `/register`, затем сделайте себя админом:
   ```sql
   update public.profiles set is_platform_admin = true where email = 'you@example.com';
   ```

**Supabase Auth → URL Configuration:** добавьте `https://<домен>/auth/callback` в Redirect URLs.
Если подтверждение email включено, бизнес создаётся при первом входе (данные регистрации лежат в user metadata).

**Деплой на Vercel:** пуш в `main` запускает деплой. Публичные `NEXT_PUBLIC_SUPABASE_*` лежат в закоммиченном `.env.production` (publishable-ключ не секретный). Адрес сайта берётся из `VERCEL_PROJECT_PRODUCTION_URL`; `NEXT_PUBLIC_SITE_URL` нужен только для своего домена.
Сервисный ключ приложению не нужен: все права проверяются через RLS.

## Архитектура масштабирования по нишам

```
src/niches/            ← шаблоны ниш (данные, не код)
  types.ts             контракт NicheConfig
  auto-service.ts      термины, поля машины, статусы, модули, прайс, напоминания
  detailing.ts, car-wash.ts
  index.ts             реестр NICHES
```

При регистрации выбранный шаблон «разворачивается» в бизнес: включаются модули и создаётся стартовый каталог.
Термины («Заказ-наряд» / «Мойка»), поля объекта, статусы заказа и пресеты напоминаний интерфейс берёт из шаблона.

**Новая ниша** = новый файл в `src/niches/` + строка в `index.ts`. Миграции не нужны: нишевые поля
хранятся в `assets.attributes` и `orders.attributes` (jsonb), а объект обслуживания (`assets`) обобщён:
машина, питомец, пациент.

### База данных (`supabase/migrations`)
- У каждой бизнес-таблицы есть `tenant_id`, а единая RLS-политика `is_member(tenant_id)` изолирует данные.
- Триггеры: нумерация заказов внутри бизнеса, пересчёт `total/paid/debt`, списание и возврат запчастей на склад.
- Поля биллинга (`plan`, `paid_until`, …) меняет только платформенный админ (триггер-guard).

### Код
- `src/lib/actions/*`: server actions (CRM, auth, admin, leads), валидация через zod.
- `src/i18n/`: словари `az` (основной) и `ru`; язык хранится в cookie.
- `src/components/ui`: минимальная дизайн-система на семантических токенах (`globals.css`), светлая и тёмная тема.
- `src/proxy.ts`: обновление сессии и защита `/app` и `/admin` (в Next 16 middleware называется proxy).

## Что дальше (по стратегии, см. STRATEGY.md)
- WhatsApp Business API вместо ссылок `wa.me` (автоотправка напоминаний).
- Приглашение сотрудников в аккаунт (сейчас пользователь = владелец; роли в БД уже есть).
- Публичная «сервисная книжка» машины по ссылке для клиента.
- Онлайн-оплата подписки (m10 / Birbank / эквайринг).
