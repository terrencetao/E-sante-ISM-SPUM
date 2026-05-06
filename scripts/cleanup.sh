#!/usr/bin/env bash
set -euo pipefail

CLUSTER_NAME="e-sante-ism-spum"

echo "[INFO] Suppression du cluster $CLUSTER_NAME"
if k3d cluster list | grep -q "^$CLUSTER_NAME\b"; then
  k3d cluster delete "$CLUSTER_NAME"
  echo "[SUCCESS] Cluster supprime"
else
  echo "[INFO] Cluster inexistant, rien a supprimer"
fi
