---
name: adr
description: Format de décision d'architecture — table de trade-offs à 3 options, ADR Contexte/Décision/Conséquences, fitness functions vérifiables. Utilisée par le Lead et l'agent architect.
---

# ADR-lite

## Quand écrire un ADR

Seulement quand la décision est **coûteuse à annuler** : nouveau module, nouvelle dépendance
structurante, changement de contrat d'API, choix de stockage, frontière de service.

Un choix de bibliothèque utilitaire remplaçable en une heure ne mérite pas d'ADR. Une
décision qu'on peut défaire par un `git revert` non plus.

## Le principe qui prime sur tout

**Monolithe modulaire jusqu'à preuve du contraire.** Toute proposition d'ajouter une couche,
un service, un cache, une file ou une abstraction doit nommer la **contrainte mesurée** qui
l'exige. Sans contrainte mesurée, la décision est de ne rien ajouter.

Ce principe est souvent énoncé et rarement respecté. La table de trade-offs existe
précisément pour rendre visible ce que la complexité coûte.

## Les 3 options

Exactement trois, dont une est toujours **« étendre l'existant / ne rien changer »**. Si tu
n'arrives pas à en formuler trois crédibles, la décision est déjà prise par le contexte :
écris-le en une ligne et passe.

| Option | Coût impl. | Réversibilité | Risque principal | Ce que ça ferme |
|---|---|---|---|---|
| A — étendre l'existant | faible | facile | plafond à N | — |
| B — … | moyen | moyenne | … | … |
| C — … | élevé | difficile | … | … |

**Réversibilité** compte plus que **coût d'implémentation**. Une option chère mais réversible
bat une option bon marché mais définitive, à égalité de bénéfice.

**Ce que ça ferme** est la colonne la plus souvent oubliée et la plus utile : quelles options
futures cette décision élimine.

## Fitness functions

Une décision d'architecture sans mécanisme de vérification dérive en trois mois. Chaque ADR
produit 1 à 3 assertions **exécutables** :

- « Aucun fichier de `ui/` n'importe depuis `db/` » → règle de lint de dépendances.
- « Le temps de réponse p95 de `/api/search` reste < 300 ms » → assertion dans les tests d'intégration.
- « Le bundle client ne dépasse pas 250 kB gzip » → gate de build.

Si tu ne sais pas rendre l'assertion exécutable, écris-la quand même en TODO explicite, en
disant quel outil manque. Une fitness function déclarative est un aveu, pas un contrôle.

## Format final

Append-only dans `.factory/<feature>/decisions.md`. On ne réécrit jamais un ADR : on en
ajoute un nouveau qui supersede l'ancien, en le nommant.

```
## ADR-<n> — <titre>
**Date** : <YYYY-MM-DD>   **Slice** : <id>   **Statut** : accepté | superseded par ADR-<m>

**Contexte**
<2-4 lignes. La contrainte qui force la décision, pas l'historique du projet.>

<table des 3 options>

**Décision**
<une phrase à l'impératif : "On stocke la session dans un cookie signé httpOnly.">

**Conséquences**
- <positive>
- <négative acceptée — cette ligne est obligatoire, une décision sans coût est une décision mal analysée>

**Fitness**
- <assertion vérifiable + outil>
```

40 lignes maximum. Un ADR qu'on ne relit pas ne sert à rien.
