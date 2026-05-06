#!/usr/bin/env bash
set -euo pipefail

REQUIRED_CMDS=(docker kubectl k3d)

echo "[INFO] Verification des prerequis..."

for cmd in "${REQUIRED_CMDS[@]}"; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "[ERROR] Commande manquante: $cmd"
    exit 1
  fi
  echo "[OK] $cmd present"
done

if ! docker info >/dev/null 2>&1; then
  echo "[ERROR] Docker daemon indisponible"
  exit 1
fi

echo "[OK] Docker daemon accessible"
echo "[SUCCESS] Tous les prerequis sont satisfaits"
