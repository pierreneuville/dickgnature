---
name: diagnose
description: Protocole de debug — reproduire, formuler des hypothèses réfutables, instrumenter aux points de bifurcation, remonter à la cause racine, prouver par un test. Déclenché après 2 corrections échouées ou sur un bug non reproductible.
---

# Diagnostic

## Le déclencheur

Deux tentatives de correction échouées. Cela ne veut pas dire que le correctif était mal
écrit : cela veut dire que **le modèle mental du bug est faux**. Une troisième tentative dans
le même modèle échouera aussi.

Arrête de corriger. Recommence par observer.

## 1. Reproduire

Trouve la plus petite commande ou le plus petit test qui produit l'échec **de façon
déterministe**. Tant que tu n'as pas ça, tu n'as rien : tu ne pourras ni valider une
hypothèse, ni prouver un correctif.

Si le bug n'est pas reproductible, ton livrable n'est pas le correctif : c'est le harnais de
reproduction. Cherche ce qui varie — ordre, horloge, concurrence, données, environnement,
cache — et fixe-le une variable à la fois.

## 2. Trois hypothèses, écrites avant d'instrumenter

Pour chacune :
- ce qu'elle prédit qu'on **devrait** observer si elle est vraie,
- ce qui la **réfuterait**.

Une hypothèse qu'aucune observation ne peut réfuter n'en est pas une : jette-la.

Écrire les hypothèses avant d'instrumenter empêche le biais de confirmation, qui est la
cause dominante des diagnostics qui tournent en rond.

## 3. Instrumenter aux points de bifurcation

Pas de logs partout. Aux endroits qui **discriminent** entre les hypothèses : la valeur qui
sera différente selon celle qui est vraie.

Puis **exécute et lis la sortie réelle**. Pas la sortie attendue. La quasi-totalité des
diagnostics longs viennent d'avoir supposé une valeur qu'on n'a jamais regardée.

## 4. Cause racine

La cause racine n'est pas la ligne qui plante. C'est **l'invariant violé** et l'endroit où il
a été violé — souvent très en amont du symptôme.

Test : si ton correctif est sur la ligne qui plante, demande-toi comment cette valeur
invalide est arrivée là. Tant que tu as une réponse, tu n'es pas à la racine.

## 5. Prouver

Écris un test qui échoue avant le correctif, applique le correctif, vérifie qu'il passe.
Les deux exécutions doivent apparaître dans ton compte rendu. Un correctif non prouvé est une
hypothèse de plus.

## 6. Correctif minimal, puis nettoyer

Le correctif traite la cause racine, rien d'autre. Ne profite pas du passage pour refactorer.
Retire toute l'instrumentation temporaire.

## Compte rendu

```
Reproduction : <commande exacte + sortie observée>
Hypothèses   : H1 <…> / H2 <…> / H3 <…>
Observation  : <ce qui a été mesuré, et quelle hypothèse elle retient>
Cause racine : <invariant violé> — <fichier>:<ligne>
Preuve       : <test ajouté> — rouge avant, vert après (sorties)
Correctif    : <diff minimal>
Nettoyage    : instrumentation retirée
```

## Interdits

- Deviner. Non observé = non conclu.
- « Ça devrait marcher maintenant » sans exécution.
- Corriger le symptôme quand la cause est identifiée ailleurs.
- Élargir le correctif au-delà de la cause racine.
