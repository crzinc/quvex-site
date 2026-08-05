# Quvex Site

Мультитенантная CRM для автодетейлинг студий. Next.js (App Router, Turbopack) + React 19 + Tailwind CSS v4 + Supabase.

## Запуск

```bash
npm install
npm run dev
```

Открыть [http://localhost:3000](http://localhost:3000).

## Переменные окружения (`.env.local`)

| Переменная | Назначение |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL Supabase-проекта |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Публичный (anon) ключ — используется в клиенте и для входа |
| `SUPABASE_SERVICE_ROLE_KEY` | Сервисный ключ — только на сервере (создание студий, сид услуг, квиз) |

## Роли

- **admin** — сотрудники Quvex, доступ к `/dashboard/*` (все данные всех студий, лиды, платежи).
- **studio** — владелец студии, доступ только к своей CRM `/studio/[slug]/*` (изоляция данных через RLS и таблицу `user_studios`).

## Маршруты

### Публичные

| Маршрут | Описание |
| --- | --- |
| `/` | Лендинг + квиз (заявка лида) |

### Авторизация

| Маршрут | Описание |
| --- | --- |
| `/auth/login` | Вход. После входа: admin → `/dashboard`, studio → свой `/studio/[slug]` |
| `/auth/callback` | OAuth callback (exchange кода) |

### Дашборд админа (`/dashboard`)

| Маршрут | Описание |
| --- | --- |
| `/dashboard` | Главная — статистика и сводка |
| `/dashboard/clients` | Список лидов/клиентов (из квиза) |
| `/dashboard/clients/new` | Создать клиента вручную |
| `/dashboard/clients/[id]` | Карточка клиента + заметки |
| `/dashboard/messages` | Сообщения лидов |
| `/dashboard/payments` | Платежи студий |
| `/dashboard/requests` | Заявки с квиза |
| `/dashboard/studios` | Список студий |
| `/dashboard/studios/new` | Создание аккаунта студии (логин/пароль выдаются один раз) |
| `/dashboard/studios/[id]` | Карточка студии: клиенты, записи, платежи |
| `/dashboard/settings` | Настройки админа |

### CRM студии (`/studio/[slug]`, доступ только для участника студии)

| Маршрут | Описание |
| --- | --- |
| `/studio/[slug]` | Дашборд студии — статистика |
| `/studio/[slug]/clients` | Клиенты студии |
| `/studio/[slug]/clients/new` | Новый клиент |
| `/studio/[slug]/clients/[id]` | Карточка клиента студии |
| `/studio/[slug]/appointments` | Записи (при завершении создаётся доход и обновляется статистика клиента) |
| `/studio/[slug]/appointments/new` | Новая запись |
| `/studio/[slug]/services` | Услуги студии |
| `/studio/[slug]/messages` | Сообщения студии |
| `/studio/[slug]/finance` | Финансы: доходы, расходы, возвраты, баланс |
| `/studio/[slug]/settings` | Настройки студии: профиль, логотип, тема (пресеты + свой цвет) |

## Доступ и охрана маршрутов

- `/dashboard/*` — только роль `admin`; остальные редиректятся в свою студию или на `/`.
- `/studio/[slug]/*` — только участник студии (`user_studios`); иначе редирект на `/dashboard`.
- Проверка роли идёт через `auth.getUser()` (валидирует токен на auth-сервере и берёт актуальный `app_metadata`), поэтому изменения роли применяются без повторного входа.
- Доступ к данным в БД ограничен RLS: admin видит всё, владелец студии — только строки своей `studio_id`.

## Схема данных

`supabase-schema.sql` — мультитенантная схема: `studios`, `user_studios`, `studio_clients`, `studio_services`, `studio_appointments`, `studio_transactions`, `studio_messages`, `payments` + таблицы лидов (`clients`, `notes`, `notifications`). Применяется идемпотентно через Management API.

## Скрипты

| Скрипт | Описание |
| --- | --- |
| `scripts/promote-admin.mjs` | Назначить роль `admin` пользователю (email в аргументе) |
| `scripts/verify-isolation.mjs` | Проверка изоляции тенантов (studio owner не видит данные других) |
| `scripts/verify-admin.mjs` | Проверка полного доступа роли `admin` |

```bash
node scripts/promote-admin.mjs user@example.com
node scripts/verify-isolation.mjs
node scripts/verify-admin.mjs
```
