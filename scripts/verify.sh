#!/usr/bin/env bash
# Couche déterministe — TypeScript / Node.
# Seul juge des faits. Aucun agent n'a le droit d'affirmer un résultat que ce script n'a pas produit.
#
#   ./scripts/verify.sh              # gates bloquants + gates informatifs
#   ./scripts/verify.sh --blocking   # bloquants uniquement (boucle de correction)
#   BASE_REF=origin/main ./scripts/verify.sh
#
# Sortie : rapport lisible + code de sortie 0 (PASS) / 1 (FAIL).
set -uo pipefail

BASE_REF="${BASE_REF:-}"
BLOCKING_ONLY=false
[ "${1:-}" = "--blocking" ] && BLOCKING_ONLY=true

FAILED=()
WARNED=()
SKIPPED=()

bold() { printf '\033[1m%s\033[0m\n' "$1"; }
say()  { printf '  %s\n' "$1"; }

has_script() {
  [ -f package.json ] || return 1
  node -e "process.exit(((require('./package.json').scripts)||{})['$1']?0:1)" 2>/dev/null
}

# gate <bloquant:true|false> <nom> <commande...>
gate() {
  local blocking="$1" name="$2"; shift 2
  if $BLOCKING_ONLY && [ "$blocking" = "false" ]; then return 0; fi
  bold "▸ $name"
  local out rc
  out="$("$@" 2>&1)"; rc=$?
  if [ $rc -eq 0 ]; then
    say "PASS  ($*)"
  else
    printf '%s\n' "$out" | tail -n 40 | sed 's/^/  │ /'
    say "FAIL  ($*) exit=$rc"
    if [ "$blocking" = "true" ]; then FAILED+=("$name"); else WARNED+=("$name"); fi
  fi
}

skip() { SKIPPED+=("$1"); bold "▸ $1"; say "SKIP  — $2"; }

# ---------------------------------------------------------------- contexte
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "✗ Pas un dépôt git. verify a besoin d'un diff pour borner coverage et secrets."
  exit 1
fi

if [ -z "$BASE_REF" ]; then
  for cand in origin/main origin/master main master; do
    git rev-parse --verify --quiet "$cand" >/dev/null && { BASE_REF="$cand"; break; }
  done
fi
MERGE_BASE="$(git merge-base HEAD "$BASE_REF" 2>/dev/null || git rev-parse HEAD)"

# bash 3.2 (macOS) n'a pas mapfile : construction portable de la liste.
CHANGED=()
while IFS= read -r f; do [ -n "$f" ] && CHANGED+=("$f"); done <<EOF
$(
  {
    git diff --name-only --diff-filter=ACMR "$MERGE_BASE"...HEAD 2>/dev/null
    git diff --name-only --diff-filter=ACMR HEAD 2>/dev/null   # working tree + index
  } | sort -u
)
EOF

if [ "$MERGE_BASE" = "$(git rev-parse HEAD)" ] && [ ${#CHANGED[@]} -eq 0 ]; then
  echo "⚠ HEAD est identique à $BASE_REF et l'arbre est propre : aucun diff à vérifier."
  echo "  Une slice doit vivre sur sa propre branche. Vérifie BASE_REF."
fi

bold "═══ verify — base=$BASE_REF  fichiers modifiés=${#CHANGED[@]} ═══"
echo

# ---------------------------------------------------------- gates bloquants
if has_script lint;      then gate true  "lint"      npm run --silent lint
elif [ -f eslint.config.js ] || [ -f .eslintrc.json ] || [ -f .eslintrc.cjs ]; then
                              gate true  "lint"      npx --no-install eslint .
else                          skip "lint" "aucun script 'lint' ni config eslint"; fi

if has_script typecheck; then gate true  "typecheck" npm run --silent typecheck
elif [ -f tsconfig.json ];then gate true "typecheck" npx --no-install tsc --noEmit
else                          skip "typecheck" "pas de tsconfig.json"; fi

if has_script test;      then gate true  "tests"     npm test --silent
else                          skip "tests" "aucun script 'test'"; fi

if has_script build;     then gate true  "build"     npm run --silent build
else                          skip "build" "aucun script 'build'"; fi

# Secrets : uniquement sur le diff, pas sur l'historique.
bold "▸ secrets (diff)"
if [ ${#CHANGED[@]} -gt 0 ]; then
  PATTERN='(sk-ant-[A-Za-z0-9_-]{16,}|sk-[A-Za-z0-9]{32,}|ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{50,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|xox[baprs]-[A-Za-z0-9-]{10,})'
  HITS="$( { git diff -U0 "$MERGE_BASE"...HEAD -- "${CHANGED[@]}" 2>/dev/null
             git diff -U0 HEAD -- "${CHANGED[@]}" 2>/dev/null; } | grep -E '^\+' | grep -Ein "$PATTERN" || true)"
  if [ -n "$HITS" ]; then
    printf '%s\n' "$HITS" | head -n 10 | sed 's/^/  │ /'
    say "FAIL  — secret potentiel introduit dans le diff"
    FAILED+=("secrets")
  else
    say "PASS  — aucun motif de secret dans les lignes ajoutées"
  fi
else
  say "PASS  — diff vide"
fi

# Vulnérabilités : bloquant à partir de "high".
if [ -f package-lock.json ] || [ -f npm-shrinkwrap.json ]; then
  gate true "audit deps (high+)" npm audit --audit-level=high --omit=dev
else
  skip "audit deps" "pas de package-lock.json"
fi

# Coverage borné au diff : informatif si l'outil n'est pas câblé, bloquant sinon.
if has_script "test:coverage"; then
  gate true "coverage (diff)" npm run --silent test:coverage
else
  skip "coverage (diff)" "ajoute un script 'test:coverage' borné au diff pour rendre ce gate bloquant"
fi

# ------------------------------------------------------- gates informatifs
if ! $BLOCKING_ONLY; then
  if has_script format:check; then gate false "format" npm run --silent format:check; fi
  if [ ${#CHANGED[@]} -gt 0 ]; then
    bold "▸ marqueurs laissés dans le diff"
    MARKS="$( { git diff -U0 "$MERGE_BASE"...HEAD -- "${CHANGED[@]}" 2>/dev/null
                git diff -U0 HEAD -- "${CHANGED[@]}" 2>/dev/null; } | grep -E '^\+' | grep -En 'TODO|FIXME|XXX|console\.log|debugger|\.only\(' || true)"
    if [ -n "$MARKS" ]; then
      printf '%s\n' "$MARKS" | head -n 10 | sed 's/^/  │ /'
      say "WARN  — non bloquant, mais à justifier"
      WARNED+=("marqueurs")
    else
      say "PASS"
    fi
  fi
fi

# ------------------------------------------------------------------ verdict
echo
bold "═══ verdict ═══"
[ ${#SKIPPED[@]} -gt 0 ] && say "ignorés   : ${SKIPPED[*]}"
[ ${#WARNED[@]}  -gt 0 ] && say "warnings  : ${WARNED[*]}  (non bloquants)"
if [ ${#FAILED[@]} -gt 0 ]; then
  say "BLOQUANTS : ${FAILED[*]}"
  echo
  bold "RESULT: FAIL"
  exit 1
fi
echo
bold "RESULT: PASS"
exit 0
