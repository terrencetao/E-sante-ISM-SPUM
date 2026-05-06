#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-http://127.0.0.1:8000/api}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin-system@local.dev}"
ADMIN_PIN="${ADMIN_PIN:-1234}"

require_cmd() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "[ERROR] Missing command: $cmd"
    exit 1
  fi
}

require_cmd curl
require_cmd jq

echo "[INFO] Login with admin seed account"
TOKEN="$(curl -sS -X POST "$API_URL/auth/login" -H 'Content-Type: application/json' -d "{\"email\":\"$ADMIN_EMAIL\",\"pin\":\"$ADMIN_PIN\"}" | jq -r '.access_token')"

if [[ -z "$TOKEN" || "$TOKEN" == "null" ]]; then
  echo "[ERROR] Could not obtain access token"
  exit 1
fi

echo "[WARN] This will reset business data in the current backend environment."
read -r -p "Type RESET to continue: " confirmation
if [[ "$confirmation" != "RESET" ]]; then
  echo "[INFO] Aborted"
  exit 0
fi

echo "[INFO] Triggering /admin/dev/reset-system"
RESPONSE="$(curl -sS -X POST "$API_URL/admin/dev/reset-system" -H 'Content-Type: application/json' -H "Authorization: Bearer $TOKEN" -d '{}')"

echo "$RESPONSE" | jq

echo "[SUCCESS] Reset request completed"
