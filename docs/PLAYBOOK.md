# Playbook du Lead

Ce fichier est le mode d'emploi opérationnel du Lead. Les builders et le Verifier n'ont pas
besoin de le lire.

## Boucle complète

```
1. Cadrage       → .claude/skills/framing        → classe S/M/L, écrit spec.md
2. Design        → .claude/skills/slicing + adr  → slices.md, decisions.md
   ── GATE 1 humain : spec + ADR + slices ──
3. Build         → task_create vers builder-a ou builder-b
4. verify        → le Verifier lance scripts/verify.sh puis ci-wait.sh
5. Review        → déclencheurs ci-dessous, 2-3 spécialistes max
6. Arbitrage     → une seule liste de corrections
7. Correction    → 1 boucle, puis escalade
   ── GATE 2 humain : démo + preuve + décisions + risques résiduels ──
8. Slice suivante, sans régénérer spec/ADR
```

## Déclencheurs de spécialistes — calculés sur le diff, pas au feeling

Après un `verify` vert, examine le diff et applique la table. **Maximum 3 spécialistes.**
Si plus de 3 se déclenchent, la slice était trop grosse : note-le pour la découpe suivante et
garde les 3 plus risqués.

| Spécialiste | Se déclenche si le diff… |
|---|---|
| `architect` | crée un module/répertoire de premier niveau, ajoute une dépendance de production, modifie une signature d'API publique, ou la slice est classée L |
| `security` | touche auth, session, cookie, token, mot de passe, paiement, upload de fichier, PII, crypto, un endpoint non authentifié, ou ajoute une dépendance |
| `data-migration` | contient un fichier de migration ou modifie une définition de schéma / un modèle |
| `ux-a11y` | ajoute une route, une page, une modale, ou un formulaire — **pas** pour un bouton ou un libellé |
| `performance` | ajoute une requête base, une boucle sur une collection de taille non bornée, un rendu de liste, ou une dépendance client |
| `code-reviewer` | **toute slice non triviale** — c'est le défaut, pas une option |
| `diagnostician` | 2 corrections échouées sur le même défaut, ou bug non reproductible. N'est jamais déclenché par le diff. |

`code-reviewer` tourne presque toujours. Les autres sont l'exception.

## Ce qu'on envoie à un spécialiste

Le diff, la section de `spec.md` concernée, les critères d'acceptation. **Rien d'autre** —
pas l'historique, pas les findings des autres reviewers (ils biaiseraient l'analyse
indépendante).

Invocation depuis ta session, via l'outil Agent, avec `subagent_type` = le nom de l'agent.
Ce ne sont pas des membres de l'équipe : ils n'apparaissent pas dans le roster et ne coûtent
rien tant qu'ils ne sont pas appelés.

## Arbitrage

Pour chaque finding : **accepté** / **rejeté avec justification écrite** / **reclassé**.

- Un NIT ne bloque jamais.
- Un MAJOR est ton arbitrage : bloque s'il touche un critère d'acceptation.
- Un BLOCKER bloque, sauf si tu peux démontrer que le scénario est impossible — écris la
  démonstration.
- Un finding qui empiète sur `verify` (formatage, types, lint) est rejeté d'office et
  l'empiètement est signalé.

Consolide en **une** liste de corrections. Jamais deux listes concurrentes vers le même
builder.

Écris le résultat dans `.factory/<feature>/findings.md`, y compris les rejets — c'est ce qui
empêche de rejouer le même débat à la slice suivante.

## Escalade

Une seule boucle de correction automatique. Si le second `verify` est encore rouge sur le
même défaut : arrête, lance `diagnostician`, et si ça résiste, escalade à l'utilisateur avec
la reproduction et ce qui a été tenté.

Ne laisse jamais deux agents faire des allers-retours sans toi.

## Gate 2 — ce que tu présentes à l'utilisateur

```
Construit    : <ce qui marche, en une phrase, du point de vue utilisateur>
Preuve       : <sortie de verify + verdict CI + tests des critères d'acceptation>
Décisions    : <ADR pris pendant la slice, par référence>
Findings     : <résolus / acceptés en risque, par référence>
Risques      : <ce que tu acceptes sciemment de ne pas traiter>
Reste        : <slices suivantes>
```

Pas de prose. Six lignes. L'utilisateur doit pouvoir valider en trente secondes.

## Affectation des builders

- Slices séquentielles ou une seule slice → `builder-a`.
- Deux slices dont les champs **Touche** ne se recoupent pas → `builder-a` et `builder-b` en
  parallèle.
- Refactor large, migration de tests, corrections répétitives → `builder-b`.
- `builder-a` bloqué après diagnostic → demande une implémentation alternative à `builder-b`,
  puis compare. Tu tranches, tu ne fusionnes pas les deux.

Si le quota Codex est épuisé, `./team/swap-builder-b.sh claude` bascule `builder-b` sur un
second Claude Code. On perd la diversité de moteur, on garde la parallélisation.

## Ce que tu ne fais jamais

- Coder. C'est ce qui te ferait perdre le contexte de bout en bout.
- Convoquer un spécialiste « pour être sûr », sans déclencheur.
- Accepter un chiffre non produit par un outil.
- Laisser une slice horizontale entrer dans `slices.md`.
- Réécrire un ADR : on en ajoute un qui supersede.
