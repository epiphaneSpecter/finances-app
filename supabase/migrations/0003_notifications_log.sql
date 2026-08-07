-- ============================================================================
-- Module Rappels — journal des notifications envoyées.
-- Sert à ne pas renvoyer deux fois le même rappel pour une même échéance.
-- RLS activée (chaque utilisateur ne voit que son propre journal).
-- ============================================================================

create table if not exists public.notifications_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  kind       text not null,                       -- 'expense' | 'debt'
  item_id    uuid not null,
  due_date   date not null,
  channel    text not null default 'email',
  sent_at    timestamptz not null default now(),
  unique (user_id, kind, item_id, due_date)
);

alter table public.notifications_log enable row level security;

drop policy if exists "notifications_log_select_own" on public.notifications_log;
create policy "notifications_log_select_own" on public.notifications_log
  for select using (auth.uid() = user_id);

create index if not exists notifications_log_user_id_idx
  on public.notifications_log (user_id);
