# dickgnature — lancement local & déploiement Vercel

Runbook de l'application (distinct du `README.md` racine, qui documente l'équipe Factory).

## 1. Développement local

Prérequis : Node 20+, npm.

```bash
npm install                 # postinstall lance `prisma generate`
cp .env.example .env        # DATABASE_URL pointe sur SQLite (fallback dev autorisé Gate 1)
npx prisma migrate dev      # applique les migrations SQLite dans prisma/dev.db
npm run dev                 # http://localhost:3000
```

Sans `RESEND_API_KEY`, le transport email reste **hors-ligne** : les envois sont seulement
journalisés (`[email:log] …`). C'est le comportement attendu en dev/test/verify.

## 2. Couche déterministe

```bash
./scripts/verify.sh            # lint · types · tests · build · secrets · audit
./scripts/ci-wait.sh [PR]      # verdict CI réel de la PR (gh pr checks --watch)
```

`verify.sh` tourne **sans service externe** : le schéma est en `sqlite` (voir §3).

## 3. Bascule base : SQLite (dev) → Vercel Postgres / Neon (prod) — RISK-001

Le schéma versionné (`prisma/schema.prisma`) est en `provider = "sqlite"` pour que `verify.sh`
et la suite de tests tournent sans base externe. Prisma **fige le provider dans le schéma** : il
n'est pas commutable via une variable d'env. Le passage en production est donc une étape de
déploiement explicite, à exécuter quand une base Postgres réelle est disponible :

```bash
# 1. Basculer le provider dans prisma/schema.prisma :
#      datasource db { provider = "postgresql"  url = env("DATABASE_URL") }
# 2. Pointer DATABASE_URL sur la base Vercel Postgres (Neon) :
#      DATABASE_URL="postgres://<user>:<password>@<host>/<db>?sslmode=require"
# 3. Régénérer les migrations pour Postgres (les migrations SQLite existantes ne s'appliquent pas) :
npx prisma migrate reset --skip-seed        # sur la base Postgres cible
npx prisma migrate dev --name init_postgres # génère le SQL Postgres
# 4. En CI/Vercel, l'application des migrations se fait avec :
npx prisma migrate deploy
```

> ⚠️ Ne pas committer le schéma basculé en `postgresql` sur la branche d'intégration tant que la
> CI locale n'a pas de Postgres : cela casserait le `verify` vert basé sur SQLite. La bascule est
> tenue à part et validée sur l'environnement de déploiement.

## 4. Déploiement Vercel — projet existant « dickgnature »

Espace : `pierre-neuvilles-projects` · projet : `dickgnature`.

1. **Config projet (dashboard ou token)** — retirer le réglage **Output Directory = `public`**
   (incompatible Next.js → « No Output Directory named public found »). Le build Next réussit ;
   c'est le post-build Vercel qui casse. Laisser Vercel utiliser le défaut `.next`. `vercel.json`
   fixe déjà `framework: nextjs` et la région `cdg1` (UE).
2. **Provisionner** une base Vercel Postgres (Neon) sur le projet ; récupérer `DATABASE_URL`.
3. **Variables d'environnement Vercel** (Production) :
   - `DATABASE_URL` — URL Postgres Neon (§3), provisionnée sur le projet (pas de base pré-existante).
   - `RESEND_API_KEY` — clé Resend (sinon transport hors-ligne).
   - `RESEND_FROM_EMAIL` — sans domaine vérifié fourni : `onboarding@resend.dev` (voir §6).
4. **Build command** : `prisma migrate deploy && prisma generate && next build`
   (le `build` par défaut du `package.json` est `prisma generate && next build` ; ajouter
   `prisma migrate deploy` en préfixe côté Vercel, ou via un script dédié).
5. **Déployer** (import GitHub côté dashboard, ou `vercel deploy --prod` avec le token fourni).
6. Vérifier la CI Vercel verte, puis remonter l'URL de production.

## 5. Ce qui nécessite des identifiants humains (à fournir au moment du déploiement)

| Élément | Détail | Détenteur |
|---|---|---|
| `VERCEL_TOKEN` | déploiement CLI + édition config projet | utilisateur (canal interne) |
| Base Postgres | provisioning Neon + `DATABASE_URL` prod | à créer sur le projet Vercel |
| `RESEND_API_KEY` | envoi email réel | utilisateur / compte Resend |
| `RESEND_FROM_EMAIL` | domaine expéditeur vérifié | compte Resend |

Secrets **jamais** committés/loggés : uniquement env Vercel ou `.env` local (gitignoré : `.env*`,
seul `.env.example` est versionné). L'utilisateur régénère le token Vercel et la clé Resend après
validation du produit.

## 6. Étape post-lancement — domaine expéditeur Resend

Sans domaine vérifié, le déploiement utilise l'expéditeur de test `onboarding@resend.dev`.
**Limite connue** : en mode test, Resend ne délivre les emails **qu'à l'adresse du titulaire du
compte Resend** ; les autres destinataires ne reçoivent rien tant qu'un domaine n'est pas vérifié.

Pour une délivrabilité complète (envoi du PDF signé à tous les participants) :
1. Vérifier un domaine dans le dashboard Resend (enregistrements DNS SPF/DKIM).
2. Passer `RESEND_FROM_EMAIL` (env Vercel) sur une adresse de ce domaine.
3. Redéployer (ou simple mise à jour de la variable puis redeploy).

Tant que ce n'est pas fait, le produit est démontrable de bout en bout, mais l'email final n'atteint
que le titulaire du compte Resend — à signaler à l'utilisateur.
