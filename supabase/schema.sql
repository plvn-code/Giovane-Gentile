-- Giovane Gentile — схема бази даних (Supabase / Postgres)
-- Застосувати через SQL Editor у Supabase або `supabase/seed.mjs`.

create table if not exists public.products (
  id text primary key,
  name text not null,
  brand text,
  category text,
  cat_key text,
  sub_key text,
  cat_title text,
  price integer not null,
  old_price integer,
  sale boolean default false,
  is_new boolean default false,
  sku text,
  material text,
  color text,
  sizes jsonb default '[]',
  description text,
  full_description jsonb default '[]',
  attributes jsonb default '{}',
  images jsonb default '[]',
  active boolean default true,
  sort integer default 0,
  created_at timestamptz default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  items jsonb not null default '[]',
  total integer not null default 0,
  currency text default 'UAH',
  status text default 'new',
  customer jsonb default '{}',
  liqpay_order_id text,
  liqpay_status text
);

alter table public.products enable row level security;
alter table public.orders enable row level security;

-- Товари: публічне читання
drop policy if exists "products public read" on public.products;
create policy "products public read" on public.products for select using (true);

-- Товари: запис лише автентифікованим (адмін діє через серверну функцію /api/admin)
drop policy if exists "products admin write" on public.products;
create policy "products admin write" on public.products for all to authenticated using (true) with check (true);

-- Замовлення: може створити будь-хто (оформлення на сайті)
drop policy if exists "orders insert anon" on public.orders;
create policy "orders insert anon" on public.orders for insert to anon, authenticated with check (true);

-- Замовлення: читання/оновлення — автентифікованим
drop policy if exists "orders admin read" on public.orders;
create policy "orders admin read" on public.orders for select to authenticated using (true);

drop policy if exists "orders admin update" on public.orders;
create policy "orders admin update" on public.orders for update to authenticated using (true) with check (true);
