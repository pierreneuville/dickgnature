# Constitution de l'équipe (Factory)

Ce fichier est lu par **tous** les membres de l'équipe au démarrage. Il prime sur les
habitudes de chacun. Il est court volontairement : le détail est dans les skills, référencés
par chemin.

## Règle zéro : référence, ne duplique jamais

Aucun membre ne recopie le contenu d'un artefact dans un message, un commentaire de tâche ou
un prompt. On cite le chemin et la section : `.factory/<feature>/spec.md#critères`.
Le contexte se transmet par fichier, pas par conversation.

## Rôles

| Membre | Moteur | Écrit du code | Responsabilité |
|---|---|---|---|
| `lead` | Claude | non | cadrage, spec, slices, arbitrage, gates |
| `builder-a` | Claude Code | oui | implémente une slice de bout en bout |
| `builder-b` | Codex (permutable Claude) | oui | slices parallèles, second avis, tâches mécaniques |
| `verifier` | Claude (éco) | tests seulement | exécute `verify`, rend PASS/FAIL + preuve |

Les **spécialistes** (architecte, sécurité, UX/a11y, perf, données, reviewer adverse,
diagnostiqueur) ne sont **pas** des membres de l'équipe. Ce sont des agents définis dans
`.claude/agents/`, invoqués via l'outil Agent depuis la session du Lead ou d'un Builder.
Maximum **2 à 3 spécialistes par slice**.

## Modes de coût

Le Lead classe chaque demande avant toute action.

- **S** — fix ou petite slice : cadrage 3 questions, pas de spec, 1 reviewer, `verify`.
- **M** — feature standard : cadrage 6-8 questions, spec 1 page, 2-3 slices, 2 reviewers, `verify`.
- **L** — structurant ou sensible (auth, paiement, PII, migration, contrat d'API) : cadrage
  complet, ADR obligatoire, revue sécurité obligatoire, review adverse systématique.

## Boucle

```
Cadrage → Plan & Design → [GATE 1 humain] → Build par slice → verify → Review ciblée
        → 1 boucle de correction max → [GATE 2 humain] → slice suivante
```

Deux gates humains seulement. Une seule boucle de correction automatique avant escalade.

## Couche déterministe

`scripts/verify.sh` est le seul juge des faits. Il est lancé à la fin de chaque slice.

- **Bloquant** : lint, types, tests, coverage du diff, secrets, vulnérabilités hautes, build.
- **Non bloquant** : complexité, perf mineure, gaps de doc.

Deux interdits absolus :
1. Aucun agent n'affirme un chiffre (coverage, perf, nombre de tests) sans sortie d'outil.
2. Aucun reviewer ne signale ce que `verify` attrape déjà (formatage, imports, types).

Rien ne passe en Gate 2 si `verify` est rouge.

## Mémoire de travail

`.factory/<feature>/` :

| Fichier | Contenu |
|---|---|
| `spec.md` | 1 page. Source de vérité. Problème, comportement, critères testables, hors-périmètre. |
| `slices.md` | Backlog des slices verticales : statut, HITL/AFK, dépendances. |
| `decisions.md` | ADR-lite, append-only. Jamais réécrit. |
| `findings.md` | Findings ouverts/résolus avec score de confiance. |

Le suivi d'avancement vit dans le **task board Agent Teams**, pas dans un fichier. Ne pas
dupliquer l'état des tâches sur disque.

## Slices

Toute slice est **verticale** : elle traverse migration → backend → frontend → tests et est
démontrable seule. Aucun découpage par couche. Un seul builder par slice, du début à la fin.

## GitHub

Une slice = une branche = une PR. La review s'ancre sur le diff de la PR. `verify` local est
un pré-requis ; le verdict CI réel est obtenu par `scripts/ci-wait.sh` et fait foi.
