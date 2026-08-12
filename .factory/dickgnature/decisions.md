# Décisions — dickgnature (ADR-lite, append-only)

> Journal des décisions structurantes. Append-only : on n'édite ni ne réécrit une entrée
> existante ; toute évolution fait l'objet d'une nouvelle entrée qui référence la précédente.
> Contexte produit et critères : voir `.factory/dickgnature/spec.md`. Découpage : `slices.md`.

## ADR-001 — Architecture 100% Vercel-native + ton par défaut « fun » (Gate 1)

**Date** : 2026-08-11  **Statut** : accepté (Gate 1, validé par l'utilisateur)

**Contexte** : greenfield, cible de déploiement imposée = Vercel (« on va s'appuyer sur Vercel
et ce que Vercel peut offrir »). Besoin d'une base technique crédible pour un clone parodique
mais évolutif de DocuSign/Yousign.

**Décision** :
- Stack Vercel-native : Next.js (App Router) + TypeScript ; Vercel Postgres (Neon) via Prisma ;
  Vercel Blob pour les images de signature (introduit après S1) ; email via Resend derrière une
  interface transport (slice ultérieure) ; déploiement Vercel.
- Ton par défaut d'un nouveau contrat = **« fun »** (choix utilisateur ; remplace la reco
  initiale « serious »). Le ton est porté par le contrat (`contract.tone : fun | serious`) et
  n'est **jamais imposé au 2e signataire** — neutralité du mode `serious` et vraie signature
  manuscrite restent des exigences de spec.
- Signataires sans compte via liens tokenisés ; créateur via magic-link (slices ultérieures).

**Questions laissées ouvertes (NON bloquantes pour S1)** :
- (A) Posture juridique / profondeur de preuve → à trancher avant S4.
- (B) UX du motif parodique (« dick pattern ») → à trancher avant S2.

**Conséquences** :
- (+) Base cohérente et déployable ; différenciateurs de spec préservés.
- (−) Dépendance forte à l'écosystème Vercel (Postgres, Blob) à provisionner avant déploiement réel.

## ADR-002 — Stack S1 : Next 16, DB par étapes (SQLite dev → Postgres prod)

**Date** : 2026-08-11  **Statut** : accepté (Gate 1) — prolonge ADR-001

**Contexte** : greenfield, `scripts/verify.sh` en TS/Node, cible Vercel. Slice tracer bullet S1
à rendre verte sans service externe disponible en session.

**Décision** :
- Next.js **16** (App Router, TS) + Prisma. Prod : Vercel Postgres (Neon) via Prisma ;
  Vercel Blob (signatures, post-S1) ; Resend derrière interface transport (S5). Déploiement Vercel.
- S1 utilise **SQLite** (fallback dev autorisé en ADR-001) pour un verify vert hors-ligne.
  `contract.tone` = **String** (les enums Prisma ne sont pas supportés sur SQLite) + union TS
  `fun | serious` validée par zod à la frontière. Défaut de ton = `fun`.
