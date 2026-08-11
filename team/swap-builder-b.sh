#!/usr/bin/env bash
# Bascule builder-b entre Codex et Claude (quand le quota Codex est épuisé, ou l'inverse).
#
#   ./team/swap-builder-b.sh claude   # builder-b devient un second Claude Code (opus)
#   ./team/swap-builder-b.sh codex    # builder-b repasse sur Codex
#   ./team/swap-builder-b.sh          # affiche l'état courant
#
# Arrête l'équipe dans l'app AVANT de lancer ce script : la config est relue au démarrage.
set -euo pipefail

TEAM="factory"
DIR="$HOME/.claude/teams/$TEAM"
TARGET="${1:-status}"

# members.meta.json fait autorité pour le roster. L'app réécrit config.json au
# lancement en y omettant providerId/model/isolation : ne jamais l'éditer ici.
CFG="$DIR/members.meta.json"
[ -f "$CFG" ] || { echo "✗ Aucun roster dans $DIR — crée d'abord l'équipe (team/create-team.sh)."; exit 1; }
echo "→ fichier : $CFG"

python3 - "$CFG" "$TARGET" <<'PY'
import json, sys, shutil

path, target = sys.argv[1], sys.argv[2]
cfg = json.load(open(path))
members = cfg.get("members") or []
member = next((m for m in members if (m.get("name") or "").strip() == "builder-b"), None)
if member is None:
    sys.exit("✗ Aucun membre 'builder-b' dans la config.")

current = member.get("providerId") or "anthropic"
if target == "status":
    print(f"builder-b → providerId={current} model={member.get('model') or '(défaut)'} effort={member.get('effort')}")
    sys.exit(0)

if target == "claude":
    member["providerId"] = "anthropic"
    # Alias : résout vers le dernier Opus du runtime (Opus 4.8 aujourd'hui).
    # claude-opus-5 n'est pas exposé par ce runtime.
    member["model"] = "opus"
    member["effort"] = "high"          # anthropic : low|medium|high|max
elif target == "codex":
    member["providerId"] = "codex"
    member.pop("model", None)          # laisse Codex choisir son modèle par défaut
    member["effort"] = "high"          # codex : minimal|low|medium|high|xhigh|max|ultra
else:
    sys.exit("✗ Cible inconnue. Utilise 'claude', 'codex' ou rien.")

member.pop("providerBackendId", None)  # invalide après changement de provider
member["isolation"] = "worktree"       # les deux builders restent isolés

shutil.copyfile(path, path + ".bak")
with open(path, "w") as fh:
    json.dump(cfg, fh, indent=2, ensure_ascii=False)
    fh.write("\n")
print(f"✓ builder-b : {current} → {member['providerId']} (sauvegarde : {path}.bak)")
print("  Relance l'équipe dans l'app pour appliquer.")
PY
