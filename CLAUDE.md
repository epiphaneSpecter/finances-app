# Projet : plateforme personnelle d'automatisation — module Finances

Document de cadrage v1 — 7 août 2026

## 1. Vision

Epiphane veut un système complet d'automatisation de sa vie (téléphone, ordinateur, quotidien) construit progressivement, module par module. Le premier module est le suivi financier (revenus multiples, dettes, budget) qui remplace/complète le fichier Excel actuel. L'architecture doit permettre de greffer d'autres modules plus tard (rappels, automatisation de l'appartement, etc.) sans tout reconstruire. Potentiel produit : un outil de gestion budgétaire pensé pour les travailleurs autonomes à revenus multiples et irréguliers — un angle peu couvert par les apps de budget classiques (qui supposent un salaire fixe).

## 2. Stack technique recommandée

| Couche | Choix | Pourquoi |
|---|---|---|
| Frontend | Next.js (React + TypeScript), en PWA | Une seule base de code pour web et mobile (installable sur l'écran d'accueil du téléphone, fonctionne hors-ligne pour l'essentiel) — pas besoin de développer une app native séparée pour iOS/Android. |
| Backend + base de données | Supabase (Postgres géré) | Palier gratuit généreux (500 Mo DB, auth incluse, 50k utilisateurs actifs/mois). Authentification, gestion des utilisateurs et sécurité des données (Row Level Security = chaque utilisateur ne voit que ses propres données) fournies out-of-the-box — évite de coder l'auth soi-même, ce qui est la partie la plus risquée niveau sécurité. |
| Hébergement frontend | Vercel (palier gratuit) | Fait pour Next.js, HTTPS automatique, déploiement à chaque `git push`. |
| Rappels automatiques | Supabase Edge Functions + pg_cron (gratuit) | Peut envoyer des courriels/notifications aux dates d'échéance — réutilisable pour les futurs modules (rappels généraux, etc.). |
| Import automatique de relevés (Phase 2) | Parsing PDF (ex: `pdf-parse` ou script Python) dans une Edge Function | Tes relevés bancaires sont en PDF (pas de CSV) — on peut automatiser l'extraction plutôt que la saisie manuelle. |

Coût mensuel visé : 0 $ (paliers gratuits Supabase + Vercel). Limite connue du palier gratuit Supabase : rétention des sauvegardes limitée — à surveiller si le projet grossit.

## 3. Architecture pensée pour l'extensibilité

Un seul projet Supabase = un seul système de comptes/authentification pour toute la plateforme, pas juste les finances.

```
auth.users (géré par Supabase)
  └── profiles (1 par utilisateur)
        ├── module Finances : incomes, expenses, debts, debt_payments, monthly_snapshots
        ├── module Rappels (futur) : reminders, notifications_log
        └── module Maison (futur) : devices, routines
```

Chaque table est isolée par `user_id` via Row Level Security, donc le système est multi-utilisateur dès le départ même si toi seul l'utilises au début — pas de refonte nécessaire si tu ouvres ça à d'autres travailleurs autonomes plus tard.

Le frontend suit la même logique modulaire : une coquille commune (authentification, navigation, paramètres) + un dossier de routes par module (`/finances`, `/rappels`, ...). Ajouter un module = ajouter un dossier de routes + ses tables, sans toucher au reste.

## 4. Périmètre du MVP (Module Finances — Phase 1)

- Authentification (inscription/connexion via Supabase — courriel/mot de passe ou lien magique)
- Tableau de bord : reprend les indicateurs du fichier Excel actuel (total dettes, paiements mensuels, solde disponible, alertes comme le dépassement de limite)
- Gestion des revenus, dépenses (avec sections comme dans le fichier : logement, assurances, abonnements, autres) et dettes — ajout/modification/suppression facile, pensé mobile d'abord (gros bouton "+", formulaire rapide)
- Suivi mensuel réel (comme l'onglet Budget mensuel actuel)
- Rappels par courriel avant chaque date de prélèvement/échéance

## 5. Phase 2 (une fois le MVP stable)

- Import automatique des relevés bancaires PDF (extraction + catégorisation semi-automatique)
- Notifications push (en plus du courriel)
- Export/sauvegarde des données

## 6. Phase 3 (extension de la plateforme)

- Nouveaux modules greffés sur la même base de comptes : rappels généraux, automatisation de tâches, etc. — à définir selon tes priorités du moment.

## 7. Sécurité — points à appliquer dès le départ

- Row Level Security activée sur toutes les tables dès leur création (jamais de table "ouverte" par défaut)
- Aucune clé secrète (service role Supabase, etc.) exposée côté client — uniquement les clés publiques prévues pour ça
- Authentification à deux facteurs sur tes comptes Supabase, Vercel et GitHub (les comptes qui contrôlent l'infrastructure, pas seulement l'app elle-même)
- Dépendances à jour (`npm audit`) — bon réflexe à automatiser via une action GitHub plus tard
- Bon projet pratique en parallèle de ta formation en cybersécurité à Polytechnique : tu peux appliquer ce que tu apprends directement dessus

## 8. Réalisme sur le temps

Tu jongles déjà avec le consulting, Uber, la livraison, le ménage et ta formation — un MVP solo pris entre deux jobs prendrait plusieurs semaines en travaillant par sessions courtes. Deux façons d'avancer plus vite :
1. Je fais le plus gros du code avec toi (scaffolding, structure, logique) et tu valides/ajustes plutôt que de tout écrire toi-même.
2. On avance par petites sessions ciblées (une fonctionnalité à la fois) plutôt qu'en un seul gros chantier.

## 9. Prochaine étape

Une fois ce cadrage validé, l'étape suivante est de scaffolder le projet (structure Next.js + Supabase, authentification, premier écran du tableau de bord) pour avoir quelque chose de concret et testable rapidement — pas besoin d'attendre que tout soit fini pour commencer à l'utiliser.
