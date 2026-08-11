---
name: review-rubric
description: Rubrique de scoring de confiance 0-100 des findings de review, seuil de coupure à 80, liste des faux positifs à ne jamais signaler, format de citation. Utilisée par tous les agents reviewers et par le Lead pour arbitrer.
---

# Rubrique de review

Le coût d'un faux positif est supérieur à celui d'un finding manqué : un reviewer qui crie au
loup est ignoré, et ses vrais findings avec lui.

## Scoring de confiance

Pars de 50. Applique les modificateurs.

**Monte**
+25 — tu as construit un scénario d'échec concret : entrées précises → sortie erronée.
+20 — tu as lu le code appelant et confirmé que le chemin est atteignable.
+15 — le comportement contredit un critère d'acceptation écrit dans `spec.md`.
+10 — le même motif a déjà causé un bug ailleurs dans ce dépôt (cite-le).
+10 — tu as exécuté quelque chose qui le démontre.

**Descend**
−25 — tu supposes un contexte d'appel que tu n'as pas vérifié.
−20 — tu n'as pas lu la définition de la fonction ou du type impliqué.
−20 — le finding repose sur « et si un jour… ».
−15 — un garde-fou existe peut-être ailleurs et tu ne l'as pas cherché.
−15 — c'est une préférence déguisée en défaut.

**Seuil : on ne rapporte que ≥ 80.** Exception unique : un BLOCKER de sécurité ou de perte de
données remonte dès 60, en le marquant `à vérifier`.

Un score n'est pas décoratif : si tu ne peux pas justifier chaque modificateur appliqué, ton
score est faux.

## Sévérités

| Niveau | Définition | Bloque ? |
|---|---|---|
| **BLOCKER** | perte de données, faille exploitable, régression fonctionnelle sur un chemin réel | oui |
| **MAJOR** | bug dans un cas d'usage réel, contournable ou rare | décision du Lead |
| **NIT** | vrai mais mineur | jamais |

## Ne JAMAIS signaler

1. Ce que `scripts/verify.sh` attrape : formatage, imports, types, lint, tests cassés,
   secrets, dépendances vulnérables. Si tu le signales, tu dupliques un gate déterministe et
   tu dilues ta review.
2. Style, nommage, ordre des déclarations, préférences syntaxiques.
3. « Extraire une fonction » sans duplication réelle constatée.
4. Optimisation sans mesure ni volumétrie.
5. Tests manquants sur du code que le diff ne touche pas.
6. Gestion d'erreur pour une condition qui ne peut pas survenir ici.
7. Toute phrase commençant par « envisager de », « il serait préférable », « on pourrait ».
8. Un défaut déjà présent avant le diff, sauf si le diff l'aggrave — dans ce cas, dis-le.

## Format de finding

```
[BLOCKER|MAJOR|NIT] <titre en une ligne, le défaut, pas le remède> — confiance <0-100>
Fichier  : <chemin>:<ligne début>-<ligne fin>   SHA : <sha court>
Scénario : <entrées concrètes → état → sortie erronée>
Correctif: <une phrase>
```

Le champ **Scénario** est le filtre réel : si tu n'arrives pas à l'écrire avec des valeurs
concrètes, le finding n'existe pas. Supprime-le.

## Volume

**Maximum 10 findings par reviewer.** Au-delà, tu as basculé en inventaire et le Lead ne
triera pas. Si tu en as plus, garde les 10 plus sévères et signale en une ligne qu'il y a un
problème systémique — c'est un finding plus utile que les 15 instances.

Si rien ne passe le seuil : `Aucun finding au-dessus du seuil.` C'est un résultat valide.

## Arbitrage (Lead uniquement)

Les reviewers proposent, le Lead décide. Pour chaque finding : **accepté**, **rejeté avec
justification écrite**, ou **reclassé**. Un rejet sans justification n'est pas un rejet.
Le Lead consolide en **une seule** liste de corrections envoyée au builder — jamais plusieurs
listes concurrentes.
