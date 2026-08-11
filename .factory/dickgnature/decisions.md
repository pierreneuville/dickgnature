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
