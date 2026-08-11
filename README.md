# Factory — équipe Agent Teams AI

Noyau de 4 membres permanents, 7 spécialistes convoqués à la demande, une couche
déterministe, deux gates humains.

## Démarrer

1. Ouvre **Agent Teams AI**, l'équipe `factory` est déjà enregistrée.
2. Lance-la. Elle démarre 4 sessions dans ce dossier.
3. Parle **au `lead` uniquement**. Il cadre, découpe, assigne, arbitre.

Recréer l'équipe après suppression :

```bash
./team/create-team.sh
```

Basculer `builder-b` de Codex vers un second Claude (quota Codex épuisé) :

```bash
./team/swap-builder-b.sh claude
```

`codex` fait l'inverse, sans argument affiche l'état. Arrête l'équipe avant, relance après.

## Utiliser sur un autre projet

Copie `CLAUDE.md`, `.claude/`, `scripts/`, `.factory/_templates/` et `docs/` dans le projet
cible, puis change `cwd` dans `team/config.json` et recrée l'équipe.

## Structure

| Chemin | Rôle |
|---|---|
| `CLAUDE.md` | constitution lue par tous les membres au démarrage |
| `docs/PLAYBOOK.md` | mode d'emploi du Lead, table des déclencheurs de spécialistes |
| `team/config.json` | roster des 4 membres (payload de l'API locale) |
| `.claude/agents/` | 7 spécialistes, invoqués via l'outil Agent — pas des membres |
| `.claude/skills/` | 8 méthodes, chargées à la demande |
| `scripts/verify.sh` | couche déterministe, seul juge des faits |
| `scripts/ci-wait.sh` | verdict CI réel (`gh pr checks --watch`) |
| `.factory/<feature>/` | spec, slices, décisions, findings |

## Les deux règles qui tiennent le reste

1. **Aucun chiffre sans outil.** Un agent qui annonce un résultat non exécuté est en faute.
2. **Référence, ne duplique jamais.** On cite un chemin, on ne recopie pas un contenu.
