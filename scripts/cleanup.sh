#!/usr/bin/env bash
set -euo pipefail

CLUSTER_NAME="e-sante-ism-spum"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PID_DIR="$ROOT_DIR/.runtime/pids"

stop_pid_file() {
  local name="$1"
  local pid_file="$2"

  if [[ ! -f "$pid_file" ]]; then
    echo "[INFO] $name non demarre (pid absent)"
    return 0
  fi

  local pid
  pid="$(cat "$pid_file")"
  if [[ -n "$pid" ]] && kill -0 "$pid" >/dev/null 2>&1; then
    echo "[INFO] Arret de $name (pid=$pid)"
    kill "$pid"
  else
    echo "[INFO] $name deja arrete"
  fi

  rm -f "$pid_file"
}

echo "[INFO] Arret des services locaux"
stop_pid_file "Port-forward PostgreSQL" "$PID_DIR/postgres-port-forward.pid"
stop_pid_file "Backend" "$PID_DIR/backend.pid"
stop_pid_file "Frontend" "$PID_DIR/frontend.pid"

echo "[INFO] Suppression du cluster $CLUSTER_NAME"
if k3d cluster list | grep -q "^$CLUSTER_NAME\b"; then
  k3d cluster delete "$CLUSTER_NAME"
  echo "[SUCCESS] Cluster supprime"
else
  echo "[INFO] Cluster inexistant, rien a supprimer"
fi
