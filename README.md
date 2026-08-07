# Finances — Plateforme personnelle d'automatisation

Module **Finances** (Phase 1 / MVP) de la plateforme décrite dans [`CLAUDE.md`](./CLAUDE.md).
Suivi financier pensé pour les **revenus multiples et irréguliers** (consulting, Uber,
livraison, ménage…) — un angle peu couvert par les apps de budget classiques.

Stack : **Next.js 15 (App Router, TypeScript) en PWA** + **Supabase** (Postgres, Auth,
Row Level Security). Hébergement visé : Vercel + Supabase, paliers gratuits (0 $/mois).

## Ce qui est en place (MVP)

- **Authentification** Supabase : courriel/mot de passe **et** lien magique
  (`/login`), avec inscription, connexion, déconnexion et protection des routes
  via middleware.
- **Tableau de bord** (`/finances`) : indicateurs repris du fichier Excel —
  dettes totales, paiements mensuels, revenus mensuels estimés, solde disponible,
  et **alertes** (budget négatif, dépassement de limite de crédit).
- **Gestion** des revenus (`/finances/revenus`), dépenses par catégorie
  (`/finances/depenses`) et dettes (`/finances/dettes`) : ajout via un gros
  bouton « + » (mobile-first) et suppression.
- **PWA** : installable sur l'écran d'accueil, `manifest.webmanifest`, service
  worker avec repli hors-ligne, icônes.
- **Sécurité** : Row Level Security sur **toutes** les tables, aucune clé secrète
  côté client (voir `CLAUDE.md` §7).

## Architecture (extensible par module)

```
src/
  app/
    login/              # auth (page + server actions)
    auth/callback/      # retour des liens magiques / confirmations
    finances/           # ── MODULE FINANCES ──
      layout.tsx        # coquille + garde-fou d'auth + navigation
      page.tsx          # tableau de bord
      revenus/ depenses/ dettes/
      actions.ts        # CRUD (Server Actions)
    # rappels/  maison/  → futurs modules : un dossier de routes chacun
  components/           # coquille commune (AppShell, AuthForm, FormModal…)
  lib/
    supabase/           # clients navigateur / serveur / middleware
    types.ts format.ts
supabase/migrations/    # schéma SQL + RLS
public/                 # manifest, service worker, icônes, page hors-ligne
```

Ajouter un module = ajouter un dossier de routes sous `app/` + ses tables (avec
RLS) — sans toucher au reste.

## Démarrage local

1. **Créer un projet Supabase** (https://supabase.com) — palier gratuit.
2. **Appliquer le schéma** : dans le dashboard Supabase → SQL Editor, coller le
   contenu de [`supabase/migrations/0001_init_finances.sql`](./supabase/migrations/0001_init_finances.sql)
   et exécuter. (Ou via la CLI Supabase : `supabase db push`.)
3. **Variables d'environnement** : copier `.env.local.example` en `.env.local`
   et remplir avec les valeurs de *Project Settings → API* :
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...   # clé "anon" (publique) uniquement
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```
   ⚠️ Ne jamais mettre la clé `service_role` ici.
4. **URLs de redirection auth** : dans Supabase → Authentication → URL
   Configuration, ajouter `http://localhost:3000/auth/callback` (et l'URL Vercel
   en production).
5. **Lancer** :
   ```bash
   npm install
   npm run dev
   ```
   → http://localhost:3000

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run start` | Servir le build |
| `npm run typecheck` | Vérification TypeScript |
| `npm run lint` | ESLint |
| `node scripts/generate-icons.mjs` | Régénérer les icônes PWA (aussi lancé auto avant `dev` / `build`) |

## Déploiement (Vercel)

1. Pousser le repo sur GitHub (déjà en place).
2. Importer le projet dans Vercel → framework détecté automatiquement (Next.js).
3. Renseigner les mêmes variables d'environnement (avec `NEXT_PUBLIC_SITE_URL`
   = domaine Vercel).
4. Ajouter le domaine Vercel dans les *Redirect URLs* Supabase.

## Prochaines étapes (voir CLAUDE.md)

- Modification en place des entrées (l'édition n'est pas encore branchée — seuls
  ajout et suppression le sont).
- Suivi mensuel réel via `monthly_snapshots` (table déjà créée).
- Rappels par courriel avant échéance (Supabase Edge Functions + `pg_cron`).
- Phase 2 : import PDF des relevés, notifications push, export des données.

## Note de sécurité — `npm audit`

`npm audit` signale 3 vulnérabilités *high* transitives (`postcss`, `sharp`)
héritées de Next.js. Leur correctif n'existe que dans `next@16` (changement
majeur). Elles concernent la **chaîne de build** (traitement de CSS / d'images de
build), pas les données utilisateur en production, et l'app ne traite pas de CSS
ni d'images fournis par des tiers. Migration vers Next 16 à planifier comme tâche
dédiée plutôt que via `npm audit fix --force`, pour tester le changement majeur.
