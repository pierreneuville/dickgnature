---
name: quality-gates
description: Classification bloquant / non bloquant des gates de qualité, et règle de preuve interdisant toute affirmation chiffrée non produite par un outil. Utilisée par le Verifier, les builders et le Lead.
---

# Gates de qualité

## La règle de preuve

**Aucun agent n'affirme un chiffre qu'un outil n'a pas produit.**

Interdit : « la couverture est d'environ 85 % », « les tests passent », « c'est plus rapide ».
Attendu : la commande exacte, son code de sortie, l'extrait de sortie qui porte le chiffre.

Cette règle existe parce qu'un seuil déclaratif — « > 80 % de couverture » affirmé par un
agent — est indiscernable d'un seuil respecté, et coûte la confiance dans tout le reste.

Corollaire : si un outil n'est pas câblé, le gate est **ignoré et déclaré ignoré**, jamais
supposé vert. `scripts/verify.sh` liste explicitement ses gates `SKIP`.

## Classification

**Bloquant — rien ne passe en review humaine tant que c'est rouge :**

| Gate | Critère |
|---|---|
| lint | 0 erreur |
| typecheck | 0 erreur |
| tests | 0 échec |
| build | succès |
| secrets | aucun motif de secret dans les lignes ajoutées |
| dépendances | 0 vulnérabilité `high` ou `critical` |
| couverture du diff | seuil du projet, **calculé sur le diff uniquement** |

**Non bloquant — signalé, arbitré par le Lead, jamais un motif de blocage :**

complexité cyclomatique, duplication, régression de perf mineure, gaps de documentation,
`TODO`/`console.log` laissés dans le diff, warnings de formatage.

## Couverture : sur le diff, jamais globale

Un seuil de couverture global punit les dépôts anciens et ne dit rien sur le code qu'on vient
d'écrire. Le seul chiffre qui a du sens est : **quelle proportion des lignes ajoutées ou
modifiées est exécutée par les tests**. C'est ce que mesure le gate `coverage (diff)`.

Tant que le projet n'a pas de script `test:coverage` borné au diff, ce gate est `SKIP` — donc
inexistant, pas satisfait.

## Ordre d'exécution

Du plus rapide au plus lent, arrêt utile en premier : lint → typecheck → tests ciblés →
tests complets → couverture → build → audit → secrets. Un builder qui itère lance
`./scripts/verify.sh --blocking` ; le Verifier lance la passe complète.

## Le verdict CI prime

`verify` local est un pré-requis, pas une preuve d'intégration. Quand une PR existe, le
verdict qui fait foi est celui de `scripts/ci-wait.sh` (`gh pr checks --watch`). Un `verify`
vert et une CI rouge se tranchent toujours en faveur de la CI, et l'écart entre les deux est
lui-même un défaut à corriger.

## Frontière avec la review

**Tout ce qu'un gate déterministe peut trancher, aucun agent de review n'a le droit de le
commenter.** Si un reviewer signale un problème de formatage ou de type, le Lead le rejette
et signale l'empiètement. Cette frontière est ce qui rend les reviews lisibles.
