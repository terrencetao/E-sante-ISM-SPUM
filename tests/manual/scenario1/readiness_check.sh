#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"

echo "[INFO] Running deployment readiness checks"

cd "$ROOT_DIR"

./scripts/check-prereqs.sh
curl -fsS http://127.0.0.1:8000/api/health >/dev/null
curl -fsS http://127.0.0.1:5173 >/dev/null

(
  cd frontend
  npm run build >/dev/null
)

echo "[SUCCESS] Readiness checks passed"
