# Rappels par courriel — guide de mise en place

Ce module envoie **automatiquement un courriel** avant chaque échéance (dépenses
et dettes ayant un « jour du mois » renseigné). Tout se passe dans Supabase :
**pg_cron** planifie, **pg_net** appelle l'API d'envoi, **Resend** envoie le
courriel, et la clé API est stockée chiffrée dans **Vault**. Aucun serveur à
déployer.

Coût : 0 $ (Resend offre 3 000 courriels/mois, 100/jour, gratuitement).

---

## Étape 1 — Créer un compte Resend et une clé API

1. Va sur **https://resend.com** → inscris-toi **avec l'adresse où tu veux
   recevoir tes rappels** (ex. `epiavlah@gmail.com`).
2. Menu **API Keys** → **Create API Key** → nom « finances » → copie la clé
   (commence par `re_...`). ⚠️ Elle ne s'affiche qu'une fois.

> Expéditeur : par défaut on utilise `onboarding@resend.dev`, qui permet de
> t'écrire **à toi-même** (l'adresse de ton compte Resend) sans rien configurer.
> Pour écrire à d'autres personnes plus tard, il faut vérifier un domaine chez
> Resend, puis remplacer l'expéditeur dans `0004_email_reminders.sql`.

## Étape 2 — Enregistrer la clé dans Vault (Supabase)

Dans **Supabase → SQL Editor**, colle ceci en remplaçant la valeur par ta vraie
clé, puis **Run** :

```sql
select vault.create_secret('re_TA_CLE_ICI', 'resend_api_key');
```

*(La clé est chiffrée ; elle ne réapparaîtra pas en clair.)*

## Étape 3 — Créer la table de journal

Colle le contenu de `supabase/migrations/0003_notifications_log.sql` dans le SQL
Editor → **Run**. (Empêche l'envoi en double du même rappel.)

## Étape 4 — Créer la fonction d'envoi + la planification

Colle le contenu de `supabase/migrations/0004_email_reminders.sql` dans le SQL
Editor → **Run**. Cela active `pg_cron`/`pg_net`, crée la fonction
`send_due_reminders()` et planifie son exécution **chaque jour à 13:00 UTC**
(~9 h à Québec l'été).

> Si l'activation d'une extension est refusée depuis le SQL Editor, active-la à
> la main : **Database → Extensions**, cherche `pg_cron` et `pg_net`, active-les,
> puis relance l'étape 4.

## Étape 5 — Tester tout de suite

Force un envoi en élargissant la fenêtre à 60 jours (au lieu de 3) — tu recevras
un courriel pour la prochaine échéance de chaque poste :

```sql
select public.send_due_reminders(60);
```

Le nombre renvoyé = nombre de courriels déclenchés. Vérifie ta boîte de
réception (et les indésirables la première fois).

> Pour re-tester après coup, vide le journal :
> `delete from public.notifications_log;` puis relance la commande ci-dessus.

---

## Comment ça marche au quotidien

- Chaque jour, la tâche planifiée regarde tes dépenses/dettes.
- Pour chaque échéance qui tombe **dans 3 jours ou moins**, un courriel part
  **une seule fois** (grâce au journal).
- Le délai de 3 jours se change dans la planification :
  `select public.send_due_reminders(N)` et le `cron.schedule(... N ...)`.

## Vérifier / gérer la planification

```sql
-- Voir les tâches planifiées
select jobname, schedule, active from cron.job;

-- Voir les derniers résultats d'exécution
select job_pid, status, return_message, start_time
from cron.job_run_details order by start_time desc limit 10;

-- Désactiver les rappels
select cron.unschedule('rappels-echeances');
```
