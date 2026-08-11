---
name: handoff
description: Protocole de transmission entre membres — référencer par chemin sans jamais dupliquer, contexte minimal par destinataire, format de passation. Utilisée par tous les membres de l'équipe.
---

# Handoff

## Règle unique : référence, ne duplique jamais

Si l'information est déjà dans un fichier, **on cite son chemin et sa section**. On ne la
recopie ni dans un message, ni dans un commentaire de tâche, ni dans un prompt de
sous-agent.

```
✗  "Voici la spec : [800 lignes recopiées]"
✓  "Critères : .factory/auth-google/spec.md#critères-dacceptation"
```

Trois raisons, dans l'ordre d'importance :

1. **Divergence.** Une copie devient fausse dès que l'original change, et personne ne sait
   laquelle fait foi.
2. **Coût.** Le contexte dupliqué est repayé à chaque agent et à chaque tour.
3. **Dilution.** Un message de 800 lignes n'est pas lu ; l'instruction utile s'y noie.

## Contexte minimal par destinataire

Chaque destinataire reçoit **exactement** ce dont son mandat a besoin, jamais l'historique.

| Destinataire | Reçoit |
|---|---|
| Builder | la slice, le chemin de `spec.md`, les ADR applicables, la branche |
| Reviewer spécialiste | le diff, la section de spec concernée, les critères — rien d'autre |
| Verifier | la branche et le numéro de PR |
| Diagnostiqueur | la reproduction, ce qui a déjà été tenté et pourquoi ça a échoué |

Donner l'historique complet à un reviewer ne l'aide pas : ça l'oriente vers ce que tu as déjà
pensé, ce qui est exactement l'inverse du but d'une review adverse.

## Format de passation

```
Objet    : <une ligne>
Artefacts: <chemins, avec ancres de section>
Fait     : <ce qui est terminé et vérifié, avec la preuve>
À faire  : <l'action attendue du destinataire, à l'impératif>
Contrainte: <ce qu'il ne doit pas toucher>
Ouvert   : <décisions non tranchées, s'il y en a>
```

Le champ **Fait** ne contient que du vérifié. « J'ai implémenté X » n'est pas du vérifié ;
« `verify` PASS, sortie en commentaire de la tâche #12 » l'est.

## Où écrire quoi

- **Résultat durable d'une tâche** → commentaire de tâche (task comment). Il survit à la
  session.
- **Question ou déblocage** → message direct au Lead.
- **Décision** → `.factory/<feature>/decisions.md`, par le Lead uniquement.
- **Finding** → `.factory/<feature>/findings.md`, par le Lead après arbitrage.
- **Avancement** → le task board. Jamais dupliqué dans un fichier.

## Reprise de session

Une session peut mourir. Le test du protocole : **un membre qui redémarre à froid doit
pouvoir reprendre en lisant `CLAUDE.md`, `.factory/<feature>/` et son task briefing.**

Si une information nécessaire n'existe que dans l'historique de conversation, elle est perdue.
Écris-la dans un fichier avant d'en avoir besoin.
