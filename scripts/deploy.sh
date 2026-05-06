#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLUSTER_NAME="e-sante-ism-spum"
NAMESPACE="e-sante-ism-spum"
RUNTIME_DIR="$ROOT_DIR/.runtime"
LOG_DIR="$RUNTIME_DIR/logs"
PID_DIR="$RUNTIME_DIR/pids"

BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

POSTGRES_FORWARD_PID_FILE="$PID_DIR/postgres-port-forward.pid"
BACKEND_PID_FILE="$PID_DIR/backend.pid"
FRONTEND_PID_FILE="$PID_DIR/frontend.pid"

POSTGRES_FORWARD_LOG_FILE="$LOG_DIR/postgres-port-forward.log"
BACKEND_LOG_FILE="$LOG_DIR/backend.log"
FRONTEND_LOG_FILE="$LOG_DIR/frontend.log"

log() {
  echo "[INFO] $1"
}

warn() {
  echo "[WARN] $1"
}

ensure_cmd() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "[ERROR] Commande manquante: $cmd"
    exit 1
  fi
}

is_pid_running() {
  local pid="$1"
  kill -0 "$pid" >/dev/null 2>&1
}

start_background_once() {
  local pid_file="$1"
  local log_file="$2"
  shift 2

  if [[ -f "$pid_file" ]]; then
    local existing_pid
    existing_pid="$(cat "$pid_file")"
    if [[ -n "$existing_pid" ]] && is_pid_running "$existing_pid"; then
      log "Processus deja actif (pid=$existing_pid): $pid_file"
      return 0
    fi
    rm -f "$pid_file"
  fi

  nohup "$@" >"$log_file" 2>&1 &
  local new_pid=$!
  echo "$new_pid" >"$pid_file"
  log "Processus demarre (pid=$new_pid): $log_file"
}

ensure_env_file() {
  local dir="$1"
  if [[ ! -f "$dir/.env" ]] && [[ -f "$dir/.env.example" ]]; then
    cp "$dir/.env.example" "$dir/.env"
    log "Fichier .env cree depuis .env.example dans $dir"
  fi
}

wait_http() {
  local url="$1"
  local label="$2"
  local max_attempts=40
  local attempt=1

  while (( attempt <= max_attempts )); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      log "$label disponible: $url"
      return 0
    fi
    attempt=$((attempt + 1))
    sleep 1
  done

  warn "$label non joignable apres attente: $url"
  return 1
}

wait_for_postgres() {
  log "Attente de disponibilite de postgres..."
  kubectl -n "$NAMESPACE" rollout status statefulset/postgres --timeout=180s
  kubectl -n "$NAMESPACE" wait --for=condition=ready pod -l app=postgres --timeout=180s
}

prepare_backend() {
  ensure_cmd python3

  ensure_env_file "$BACKEND_DIR"

  if [[ ! -d "$BACKEND_DIR/.venv" ]]; then
    log "Creation du virtualenv backend"
    python3 -m venv "$BACKEND_DIR/.venv"
  fi

  log "Installation des dependances backend"
  "$BACKEND_DIR/.venv/bin/pip" install -r "$BACKEND_DIR/requirements.txt"
}

prepare_frontend() {
  ensure_cmd npm

  ensure_env_file "$FRONTEND_DIR"

  if [[ ! -d "$FRONTEND_DIR/node_modules" ]]; then
    log "Installation des dependances frontend"
    (
      cd "$FRONTEND_DIR"
      npm install
    )
  fi
}

start_local_services() {
  mkdir -p "$LOG_DIR" "$PID_DIR"

  log "Demarrage du port-forward PostgreSQL"
  start_background_once \
    "$POSTGRES_FORWARD_PID_FILE" \
    "$POSTGRES_FORWARD_LOG_FILE" \
    kubectl -n "$NAMESPACE" port-forward svc/postgres 5432:5432

  log "Demarrage du backend FastAPI"
  start_background_once \
    "$BACKEND_PID_FILE" \
    "$BACKEND_LOG_FILE" \
    "$BACKEND_DIR/.venv/bin/uvicorn" app.main:app --app-dir "$BACKEND_DIR" --host 127.0.0.1 --port 8000 --reload

  log "Demarrage du frontend Vite"
  start_background_once \
    "$FRONTEND_PID_FILE" \
    "$FRONTEND_LOG_FILE" \
    npm --prefix "$FRONTEND_DIR" run dev -- --host 127.0.0.1 --port 5173
}

log "Verification des prerequis"
"$ROOT_DIR/scripts/check-prereqs.sh"

ensure_cmd curl

if ! k3d cluster list | grep -q "^$CLUSTER_NAME\b"; then
  log "Creation du cluster k3d: $CLUSTER_NAME"
  k3d cluster create "$CLUSTER_NAME" \
    -s 1 -a 2 \
    -p "8080:80@loadbalancer"
else
  log "Cluster deja existant: $CLUSTER_NAME"
fi

log "Application des manifests Kubernetes"
kubectl apply -f "$ROOT_DIR/k8s/namespace.yaml"
kubectl apply -f "$ROOT_DIR/k8s/postgres/configmap.yaml"
kubectl apply -f "$ROOT_DIR/k8s/postgres/statefulset.yaml"
kubectl apply -f "$ROOT_DIR/k8s/postgres/service.yaml"

wait_for_postgres

prepare_backend
prepare_frontend
start_local_services

wait_http "http://127.0.0.1:8000/api/health" "Backend"
wait_http "http://127.0.0.1:5173" "Frontend"

log "Verification des ressources"
kubectl -n "$NAMESPACE" get pods
kubectl -n "$NAMESPACE" get svc

cat <<EOF

[SUCCESS] Deploiement complet termine.
- Namespace: $NAMESPACE
- Cluster: $CLUSTER_NAME
- Service postgres: postgres.$NAMESPACE.svc.cluster.local:5432

Acces local:
- Backend API: http://127.0.0.1:8000/api/health
- Frontend PWA: http://127.0.0.1:5173
- Compte seed: admin-system@local.dev / 1234

Logs:
- $POSTGRES_FORWARD_LOG_FILE
- $BACKEND_LOG_FILE
- $FRONTEND_LOG_FILE

Arret complet:
  ./scripts/cleanup.sh

EOF
