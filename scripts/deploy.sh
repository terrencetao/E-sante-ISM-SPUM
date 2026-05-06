#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLUSTER_NAME="e-sante-ism-spum"
NAMESPACE="e-sante-ism-spum"

log() {
  echo "[INFO] $1"
}

wait_for_postgres() {
  log "Attente de disponibilite de postgres..."
  kubectl -n "$NAMESPACE" rollout status statefulset/postgres --timeout=180s
  kubectl -n "$NAMESPACE" wait --for=condition=ready pod -l app=postgres --timeout=180s
}

log "Verification des prerequis"
"$ROOT_DIR/scripts/check-prereqs.sh"

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

log "Verification des ressources"
kubectl -n "$NAMESPACE" get pods
kubectl -n "$NAMESPACE" get svc

cat <<EOF

[SUCCESS] Deploiement phase 1 termine.
- Namespace: $NAMESPACE
- Cluster: $CLUSTER_NAME
- Service postgres: postgres.$NAMESPACE.svc.cluster.local:5432

Pour acceder localement:
  kubectl -n $NAMESPACE port-forward svc/postgres 5432:5432

EOF
