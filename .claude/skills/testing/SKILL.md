---
name: testing
description: Pyramide de tests, critères F.I.R.S.T., et règle de traçabilité entre critères d'acceptation et tests. Utilisée par les builders et le Verifier.
---

# Tests

## Traçabilité — la règle qui compte le plus

**Chaque critère d'acceptation de `spec.md` a exactement un test qui le vérifie.** Le nom du
test cite le critère. À la fin d'une slice, on doit pouvoir mettre la liste des critères et la
liste des tests en face l'une de l'autre.

Un critère sans test n'est pas implémenté, quelle que soit l'apparence du code.

## Pyramide

| Niveau | Proportion visée | Ce qu'il couvre |
|---|---|---|
| unitaire | ~70 % | logique métier, cas limites, branches d'erreur |
| intégration | ~20 % | frontières réelles : base, API, sérialisation |
| bout en bout | ~10 % | **un** parcours nominal par feature |

Le renversement classique — beaucoup d'E2E, peu d'unitaires — produit une suite lente,
instable, et qui ne localise pas la panne. Un E2E rouge dit « quelque chose est cassé » ;
un unitaire rouge dit « cette fonction est cassée ».

Une slice verticale mérite **un** E2E : le chemin de sa démo. Pas plus.

## F.I.R.S.T.

- **Fast** — la suite unitaire tourne en secondes. Un test lent ne sera pas lancé.
- **Isolated** — aucun test ne dépend de l'ordre ni de l'état laissé par un autre. Test qui
  passe seul et échoue en suite = défaut du test, à corriger tout de suite.
- **Repeatable** — pas d'horloge réelle, pas d'aléatoire non semé, pas de réseau, pas de
  dépendance à un fuseau ou à une locale.
- **Self-validating** — le test décide seul ; aucune inspection manuelle de sortie.
- **Timely** — écrit avec le code, pas dans une slice « ajout de tests » ultérieure.

## Ce qu'on teste, ce qu'on ne teste pas

**On teste** : le comportement observable, les cas limites (vide, null, doublon, maximum,
concurrence), les branches d'erreur, les contrats aux frontières.

**On ne teste pas** : les détails d'implémentation privés, les getters triviaux, la
bibliothèque tierce elle-même, ni le framework. Un test qui casse à chaque refactor sans
changement de comportement teste la mauvaise chose.

## Mocks

Mocke à la frontière du système (réseau, horloge, système de fichiers), jamais à l'intérieur
de ta propre logique. Un test qui mocke trois de tes propres modules ne teste plus rien
d'autre que la façon dont tu les as câblés.

## Test de régression

Tout bug corrigé produit un test qui **échoue avant le correctif et passe après**. Vérifie
les deux sens : un test qui n'a jamais été vu rouge ne prouve rien.

## Interdits

- `.only` ou `.skip` laissés dans le diff — `verify` les signale.
- Assertion sur un message d'erreur formaté pour l'humain (fragile) plutôt que sur un code.
- `sleep` / `wait(500)` pour synchroniser : attends une condition, pas une durée.
- Annoncer un résultat de test sans avoir exécuté la commande.
