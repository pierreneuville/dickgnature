# dickgnature — MVP
**Mode** : L (proposé)        **Date** : 2026-08-11
**Statut** : cadrage — en attente Gate 1 humain

> Classement mode : proposé **L**. Justification : nouveau module greenfield qui manipule des
> PII (emails, images de signature), envoie des emails et pose la question de la valeur légale.
> Le Lead tranche le mode définitif au Gate 1. À défaut, découpage utilisable en M.

## Problème
Faire signer un « contrat » simple entre deux amis via DocuSign/Yousign est lourd, cher et
sur-dimensionné : comptes obligatoires, onboarding, tarif à l'enveloppe, UX pensée pour
l'entreprise. Personne ne sert le cas trivial « 2 personnes, 1 document, signature en 30 s,
zéro compte pour le signataire ».

## Comportement attendu
Un créateur rédige un contrat (texte présenté sérieusement), **choisit le ton** — `fun` (marque
parodique visible) ou `serious` (neutre : domaine, emails et PDF sans humour) — ajoute des
participants par email, et déclenche la signature. Chaque participant reçoit un lien unique,
ouvre le document sans créer de compte, et signe sur un canvas — soit avec sa vraie signature
manuscrite (**toujours disponible, quel que soit le ton**), soit, en mode `fun`, avec le mode
« pattern » parodique (la signature-gag). Le ton parodique n'est **jamais imposé au second
signataire** : le ton est porté par le contrat, choisi par le créateur. Quand tous ont signé,
le système génère un PDF du contrat signé (texte + signatures + horodatage + piste d'audit) et
envoie une copie à l'email de chaque participant. Une page « Pourquoi ce PDF est probant »
explique la force probante (consentement, horodatage, empreinte du document, journal
d'événements) sans surpromettre de valeur légale.

## Critères d'acceptation
- [ ] `POST` de création de contrat persiste le contrat (dont son `tone` = `fun|serious`) et
      renvoie un id ; la page publique l'affiche (test API + test de rendu).
- [ ] En `tone=serious`, aucune marque/élément humoristique n'apparaît sur la page contrat, les
      emails ni le PDF (test d'absence sur les 3 surfaces).
- [ ] Un signataire peut capturer une signature manuscrite (**disponible quel que soit le ton**) ;
      le mode « pattern » n'est proposé qu'en `tone=fun` ; l'image est persistée et ré-affichée
      après rechargement (test de persistance + test de disponibilité par ton).
- [ ] Ajout de N participants → génération de N liens de signature uniques et non devinables
      (token ≥ 128 bits) ; ouvrir un lien ne requiert aucun compte (test).
- [ ] Le statut du contrat transite `draft → sent → partially_signed → completed` selon les
      signatures reçues (test de machine à états).
- [ ] L'endpoint PDF renvoie un PDF valide contenant le texte + toutes les signatures + un bloc
      d'audit (horodatage, email, empreinte/hash du document, journal d'événements) — vérifié par
      parsing du PDF généré (test).
- [ ] À `completed`, chaque participant reçoit par email une copie du PDF signé (test via
      transport email en mode capture/dev, assertion sur destinataires + pièce jointe).
- [ ] Une page « Pourquoi ce PDF est probant » liste consentement, horodatage, empreinte doc et
      journal d'événements, avec un badge de niveau **SES** explicite (jamais QES) (test de présence).
- [ ] En `tone=fun`, un disclaimer « parodie, sans valeur légale universelle » est affiché sur le
      contrat et intégré au PDF (test de présence).

## Hors périmètre MVP
- Signature qualifiée (**QES**) / AES avec vérification d'identité / conformité eIDAS complète
  (piste d'audit crédible de niveau **SES** posée ; AES/QES sous-traités à un QTSP plus tard).
- OTP / vérification d'identité du signataire (candidat post-MVP, cf. question Gate 1 sur la preuve).
- Comptes utilisateurs riches, SSO, organisations, rôles.
- Champs dynamiques, placement drag-and-drop de zones de signature.
- Paiement, quotas, facturation (mais le **modèle** « par contrat finalisé » est acté comme cible).
- Multi-langue, mobile natif, notifications push/SMS.
- Rappels automatiques, expiration/relance des liens (au-delà d'un TTL simple).
- Self-hosting livrable (l'**architecture** reste self-host-friendly / hébergement UE, mais le
  packaging self-hosted n'est pas dans le MVP).

## Axes de différenciation (consolidés avec #6288e10e)
Les 3 différenciateurs à ancrer, retenus de l'analyse concurrentielle (builder-b) :
1. **Le contrat à deux en < 60 s** : signataire sans compte, mobile-first, modèles concrets,
   copie PDF immédiate aux deux parties. Avantage le plus directement démontrable face aux suites
   enterprise (DocuSign/Yousign : compte + placement de champs + jargon « enveloppe »).
2. **Prix juste et prévisible** : facturation **par contrat finalisé**, jamais par siège ni par
   enveloppe envoyée ni par grappe d'add-ons. (Non facturé au MVP, mais le modèle de données ne
   doit pas rendre ce pricing impossible.)
3. **Crédibilité européenne lisible** : `Serious mode` neutre + dossier de preuve par défaut +
   hébergement UE + communication honnête SES/AES/QES (jamais présenter le tracé comme une QES).
L'humour est le canal d'acquisition, pas la dépendance produit : le « dick pattern » attire, mais
`Serious mode` + preuve claire + simplicité radicale créent la rétention.

## Contraintes
- Stack TypeScript/Node imposée de fait par `scripts/verify.sh` (lint/types/tests/build Node).
- PII : emails + images de signature. Tokens de signature non devinables, pas d'énumération.
- Hébergement UE et journal d'événements par défaut (crédibilité européenne, axe 3).
- `verify` vert (lint, types, tests, coverage du diff, secrets, build) requis avant tout Gate 2.
- Une slice = une branche = une PR (voir slices.md).

## Questions ouvertes — Gate 1
Les questions techniques/produit détaillées (auth créateur, persistance, provider email, format
signature, déploiement) sont dans le commentaire de tâche #b477ca44. Ajouts issus de #6288e10e :
- **Profondeur de la preuve au MVP** : s'arrête-t-on à SES (consentement + horodatage + empreinte
  doc + journal d'événements), ou ajoute-t-on l'**OTP email** dès le MVP pour tendre vers AES ?
  Reco : SES au MVP, OTP en option post-MVP, QES via QTSP plus tard.
- **Défaut du ton** : `fun` ou `serious` par défaut à la création ? Reco : `serious` par défaut,
  `fun` en opt-in explicite (protège la crédibilité et le second signataire).
