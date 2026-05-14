#!/usr/bin/env bash
# ============================================================
# run-tests.sh — Exécute tous les tests manuels E2E du projet
#
# Usage:
#   ./scripts/run-tests.sh [--api-url URL] [--env dev|prod]
#
# Variables d'environnement:
#   API_URL   URL de base de l'API (défaut: http://127.0.0.1:8000/api)
#   APP_ENV   Environnement applicatif (défaut: dev)
# ============================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TESTS_DIR="$ROOT_DIR/tests/manual/scenario1"

API_URL="${API_URL:-http://127.0.0.1:8000/api}"
APP_ENV="${APP_ENV:-dev}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info()    { echo -e "${BLUE}[INFO]${NC} $*"; }
success() { echo -e "${GREEN}[OK]${NC}   $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; }

usage() {
  cat <<EOF
Usage: ./scripts/run-tests.sh [options]

Options:
  --api-url URL   URL de base de l'API  (défaut: $API_URL)
  --env ENV       Environnement (dev|prod, défaut: $APP_ENV)
  -h, --help      Affiche cette aide

Variables d'environnement équivalentes:
  API_URL, APP_ENV

Exemples:
  ./scripts/run-tests.sh
  ./scripts/run-tests.sh --api-url http://monserveur:8000/api
  APP_ENV=dev API_URL=http://127.0.0.1:8000/api ./scripts/run-tests.sh
EOF
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --api-url) API_URL="${2:-}"; shift 2 ;;
      --env)     APP_ENV="${2:-}"; shift 2 ;;
      -h|--help) usage; exit 0 ;;
      *) error "Option inconnue: $1"; usage; exit 1 ;;
    esac
  done
}

check_deps() {
  for cmd in curl jq bash; do
    command -v "$cmd" >/dev/null 2>&1 || { error "Commande manquante: $cmd"; exit 1; }
  done
}

wait_for_api() {
  local max_attempts=12
  local interval=5
  info "Attente de l'API ($API_URL/health)..."
  for ((i=1; i<=max_attempts; i++)); do
    if curl -sS --max-time 3 "$API_URL/health" >/dev/null 2>&1; then
      success "API disponible"
      return 0
    fi
    info "Tentative $i/$max_attempts — API pas encore prête, attente ${interval}s..."
    sleep "$interval"
  done
  error "API non disponible après $((max_attempts * interval))s. Vérifier que le backend est démarré (./scripts/deploy.sh)."
  exit 1
}

run_suite() {
  local name="$1"
  local script="$2"
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}  Suite: $name${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

  if [[ ! -f "$script" ]]; then
    warn "Script introuvable, ignoré: $script"
    return 0
  fi

  if API_URL="$API_URL" APP_ENV="$APP_ENV" bash "$script"; then
    success "Suite [$name] : SUCCÈS"
    return 0
  else
    error "Suite [$name] : ÉCHEC"
    return 1
  fi
}

# ============================================================
# Main
# ============================================================
parse_args "$@"
check_deps

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        E-santé ISM-SPUM — Tests E2E              ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════╝${NC}"
info "API_URL : $API_URL"
info "APP_ENV : $APP_ENV"

wait_for_api

failed_suites=()

# Suite 1: Readiness check
run_suite "Readiness check" "$TESTS_DIR/readiness_check.sh" \
  || failed_suites+=("Readiness check")

# Suite 2: Provisionnement utilisateurs
run_suite "Provisionnement utilisateurs" "$TESTS_DIR/provision_users.sh" \
  || failed_suites+=("Provisionnement utilisateurs")

# Suite 3: Validation E2E API (IMP-001 / phases 1-7)
run_suite "E2E API — flux principal" "$TESTS_DIR/run_e2e_api.sh" \
  || failed_suites+=("E2E API — flux principal")

# Suite 4: Validation E2E IMP-003 (CRUD, supervision, collecte, access-control)
run_suite "E2E API — IMP-003 (CRUD/supervision/collecte)" "$TESTS_DIR/run_e2e_imp003.sh" \
  || failed_suites+=("E2E API — IMP-003")

# Suite 5: Performance smoke test
run_suite "Performance smoke test" "$TESTS_DIR/perf_smoke.sh" \
  || failed_suites+=("Performance smoke test")

# ============================================================
# Rapport final
# ============================================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
if [[ ${#failed_suites[@]} -eq 0 ]]; then
  echo -e "${GREEN}  RÉSULTAT : TOUS LES TESTS SONT PASSÉS ✓${NC}"
else
  echo -e "${RED}  RÉSULTAT : ${#failed_suites[@]} SUITE(S) EN ÉCHEC${NC}"
  for s in "${failed_suites[@]}"; do
    echo -e "${RED}    ✗ $s${NC}"
  done
fi
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

[[ ${#failed_suites[@]} -eq 0 ]]