- Montée **Next 15 → 16** imposée par l'audit de dépendances (`npm audit --audit-level=high
  --omit=dev`) : Next 15 tirait postcss/sharp vulnérables (high) via une dépendance de prod.

**Conséquences** :
- (+) verify 100% vert sans service externe ; slice honnête (DB réelle, migration réelle, test
  de persistance réel).
- (−) Dette : basculer le `provider` Prisma sqlite → postgresql + fournir un `DATABASE_URL`
  Vercel réel avant déploiement ; régénérer la migration en Postgres. À traiter quand l'env
  Vercel est disponible (avant S3/S5 qui écrivent davantage en base).
- `next lint` retiré en Next 16 → lint via ESLint flat config natif d'`eslint-config-next` v16.

## Points différés & risques explicites

Registre des dettes assumées à traiter avant qu'elles ne deviennent bloquantes. Append-only.

### RISK-001 — « Provider flip » Prisma SQLite → Vercel Postgres/Neon

**Ouvert le** : 2026-08-11  **Statut** : différé (validé lead)  **Origine** : ADR-002

**Description** : S1 tourne sur SQLite (fallback dev). Le passage à la cible prod
(Vercel Postgres/Neon via Prisma) impose : basculer le `provider` de la datasource
`sqlite` → `postgresql`, fournir un vrai `DATABASE_URL` Vercel, régénérer/rejouer la
migration en Postgres, et — optionnellement — repasser `contract.tone` d'un `String`
contraint à un **enum Prisma natif** (non supporté sur SQLite, redevient possible sur Postgres).

**Pourquoi différé** : garder `verify` vert hors-ligne sans provisionner de service externe.
Décision lead explicite : **ne pas provisionner de branche Neon maintenant**.

**Déclencheur / échéance** : le lead créera une tâche dédiée **avant S4 (PDF)**, première slice
qui touche à de la persistance sérieuse. Validation du flip quand l'environnement Vercel sera câblé.

**Impact si ignoré** : divergence dev/prod (dialecte SQL, types, migrations) non détectée avant
le déploiement réel ; risque de migration cassée en prod.

## ADR-003 — UX de signature : manuscrit universel + motif parodique guidé (fun-only)

**Date** : 2026-08-11  **Statut** : accepté (décision B, tranchée par le lead, autonomie déléguée)

**Contexte** : question B laissée ouverte au Gate 1 (cf. ADR-001) = comment matérialiser le motif
parodique (« dick pattern ») sur canvas. Décision produit/goût, requise avant d'implémenter S2.

**Décision** :
- **Signature manuscrite** (dessin libre type `signature_pad`) : disponible dans **tous les tons**,
  défaut en mode `serious`. Jamais d'humour imposé au signataire.
- **Motif parodique** : **`fun` uniquement**. Interaction retenue = **pochoir/stencil guidé**
  (gabarit léger en surimpression que l'utilisateur suit → tracé propre et cohérent) **+ tampon
  prédéfini en un tap** (option express). Absent du mode `serious` (non masqué : hors DOM).

**Conséquences** :
- (+) Cohérence avec la spec (manuscrit toujours dispo, neutralité `serious`) ; motif propre et lisible.
- (−) Le motif « tampon » est un tracé préfabriqué (cosmétique) ; sa forme précise reste ajustable
  sans impact sur les invariants métier (le mode est validé côté serveur : `pattern → fun`).
- La règle « pattern → fun » est appliquée dans la couche domaine (`src/lib/signatures.ts`), pas
  seulement dans l'UI, pour qu'aucune requête forgée ne contourne la neutralité `serious`.

## ADR-004 — Posture juridique : « parodie honnête » et preuve SES

**Date** : 2026-08-11  **Statut** : accepté (décision A, tranchée par le lead, autonomie déléguée)

**Contexte** : la posture juridique et la profondeur de preuve étaient laissées ouvertes avant S4.
Le produit doit rendre l'accord vérifiable sans promettre une qualification ou une équivalence
manuscrite universelle qu'il ne fournit pas.

**Décision** :
- En ton `fun`, afficher dans la page et le PDF : « Parodie — sans valeur légale universelle ».
- Dans tous les tons, constituer une piste de preuve de niveau **SES** : case de consentement
  explicite horodatée, instants UTC, email déclaré, empreinte SHA-256 du contenu canonique figé à
  la complétion, et journal append-only (création, envoi, ouverture, consentement, signature).
- Le PDF signé comporte le texte, la signature de chaque participant, le bloc d'audit et une page
  « Pourquoi ce PDF est probant » avec badge SES.
- Ne jamais présenter le motif, la signature ou le document comme une signature qualifiée, ni
  comme un équivalent manuscrit universel.

**Conséquences** :
- (+) Preuve lisible, reproductible et honnête ; l'empreinte ne dépend pas des métadonnées variables
  du conteneur PDF.
- (−) Cette preuve reste une SES déclarative sans vérification d'identité forte ; une montée de
  niveau exigerait un fournisseur de confiance et un parcours distinct.

## ADR-005 — Internationalisation : next-intl, EN défaut sans préfixe, FR/PT/ES préfixés

**Date** : 2026-08-12  **Statut** : accepté (builder-a, slice #3dbf6792)

**Contexte** : produit déjà en ligne (https://dickgnature.vercel.app) avec des URL publiques
tokenisées `/sign/[token]` déjà distribuables. Il faut passer à 4 langues (EN défaut, FR, PT, ES)
sans casser les liens existants ni la preuve, et préparer le SEO (hreflang) à suivre (#b43bfe66).

**Décision** :
- Lib : **next-intl 4** (compatible Next 16 App Router + React 19, peer deps vérifiées).
- Routing : `localePrefix: "as-needed"`. **EN (défaut) reste à la racine** (`/`, `/sign/[token]`,
  `/contracts/...`) → aucun lien déjà distribué ne casse. FR/PT/ES sont préfixés (`/fr`, `/pt`,
  `/es`). Le middleware next-intl gère la détection (cookie + `Accept-Language`) et la négociation.
- Arborescence : les routes rendues passent sous `src/app/[locale]/...`. Les routes non
  présentielles restent hors locale si pertinent (ex. `/contracts/[id]/pdf` = binaire).
- Catalogues : `src/messages/{en,fr,pt,es}.json`, namespaces par surface (common, landing,
  contractNew, contract, sign, proof, emails, pdf, templates, easterEgg, status).
- Le **ton du contrat (fun/serious) reste orthogonal à la langue** : chaque variante de ton a sa
  clé traduite dans chaque langue ; `serious` reste sobre dans toutes les langues.
- Emails / PDF : rendus dans la langue du contexte du contrat quand disponible, sinon fallback EN
  documenté. La locale du contrat n'est pas encore persistée → v1 : EN pour emails/PDF, TODO
  persistance de la locale au contrat (noté dans findings).
- Sélecteur de langue : composant du design system, accessible (labels), mobile-first, dans le
  header ; conserve le chemin courant en changeant le préfixe.

**Conséquences** :
- (+) Rétrocompatibilité totale des URLs EN déjà en ligne ; SEO hreflang direct ensuite.
- (+) Extraction centralisée = source unique pour les traductions et l'audit de complétude.
- (−) Restructuration de l'arborescence `app/` sous `[locale]` (diff large, mécanique).
- (−) Emails/PDF non encore multilingues faute de locale persistée (dette explicite, EN par défaut).

### RISK-002 — i18n : périmètre découpé, 3 sous-slices différées

**Ouvert le** : 2026-08-12  **Statut** : différé (validé lead)  **Origine** : ADR-005

**Description** : la PR #3dbf6792 livre l'infra next-intl + **tout le chrome UI** des surfaces
rendues (landing, création, contrat, signature, preuve, easter-egg, sélecteur de langue) en 4
langues. Restent trois périmètres de chaînes NON extraits, chacun avec un déclencheur propre :
- **#2 corps de templates** — `src/lib/contract-templates.ts` (titres/descriptions/labels/
  placeholders de variables + corps `fun`/`serious`). Volume élevé, purement contenu ; à traduire
  en slice dédiée sans risque technique.
- **#3 erreurs domaine** — messages levés par `src/lib/participants.ts`, `signatures.ts` et les
  server actions (`state.error`). Requiert un **mapping code d'erreur → clé i18n** (les libs ne
  sont pas en contexte de requête next-intl) avant extraction. Aujourd'hui : chaîne EN brute.
- **#4 emails / PDF** — dépend de la persistance d'une locale au contrat (cf. ADR-005, dette).
  Rejoint #b43bfe66 (SEO/hreflang). Aujourd'hui : EN documenté.

**Pourquoi différé** : garder la PR reviewable (le diff `[locale]` est déjà large et mécanique) et
isoler les changements à risque (mapping d'erreurs, migration de schéma) de l'extraction pure.

**Impact si ignoré** : chaînes non traduites visibles en FR/PT/ES sur les corps de templates et
les erreurs ; emails/PDF restent EN. Aucun invariant métier ni de preuve affecté.
