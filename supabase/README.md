# Supabase — база даних Giovane Gentile

Бекенд сайту: товари та замовлення зберігаються в Supabase (Postgres).

## Файли
- `schema.sql` — таблиці `products`, `orders` та RLS-політики.
- `seed.mjs` — генерує ~104 демо-товари (одяг, взуття, аксесуари) з фото і наповнює базу.

## Конфігурація фронтенду
Публічні дані (URL проєкту + publishable/anon ключ) — у [`js/supabase.js`](../js/supabase.js).
Anon-ключ призначений для клієнта; запис захищено RLS-політиками.

## Як наповнити базу
```bash
SUPABASE_PAT=<supabase personal access token> \
SUPABASE_PROJECT_REF=<ref проєкту> \
node supabase/seed.mjs
```
Personal Access Token: Supabase → Account → Access Tokens.
Ref проєкту видно в URL дашборда: `supabase.com/dashboard/project/<REF>`.

## Серверні функції (Vercel, папка `/api`)
- `api/admin.js` — бекенд адмін-панелі (пароль `ADMIN_PASSWORD`, пише через `SUPABASE_PAT`).
- `api/liqpay.js` / `api/liqpay-callback.js` — оплата LiqPay (демо-режим без ключів).

Усі секрети — у змінних оточення Vercel. Приклад — [`.env.example`](../.env.example).
