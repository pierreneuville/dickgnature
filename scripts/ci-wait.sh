#!/usr/bin/env bash
# Attend le verdict CI RÉEL de la PR courante. On ne suppose jamais qu'un pipeline est vert.
#
#   ./scripts/ci-wait.sh            # PR de la branche courante
#   ./scripts/ci-wait.sh 123        # PR explicite
#
# Sortie : liste des checks + code 0 (tous verts) / 1 (au moins un rouge) / 2 (indisponible).
set -uo pipefail

PR="${1:-}"

command -v gh >/dev/null 2>&1 || { echo "✗ gh CLI absent — installe-le ou passe en mode local."; exit 2; }
gh auth status >/dev/null 2>&1 || { echo "✗ gh non authentifié (gh auth login)."; exit 2; }

if [ -z "$PR" ]; then
  PR="$(gh pr view --json number --jq .number 2>/dev/null || true)"
fi
[ -n "$PR" ] || { echo "✗ Aucune PR pour la branche courante."; exit 2; }

echo "▸ Attente des checks CI de la PR #$PR…"
gh pr checks "$PR" --watch --interval 20
RC=$?

echo
echo "── état final ──"
gh pr checks "$PR" || true

if [ $RC -eq 0 ]; then
  echo "RESULT: CI PASS (PR #$PR)"
else
  echo "RESULT: CI FAIL (PR #$PR) — le verdict CI prime sur le verify local."
fi
exit $RC
