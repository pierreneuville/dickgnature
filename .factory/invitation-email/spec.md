# Email de mise en signature (invitation à signer)
**Mode** : M        **Date** : 2026-08-12
**Statut** : Gate 1 franchi (décisions lead, tâche #7ece1068) — build en cours

## Problème
Aujourd'hui, quand un créateur invite des participants (`addParticipants`), le produit crée le
participant + un token de signature mais **n'envoie aucun email**. Le seul canal de distribution
du lien `/sign/{token}` est l'affichage in-app (page créateur), que le créateur doit copier à la
main. Le participant ne reçoit rien : l'utilisateur constate « je ne reçois pas le mail de mise
en signature » (#7ece1068). Fonctionnalité absente, pas un bug de config (l'infra Resend est OK,
expéditeur notification@dickgnature.com prouvé en envoi externe).

## Comportement attendu
À l'invitation d'un participant, le système lui envoie un email contenant son lien privé et
tokenisé `${SITE_URL}/{locale}/sign/{token}`, dans la langue du contrat (en|fr|pt|es) et selon le
ton (fun|serious). Le créateur peut **renvoyer** l'invitation depuis la page de suivi tant que le
lien est ouvert. L'email étant le SEUL canal, un échec d'envoi est **remonté au créateur** (bandeau
d'avertissement actionnable) sans bloquer la création en base (participant + token restent créés).

## Critères d'acceptation
- [ ] `buildInvitationEmail` produit un message avec expéditeur = `notification@dickgnature.com`
      (via RESEND_FROM_EMAIL), un sujet localisé, un lien `/{locale}/sign/{token}` absolu, et
      mentionne l'expiration (TTL en jours). Valeurs HTML échappées (test unitaire).
- [ ] Le ton fun/serious sélectionne la variante de contenu ; la langue vient de `contract.locale`
      (test unitaire des 2 tons + test d'intégration multi-locale).
- [ ] `sendInvitationEmails` envoie un email par destinataire via le transport injecté ; un envoi
      échoué n'empêche pas les autres et est renvoyé dans `failed[]` + loggué (test d'intégration
      avec CaptureEmailTransport pour le succès, transport en échec pour le partiel).
- [ ] `resendInvitation` renvoie l'email uniquement pour un participant du contrat dont le lien est
      `open` ; sinon renvoie un statut d'échec explicite (`notFound`/`notOpen`) (test d'intégration).
- [ ] `addParticipantsAction` crée les participants PUIS envoie les invitations ; si au moins un
      envoi échoue, redirige avec `?notice=invite-email-failed` ; sinon redirige sans notice. La
      création en base n'est jamais annulée par un échec d'envoi (test d'action).
- [ ] Clés i18n `invitationEmails` (fun/serious) + `participants` (resend/notices) présentes dans
      en, fr, pt, es (couvert par le build/lint i18n + rendu).
- [ ] `scripts/verify.sh` vert (lint, types, tests, coverage du diff, secrets, build).

## Hors périmètre
- Rappels automatiques / relances programmées (au-delà d'un renvoi manuel).
- Modification du flux de complétion (`sendCompletedContractEmails`) — inchangé.
- Régénération de la clé Resend exposée (suivi séparé, action humaine).
- Personnalisation avancée du contenu par le créateur.

## Contraintes
- Réutilise le transport et les patterns i18n/ton existants (email-transport.ts, i18n/messages.ts).
- Pas de dépendance Prisma tirée dans les composants présentiels/tests jsdom (participants-list
  reste sans import serveur : le bouton de renvoi vit dans un composant client dédié).
- Échec d'envoi NON silencieux ici (contrairement à l'email de complétion #18) : remonté au créateur.
- Une slice = une branche = une PR ; `verify` + CI verts avant Gate 2.
