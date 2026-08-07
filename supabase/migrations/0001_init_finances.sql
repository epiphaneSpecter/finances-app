-- ============================================================================
-- Module Finances — schéma initial (Phase 1 / MVP)
-- Plateforme personnelle d'automatisation — voir CLAUDE.md
--
-- Principe de sécurité (CLAUDE.md §7) : Row Level Security activée sur TOUTES
-- les tables dès leur création. Chaque utilisateur ne voit que ses données.
-- ============================================================================

-- Extensions utiles
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- profiles : 1 ligne par utilisateur (relié à auth.users)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  currency    text not null default 'CAD',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- incomes : revenus (multiples et irréguliers — consulting, Uber, livraison…)
-- ----------------------------------------------------------------------------
create table if not exists public.incomes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  label        text not null,
  source       text,                       -- ex: "Consulting", "Uber", "Livraison"
  amount       numeric(12, 2) not null default 0,
  frequency    text not null default 'monthly',  -- 'once' | 'weekly' | 'monthly' | 'irregular'
  received_on  date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.incomes enable row level security;

drop policy if exists "incomes_all_own" on public.incomes;
create policy "incomes_all_own" on public.incomes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists incomes_user_id_idx on public.incomes (user_id);

-- ----------------------------------------------------------------------------
-- expenses : dépenses (sections : logement, assurances, abonnements, autres)
-- ----------------------------------------------------------------------------
create table if not exists public.expenses (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  label         text not null,
  category      text not null default 'autres', -- 'logement'|'assurances'|'abonnements'|'autres'
  amount        numeric(12, 2) not null default 0,
  frequency     text not null default 'monthly', -- 'once'|'weekly'|'monthly'|'yearly'
  due_day       int,                             -- jour du mois du prélèvement (1-31)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.expenses enable row level security;

drop policy if exists "expenses_all_own" on public.expenses;
create policy "expenses_all_own" on public.expenses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists expenses_user_id_idx on public.expenses (user_id);

-- ----------------------------------------------------------------------------
-- debts : dettes (cartes, prêts, marges de crédit…)
-- ----------------------------------------------------------------------------
create table if not exists public.debts (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users (id) on delete cascade,
  label              text not null,
  lender             text,
  balance            numeric(12, 2) not null default 0,   -- solde restant dû
  credit_limit       numeric(12, 2),                      -- pour l'alerte de dépassement
  interest_rate      numeric(5, 2),                       -- taux annuel en %
  minimum_payment    numeric(12, 2) not null default 0,   -- paiement mensuel minimum
  due_day            int,                                 -- jour du mois d'échéance (1-31)
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table public.debts enable row level security;

drop policy if exists "debts_all_own" on public.debts;
create policy "debts_all_own" on public.debts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists debts_user_id_idx on public.debts (user_id);

-- ----------------------------------------------------------------------------
-- debt_payments : historique des paiements sur les dettes
-- ----------------------------------------------------------------------------
create table if not exists public.debt_payments (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  debt_id     uuid not null references public.debts (id) on delete cascade,
  amount      numeric(12, 2) not null default 0,
  paid_on     date not null default current_date,
  note        text,
  created_at  timestamptz not null default now()
);

alter table public.debt_payments enable row level security;

drop policy if exists "debt_payments_all_own" on public.debt_payments;
create policy "debt_payments_all_own" on public.debt_payments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists debt_payments_user_id_idx on public.debt_payments (user_id);
create index if not exists debt_payments_debt_id_idx on public.debt_payments (debt_id);

-- ----------------------------------------------------------------------------
-- monthly_snapshots : suivi mensuel réel (onglet "Budget mensuel" de l'Excel)
-- ----------------------------------------------------------------------------
create table if not exists public.monthly_snapshots (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  month            date not null,                 -- 1er jour du mois concerné
  total_income     numeric(12, 2) not null default 0,
  total_expenses   numeric(12, 2) not null default 0,
  total_debt       numeric(12, 2) not null default 0,
  note             text,
  created_at       timestamptz not null default now(),
  unique (user_id, month)
);

alter table public.monthly_snapshots enable row level security;

drop policy if exists "monthly_snapshots_all_own" on public.monthly_snapshots;
create policy "monthly_snapshots_all_own" on public.monthly_snapshots
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists monthly_snapshots_user_id_idx on public.monthly_snapshots (user_id);

-- ----------------------------------------------------------------------------
-- Déclencheur : créer automatiquement un profil à l'inscription d'un utilisateur
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- Déclencheur : maintenir updated_at à jour
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array['profiles', 'incomes', 'expenses', 'debts'] loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format(
      'create trigger set_updated_at before update on public.%I
       for each row execute function public.set_updated_at()', t);
  end loop;
end;
$$;
