-- ============================================================================
-- Module Rappels — envoi automatique de courriels avant les échéances.
--
-- Approche 100 % base de données (aucun serveur à déployer) :
--   pg_cron  → planifie l'exécution quotidienne
--   pg_net   → appelle l'API d'envoi de courriels (Resend) en HTTP
--   Vault    → stocke la clé API Resend de façon chiffrée
--
-- PRÉREQUIS (voir docs/REMINDERS.md pour le pas-à-pas) :
--   1. Extensions activées : pg_cron, pg_net (+ supabase_vault, déjà présent).
--   2. Clé API Resend stockée dans Vault sous le nom 'resend_api_key'.
--   3. Adresse d'expéditeur : 'onboarding@resend.dev' fonctionne pour t'écrire
--      à toi-même sans vérifier de domaine ; pour écrire à d'autres, vérifier
--      un domaine chez Resend et remplacer l'expéditeur ci-dessous.
-- ============================================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- ----------------------------------------------------------------------------
-- Fonction : parcourt les dépenses et dettes ayant un jour d'échéance, et
-- envoie un courriel `lead_days` jours avant la prochaine occurrence (une
-- seule fois par échéance grâce à notifications_log).
-- Renvoie le nombre de courriels déclenchés.
-- ----------------------------------------------------------------------------
create or replace function public.send_due_reminders(lead_days int default 3)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  api_key      text;
  sender       text := 'Finances <onboarding@resend.dev>';
  rec          record;
  due_date     date;
  last_this    int;
  last_next    int;
  first_next   date;
  days_left    int;
  sent_count   int := 0;
begin
  select decrypted_secret into api_key
  from vault.decrypted_secrets
  where name = 'resend_api_key';

  if api_key is null then
    raise notice 'Clé « resend_api_key » absente de Vault — aucun envoi.';
    return 0;
  end if;

  for rec in
    select 'expense'::text as kind, e.id as item_id, e.user_id,
           e.label, e.amount::numeric as montant, e.due_day, u.email
    from public.expenses e
    join auth.users u on u.id = e.user_id
    where e.due_day is not null
    union all
    select 'debt', d.id, d.user_id,
           d.label, d.minimum_payment::numeric, d.due_day, u.email
    from public.debts d
    join auth.users u on u.id = d.user_id
    where d.due_day is not null and d.minimum_payment > 0
  loop
    -- Prochaine occurrence du jour d'échéance (borné à la fin du mois).
    last_this := extract(day from (date_trunc('month', current_date)
                 + interval '1 month - 1 day'))::int;
    due_date  := make_date(
                   extract(year  from current_date)::int,
                   extract(month from current_date)::int,
                   least(rec.due_day, last_this));

    if due_date < current_date then
      first_next := (date_trunc('month', current_date) + interval '1 month')::date;
      last_next  := extract(day from (date_trunc('month', first_next)
                    + interval '1 month - 1 day'))::int;
      due_date   := make_date(
                      extract(year  from first_next)::int,
                      extract(month from first_next)::int,
                      least(rec.due_day, last_next));
    end if;

    days_left := due_date - current_date;

    if days_left between 0 and lead_days
       and rec.email is not null
       and not exists (
         select 1 from public.notifications_log l
         where l.user_id = rec.user_id and l.kind = rec.kind
           and l.item_id = rec.item_id and l.due_date = due_date
       )
    then
      perform net.http_post(
        url     := 'https://api.resend.com/emails',
        headers := jsonb_build_object(
          'Content-Type',  'application/json',
          'Authorization', 'Bearer ' || api_key
        ),
        body := jsonb_build_object(
          'from',    sender,
          'to',      rec.email,
          'subject', 'Rappel : ' || rec.label || ' le ' || rec.due_day,
          'html',
            '<div style="font-family:system-ui,sans-serif">'
            || '<h2>Rappel d''échéance</h2>'
            || '<p><strong>' || rec.label || '</strong> — '
            || to_char(rec.montant, 'FM999999990D00') || ' $'
            || ' prévu le ' || rec.due_day
            || ' (' || case when days_left = 0 then 'aujourd''hui'
                            when days_left = 1 then 'demain'
                            else 'dans ' || days_left || ' jours' end || ').</p>'
            || '<p style="color:#64748b;font-size:13px">Envoyé automatiquement '
            || 'par ton app Finances.</p></div>'
        )
      );

      insert into public.notifications_log (user_id, kind, item_id, due_date)
      values (rec.user_id, rec.kind, rec.item_id, due_date);

      sent_count := sent_count + 1;
    end if;
  end loop;

  return sent_count;
end;
$$;

-- ----------------------------------------------------------------------------
-- Planification : chaque jour à 13:00 UTC (~9 h à Québec l'été).
-- Réexécuter unschedule d'abord évite les doublons de tâche.
-- ----------------------------------------------------------------------------
select cron.unschedule('rappels-echeances')
where exists (select 1 from cron.job where jobname = 'rappels-echeances');

select cron.schedule(
  'rappels-echeances',
  '0 13 * * *',
  $cron$ select public.send_due_reminders(3); $cron$
);
