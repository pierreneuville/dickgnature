---
name: slicing
description: Découper une feature en slices verticales tracer-bullet démontrables seules, avec classification HITL/AFK et dépendances. Utilisée par le Lead après le cadrage.
---

# Slices verticales

## La règle unique

Une slice traverse **toutes les couches** — migration, backend, frontend, tests — et est
**démontrable seule**. Si tu ne peux pas dire « voilà, ça marche, regarde », ce n'est pas une
slice.

Le découpage par couche (une tâche backend, une tâche frontend, une tâche base) est interdit.
Il produit trois tâches dont aucune n'est démontrable, force trois handoffs, et fait
découvrir les incompatibilités d'interface au dernier moment.

## Première slice : la balle traçante

La première slice traverse le système de bout en bout par le **chemin le plus étroit
possible**. Elle ne gère aucun cas limite. Son but n'est pas d'être complète : c'est de
prouver que le chemin existe et de révéler les surprises tant qu'elles sont bon marché.

Pour « connexion Google » : la balle traçante s'arrête à *un utilisateur créé et une session
valide*. Pas de rattachement de compte, pas de rotation de token, pas de déconnexion.

## Dimensionner

Une slice = une session de build, une branche, une PR. Si le builder doit passer plus d'une
session dessus, elle est trop grosse : coupe-la en gardant la verticalité.

Bon signe : la slice a 2 à 5 critères d'acceptation.
Mauvais signe : la slice s'appelle « mise en place de… » ou « refactor de… ».

## HITL / AFK

Classe chaque slice :

- **AFK** — le builder peut aller au bout sans toi : comportement entièrement spécifié par
  les critères, aucune décision de produit ou de goût en suspens.
- **HITL** — une décision t'attend en cours de route : arbitrage produit, choix visuel,
  compromis non tranché.

Une slice HITL doit être **rendue AFK** avant le build si possible, en tranchant la décision
au cadrage ou par un ADR. Une HITL qui reste HITL est un point d'attente : place-la de façon
à ne pas bloquer les slices parallèles.

## Format

Dans `.factory/<feature>/slices.md` :

```
# Slices — <feature>

## S1 — <titre à l'impératif> · [AFK] · dépend de : —
**Démo** : <ce qu'on montre quand c'est fini, en une phrase>
**Critères**
- [ ] <testable>
- [ ] <testable>
**Touche** : <chemins/modules concernés — sert à détecter les conflits entre slices>
**Statut** : à faire | en cours (<membre>) | verify vert | en review | fait
```

## Parallélisation

Deux slices peuvent partir en parallèle sur les deux builders si leurs champs **Touche** ne
se recoupent pas. Sinon, séquence-les. `builder-b` travaille en git worktree isolé, ce qui
supprime les conflits d'écriture mais pas les conflits logiques : c'est le champ **Touche**
qui les prévient.

## Ordre

Ordonne par risque décroissant, pas par facilité. La slice qui peut invalider l'architecture
passe en premier — c'est le seul moment où se tromper est bon marché.
