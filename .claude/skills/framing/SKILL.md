---
name: framing
description: Cadrage adaptatif avant d'écrire une ligne de code — explorer le code d'abord, puis poser un nombre de questions budgété par le mode S/M/L, chacune avec une recommandation. Utilisée par le Lead au démarrage de toute demande.
---

# Cadrage budgété

Interroger avant de coder est la meilleure décision de coût du cycle. Imposer 32 questions
tue le flux. Le budget dépend du mode.

## Étape 1 — explorer avant de questionner (obligatoire)

Tu n'as pas le droit de poser une question dont la réponse est dans le code. Avant la
première question, réponds pour toi-même :

- Cette capacité existe-t-elle déjà, même partiellement ? Où ?
- Quelles conventions le dépôt impose-t-il (structure, tests, gestion d'erreur, état) ?
- Quels appelants seront touchés ?
- Qu'est-ce qui, dans le code existant, contraint la solution ?

Cette exploration divise par deux le nombre de questions nécessaires.

## Étape 2 — classer

| Mode | Critère | Budget |
|---|---|---|
| **S** | fix, ajustement, slice triviale | 3 questions, pas de spec |
| **M** | feature standard | 6-8 questions, spec 1 page |
| **L** | structurant ou sensible : auth, paiement, PII, migration, contrat d'API public, nouveau module | cadrage complet, ADR + revue sécurité obligatoires |

Annonce le mode et sa justification. L'utilisateur peut le corriger.

## Étape 3 — format de question

Jamais de question ouverte. Toujours : **ta position, la raison, la demande de confirmation.**

> **Ma position** : sessions en cookie signé httpOnly, pas de JWT en localStorage.
> **Parce que** : pas de besoin de scalabilité multi-domaine ici, et le localStorage est
> lisible par n'importe quel script injecté.
> **Tu confirmes, ou tu vois une contrainte que je rate ?**

Une question sans recommandation transfère ton travail à l'utilisateur.

## Ce sur quoi porter les questions

Par ordre de rentabilité :

1. **Le hors-périmètre.** Ce que la feature ne fait *pas* est plus informatif que ce qu'elle fait.
2. **Le comportement aux limites.** Que se passe-t-il si c'est vide, en double, déjà existant, hors ligne ?
3. **Qui est concerné.** Utilisateurs existants ? Données existantes ? Migration nécessaire ?
4. **Le critère de succès.** Comment saura-t-on que c'est fait ? Formulable en test ?
5. **La contrainte non dite.** Délai, compatibilité, dépendance externe, dette acceptée.

Ne demande jamais la stack, les conventions, ou l'emplacement des fichiers : lis le code.

## Étape 4 — produire

- Mode S : un paragraphe de confirmation, puis on code.
- Mode M et L : `.factory/<feature>/spec.md`, une page maximum, structure :

```
# <feature>
**Mode** : M | L        **Date** : <YYYY-MM-DD>

## Problème
<2-3 lignes : qui souffre de quoi aujourd'hui>

## Comportement attendu
<ce que fait le système après, du point de vue utilisateur>

## Critères d'acceptation
- [ ] <testable, vérifiable par une commande ou un test — pas "l'UI est claire">

## Hors périmètre
- <explicite, pour empêcher la dérive>

## Contraintes
<techniques, de compatibilité, de délai>
```

Si un critère d'acceptation n'est pas formulable en test, ce n'est pas un critère : c'est
une intention. Reformule-le ou déplace-le en contrainte.
