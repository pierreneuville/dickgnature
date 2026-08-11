#!/usr/bin/env bash
# Crée (ou recrée) l'équipe "factory" dans Agent Teams AI à partir de team/config.json.
# L'app Agent Teams AI doit être lancée : elle publie son port dans ~/.claude/team-control-api.json.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_FILE="$HOME/.claude/team-control-api.json"
CONFIG="$ROOT/team/config.json"

[ -f "$API_FILE" ] || { echo "✗ $API_FILE introuvable — lance l'app Agent Teams AI."; exit 1; }
[ -f "$CONFIG" ]   || { echo "✗ $CONFIG introuvable."; exit 1; }

BASE_URL="$(python3 -c 'import json,sys;print(json.load(open(sys.argv[1]))["baseUrl"])' "$API_FILE")"
TEAM="$(python3 -c 'import json,sys;print(json.load(open(sys.argv[1]))["teamName"])' "$CONFIG")"

# Le cwd du fichier de config doit pointer sur ce dépôt : on le réécrit à la volée.
PAYLOAD="$(python3 - "$CONFIG" "$ROOT" <<'PY'
import json, sys
cfg = json.load(open(sys.argv[1]))
cfg["cwd"] = sys.argv[2]
print(json.dumps(cfg))
PY
)"

echo "→ API   : $BASE_URL"
echo "→ Équipe: $TEAM"
echo "→ cwd   : $ROOT"

if curl -sf --max-time 5 "$BASE_URL/api/teams/$TEAM" >/dev/null 2>&1; then
  echo "✗ L'équipe '$TEAM' existe déjà."
  echo "  Supprime-la depuis l'app, ou édite ~/.claude/teams/$TEAM/config.json à la main."
  exit 1
fi

HTTP_BODY="$(curl -s --max-time 10 -X POST "$BASE_URL/api/teams" \
  -H 'content-type: application/json' -d "$PAYLOAD")"

case "$HTTP_BODY" in
  *'"error"'*) echo "✗ Refusé par l'API : $HTTP_BODY"; exit 1 ;;
  *) echo "✓ Créée : $HTTP_BODY" ;;
esac

echo
echo "Config persistée : ~/.claude/teams/$TEAM/config.json"
echo "Lance l'équipe depuis l'app Agent Teams AI (elle démarrera 4 sessions dans $ROOT)."
