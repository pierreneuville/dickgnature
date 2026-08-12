# Slices — Email de mise en signature

Une seule slice verticale (feature M cohérente, un builder du début à la fin).

## S1 — Invitation à signer par email + renvoi + remontée d'échec
**Statut** : in_progress (builder-a) — branche `feat/invitation-email`
**HITL/AFK** : AFK jusqu'à la PR ; Gate 2 humain sur la PR.
**Dépendances** : aucune (part d'origin/main 1cad615).

Traverse :
- i18n : namespace `invitationEmails` (fun/serious × sender/subject/text/html) + clés
  `participants` (resend, notices) dans en/fr/pt/es.
- domaine : `src/lib/invitation-email.ts` — `buildInvitationEmail` (pur), `sendInvitationEmails`
  (par contrat, transport injectable, `failed[]`), `resendInvitation` (garde open + lookup).
- action : `participants-actions.ts` — envoi après `addParticipants`, redirection avec notice
  d'échec ; nouvelle `resendInvitationAction`.
- UI : bandeau notice sur `contracts/[id]/page.tsx` (via searchParams) + bouton « renvoyer »
  par participant ouvert (composant client `resend-invitation.tsx`, rendu via render-prop pour ne
  pas tirer Prisma dans `participants-list`).
- tests : unitaires `invitation-email.test.ts` (contenu/échappement/ton/lien/expiration),
  intégration `invitation-email.int.test.ts` (envoi, partiel, resend), action inchangée verte.

Démo : inviter un participant → email capturé avec lien `/sign/{token}` + mention d'expiration ;
transport en échec → `failed[]` peuplé + notice créateur ; renvoi depuis la page de suivi.
