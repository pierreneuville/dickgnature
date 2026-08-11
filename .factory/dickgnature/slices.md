# Slices — dickgnature

Ordre par risque décroissant. Chaque slice traverse migration → backend → frontend → tests et
est démontrable seule. Une slice = une branche = une PR. Statuts figés au Gate 1.

## S1 — Créer et afficher un contrat (balle traçante) · [AFK*] · dépend de : —
**Démo** : je crée un contrat (ton `fun` ou `serious`), j'obtiens une URL publique qui l'affiche selon le ton.
**Critères**
- [ ] Migration : table `contract` (id, title, body, `tone` enum `fun|serious`, status=draft, created_at).
- [ ] `POST /contracts` persiste (dont `tone`) et renvoie l'id ; `GET /contracts/:id` rend la page.
- [ ] En `serious`, aucune marque/élément humoristique sur la page ; en `fun`, disclaimer parodique présent.
- [ ] Test API (create/get, les 2 tons) + test de rendu + test d'absence d'humour en `serious`.
**Touche** : schéma DB (contract), route contracts, page contrat, setup projet (framework, ORM, verify), thème par ton.
**Statut** : à faire
**Branche/PR** : —
> *AFK dès que la stack + le défaut de ton sont confirmés au Gate 1. Cette slice fige la stack : à faire en premier.*

## S2 — Signer sur canvas (manuscrit + pattern) · [HITL] · dépend de : S1
**Démo** : sur un contrat, je signe (manuscrit toujours dispo ; pattern seulement si `tone=fun`), je recharge, la signature reste.
**Critères**
- [ ] Migration : table `signature` (id, contract_id, participant ref, mode, image, signed_at).
- [ ] Composant canvas : `handwritten` **disponible quel que soit le ton** ; `pattern` proposé
      uniquement si le contrat est en `tone=fun`.
- [ ] `POST` de signature persiste l'image (PNG dataURL) ; ré-affichage après reload.
- [ ] Test de capture + persistance + rendu + test : `pattern` absent en `tone=serious`.
**Touche** : schéma DB (signature), route signatures, composant canvas, page contrat.
**Statut** : à faire
**Branche/PR** : —
> **HITL** : UX du mode « pattern » (tracé libre guidé ? gabarit/stencil ? tampon animé ?) —
> décision produit/goût à trancher par le user au Gate 1, sinon la slice reste bloquée.

## S3 — Participants + flux de signature par lien tokenisé · [AFK*] · dépend de : S1 (+ S2 pour la démo complète)
**Démo** : j'ajoute 2 emails, chaque participant ouvre SON lien sans compte et signe ; le statut du contrat évolue.
**Critères**
- [ ] Migration : table `participant` (id, contract_id, email, token, signed_at?).
- [ ] Génération de tokens ≥128 bits, non devinables ; un lien = un participant, sans compte.
- [ ] Machine à états `draft → sent → partially_signed → completed` pilotée par les signatures.
- [ ] La page de signature respecte le `tone` du contrat (jamais d'humour imposé au signataire en `serious`).
- [ ] Test : N participants → N liens uniques ; test de transitions d'état ; test neutralité `serious`.
**Touche** : schéma DB (participant), route signing links, page de signature, machine à états contrat.
**Statut** : à faire
**Branche/PR** : —
> *AFK sauf modèle d'auth du **créateur** (question ouverte Gate 1). Le flux signataire reste sans compte.*

## S4 — PDF signé + page « Pourquoi ce PDF est probant » · [AFK*] · dépend de : S2, S3
**Démo** : sur un contrat `completed`, je télécharge un PDF valide (texte + signatures + audit) et je vois la page de preuve.
**Critères**
- [ ] `GET /contracts/:id/pdf` génère un PDF côté serveur (texte + images de signature + bloc audit),
      neutre en `tone=serious`.
- [ ] Bloc audit : horodatage, email par signataire, empreinte/hash du document, journal d'événements.
- [ ] Page « Pourquoi ce PDF est probant » : consentement, horodatage, empreinte doc, journal +
      badge de niveau **SES** explicite (jamais QES).
- [ ] Test : parsing du PDF → assertions présence texte/signatures/audit ; test de présence de la page preuve.
**Touche** : service PDF (pdf-lib), route pdf, page contrat (bouton download), page preuve, service d'empreinte/journal.
**Statut** : à faire
**Branche/PR** : —
> *AFK ; le libellé du disclaimer et la profondeur de preuve au MVP (SES seul vs OTP) sont à confirmer Gate 1.*

## S5 — Envoyer la copie signée par email · [AFK*] · dépend de : S4
**Démo** : un contrat passe `completed` → chaque participant reçoit un email avec le PDF signé.
**Critères**
- [ ] À la transition `completed`, envoi d'un email + PDF en pièce jointe à chaque participant.
- [ ] Transport email derrière une interface (swap provider sans toucher au métier).
- [ ] Test avec transport en mode capture/dev : assertion destinataires + présence pièce jointe.
**Touche** : service email (interface + provider), hook de transition d'état, templates email.
**Statut** : à faire
**Branche/PR** : —
> *AFK dès que le provider email est confirmé au Gate 1 (reco : Resend derrière interface).*

## S6 — Templates « entre amis » (candidat post-cœur) · [HITL] · dépend de : S1
**Démo** : à la création, je choisis un modèle (reconnaissance de dette, prêt d'objet, pari, coloc…) qui pré-remplit le contrat.
**Critères**
- [ ] Catalogue de 4-6 templates (texte + champs minimum), langage clair, réutilisant `contract.body`.
- [ ] Création depuis un template pré-remplit le corps ; le créateur peut éditer avant envoi.
- [ ] Test : création depuis template → corps attendu ; template inconnu → erreur propre.
**Touche** : données templates (statique ou table), page création (sélecteur), route contracts.
**Statut** : à faire
**Branche/PR** : —
> **HITL** : quels templates au lancement + rédaction des textes = décision produit. Angle de
> différenciation (#6288e10e), mais **hors chemin critique** : à ordonner après le cœur S1–S5.

## Parallélisation
- S1 d'abord, seule (fige stack/DB/verify). Rien en parallèle tant que S1 n'est pas verte.
- Après S1 : S2 et S3 partagent la page contrat et le schéma — **séquencer** (conflit logique),
  sauf à isoler le composant canvas (S2) du flux liens (S3). Reco : S2 puis S3.
- S4 après S2+S3. S5 après S4. Chaîne linéaire par nature (chaque slice consomme la précédente).
- S6 ne touche que la création + les données templates : parallélisable avec S2/S3/S4 une fois S1
  verte (pas de recoupement **Touche** avec le flux de signature). Prioriser après le cœur S1–S5.
