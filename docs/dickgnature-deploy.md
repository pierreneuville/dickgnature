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

Le schéma est en `postgresql` : la suite d'intégration et `verify.sh` ont besoin d'une base
Postgres réelle mais **jetable**. `docker-compose.yml` en fournit une, éphémère (tmpfs), sur le
port hôte 5433 (pour ne pas heurter un Postgres local en 5432) :

```bash
docker compose up -d --wait     # base « dickgnature_test » saine et vierge
./scripts/verify.sh             # lint · types · tests · build · secrets · audit · coverage
docker compose down             # arrêt (données déjà éphémères)
./scripts/ci-wait.sh [PR]       # verdict CI réel de la PR (gh pr checks --watch)
```

`verify.sh` résout la base de test de façon déterministe et refuse toute URL non-`test` :
1. `TEST_DATABASE_URL` explicite (CI, ou base Neon dédiée) — prioritaire ;
2. `DATABASE_URL` s'il contient « test » ;
3. sinon la base docker-compose locale (`…@localhost:5433/dickgnature_test`).

En CI, le workflow `.github/workflows/ci.yml` démarre un service `postgres:16-alpine`, exporte
`TEST_DATABASE_URL` vers ce service, et lance `./scripts/verify.sh --blocking` sur chaque PR.

## 3. Base Postgres partout — RISK-001 (résolu)

Le schéma versionné (`prisma/schema.prisma`) est en `provider = "postgresql"` (`url =
env("DATABASE_URL")`, `directUrl = env("DIRECT_URL")`). Prisma **fige le provider dans le
schéma** : il n'est pas commutable via une variable d'env. On ne maintient donc plus de variante
SQLite ; dev, test/verify et prod partagent le même provider, ce qui supprime l'écart historique
SQLite→Postgres (les migrations sont écrites une seule fois, en SQL Postgres).

- **Dev/prod** : `DATABASE_URL` (pooled) + `DIRECT_URL` (non-pooled, pour les DDL). Voir §4 et §7.
- **Test/verify** : base jetable ciblée par `TEST_DATABASE_URL` (§2), locale via docker-compose ou
  service CI. Les migrations s'appliquent avec `npx prisma migrate deploy` (côté `test/global-setup`).

L'application des migrations en CI/Vercel :

```bash
npx prisma migrate deploy
```

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

## 7. État de la mise en ligne (12/08/2026)

Déployé en production : **https://dickgnature.vercel.app** (projet Vercel existant `dickgnature`,
scope `pierre-neuvilles-projects`, région `cdg1`, auto-déploiement via le lien GitHub sur `main`).

Base de données : **projet Neon direct** nommé `dickgnature` (provisionné hors Vercel), **pas** la
Vercel Postgres managée — équivalent technique. Deux env vars sont câblées côté Vercel :

- `DATABASE_URL` — chaîne **pooled** (host `…-pooler…`), utilisée par le runtime.
- `DIRECT_URL` — chaîne **non-pooled**, utilisée par `prisma migrate deploy` (DDL) ; référencée par
  `datasource db { directUrl = env("DIRECT_URL") }` dans `prisma/schema.prisma`.

L'utilisateur pourra rattacher/migrer cette base vers une Vercel Postgres managée plus tard s'il le
souhaite : il suffit de re-pointer `DATABASE_URL`/`DIRECT_URL` et de relancer `prisma migrate deploy`.

Le token Vercel fourni est **scoped-projet** : la CLI Vercel (`vercel link`, `whoami`) ne fonctionne
pas (résolution utilisateur → 404). La configuration projet et les env vars se pilotent par l'API REST
(`/v9/projects/…`, `/v10/projects/…/env`) ; le déploiement se déclenche par `git push` sur `main`.

Le favicon, les icônes d’application et les routes SEO sont versionnés. Définir
`NEXT_PUBLIC_SITE_URL=https://dickgnature.vercel.app` en production ; voir `docs/seo.md` pour les
contrôles et soumissions post-déploiement.
