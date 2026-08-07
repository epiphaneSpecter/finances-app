# Ton système Finances, en un coup d'œil

Fiche de référence — comment l'application est montée, où te connecter, et
comment elle fonctionne. À garder sous la main pour t'y retrouver dans quelques
semaines.

> Une version web (mise en page, thèmes clair/sombre) a aussi été générée comme
> Artifact Claude — garde le lien en favori si tu préfères la consulter ainsi.

---

## Comment tout se parle

```
📱  Toi  (navigateur ou app installée sur ton téléphone)
        │  tu ouvres l'application
        ▼
▲  Vercel — héberge l'application
        │  (le site que tu utilises, redéployé à chaque changement de code)
        │  lit et enregistre tes données
        ▼
🗄️  Supabase — le cerveau
        │  (base de données, comptes, sécurité, planificateur des rappels)
        │  chaque matin, 3 jours avant une échéance
        ▼
✉️  Resend — envoie le courriel de rappel
        │
        ▼
📥  Ta boîte  epiavlah@gmail.com
```

En coulisses : ton **code** vit sur GitHub, et chaque fois qu'on le met à jour,
Vercel redéploie l'app automatiquement.

---

## Les 4 morceaux (et où te connecter)

| Morceau | Rôle | Où te connecter |
|---|---|---|
| **GitHub** | Le code source de l'app (toutes les modifications y vivent). | https://github.com/epiphaneSpecter/finances-app |
| **Vercel** | Héberge l'app et lui donne son adresse. HTTPS automatique. | https://vercel.com → projet `finances-app` |
| **Supabase** | Base de données, comptes, sécurité, rappels planifiés. | https://supabase.com/dashboard → projet « copilote » |
| **Resend** | Envoie les courriels de rappel avant les échéances. | https://resend.com |

---

## Tes infos clés

| | |
|---|---|
| **Adresse de l'app** | https://finances-app-tan.vercel.app |
| **Ton compte (connexion)** | `epiavlah@gmail.com` |
| **Projet Supabase** | `copilote` · région Canada (Montréal) |
| **Dépôt GitHub** | `epiphaneSpecter/finances-app` |
| **Coût total** | **0 $ / mois** |

---

## Les rappels par courriel

Chaque matin (vers 9 h), Supabase regarde tes dépenses et tes dettes. Pour
chaque échéance qui tombe **dans 3 jours**, il t'envoie un courriel via Resend —
**une seule fois** par échéance.

- Une carte dont le **paiement minimum est à 0 $** n'envoie pas de rappel.
  Renseigne son minimum (bouton ✎) pour l'activer.
- Pour changer le délai (3 jours) ou l'heure d'envoi, c'est un petit réglage
  dans Supabase — voir [`docs/REMINDERS.md`](./REMINDERS.md).

---

## Modifier tes données

- **Ajouter** → le gros bouton « + » en bas de chaque écran (Revenus, Dépenses,
  Dettes).
- **Modifier** → le crayon ✎ sur une ligne ouvre un formulaire déjà rempli
  (pratique pour compléter les taux d'intérêt manquants).
- **Supprimer** → la croix ✕ sur une ligne (définitif).
- **Suivi mensuel** → l'onglet « Suivi » : entre chaque mois tes vrais chiffres
  pour les comparer à ton plan.

---

## Sécurité

- **Cloisonnement des données** : chaque compte ne voit que ses propres données
  (Row Level Security, activée sur toutes les tables).
- **Aucune clé secrète dans l'app** : seules des clés publiques prévues pour ça
  sont utilisées. La clé Resend est chiffrée dans le coffre (Vault) de Supabase.
- **À faire quand tu peux** : activer la double authentification (2FA) sur tes
  comptes **GitHub, Vercel et Supabase** — ce sont les comptes qui contrôlent
  toute l'infrastructure.

---

## Et après ? (Phase 2, sans presse)

- Import automatique de tes relevés bancaires **PDF** (fini la saisie à la main).
- **Notifications push** sur le téléphone, en plus du courriel.
- **Export / sauvegarde** de tes données.
- Plus tard : d'autres modules (rappels généraux, maison…) sur la même base.

---

## Repères techniques (pour référence)

- **Stack** : Next.js (App Router, TypeScript) en PWA · Supabase (Postgres, Auth,
  RLS) · Vercel · Resend.
- **Migrations SQL** : `supabase/migrations/` (schéma, RLS, suivi mensuel,
  rappels). À rejouer dans le SQL Editor de Supabase au besoin.
- **Mise en place des rappels** : [`docs/REMINDERS.md`](./REMINDERS.md).
- **Démarrage / déploiement** : [`README.md`](../README.md).

_Module Finances — plateforme personnelle d'automatisation d'Epiphane.
Monté avec Claude Code, août 2026._
