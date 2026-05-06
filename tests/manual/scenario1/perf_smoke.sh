#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-http://127.0.0.1:8000/api}"
ITERATIONS="${ITERATIONS:-50}"

require_cmd() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "[ERROR] Missing command: $cmd"
    exit 1
  fi
}

measure_endpoint() {
  local url="$1"
  local label="$2"
  local token="${3:-}"

  local tmp sorted
  tmp="$(mktemp)"
  sorted="$(mktemp)"

  for _ in $(seq 1 "$ITERATIONS"); do
    if [[ -n "$token" ]]; then
      curl -sS -o /dev/null -w "%{time_total}\n" -H "Authorization: Bearer $token" "$url" >>"$tmp"
    else
      curl -sS -o /dev/null -w "%{time_total}\n" "$url" >>"$tmp"
    fi
  done

  sort -n "$tmp" >"$sorted"

  local n p95_index p95 avg max
  n="$(wc -l < "$tmp" | tr -d ' ')"
  if [[ "$n" -eq 0 ]]; then
    rm -f "$tmp" "$sorted"
    echo "$label avg=0.0000s p95=0.0000s max=0.0000s iterations=0"
    return
  fi

  p95_index=$(( (95 * n + 99) / 100 ))
  if [[ "$p95_index" -lt 1 ]]; then
    p95_index=1
  fi
  if [[ "$p95_index" -gt "$n" ]]; then
    p95_index="$n"
  fi

  p95="$(sed -n "${p95_index}p" "$sorted")"
  avg="$(awk '{sum += $1} END {printf "%.4f", sum / NR}' "$tmp")"
  max="$(tail -n 1 "$sorted")"

  rm -f "$tmp" "$sorted"

  echo "$label avg=${avg}s p95=${p95}s max=${max}s iterations=$ITERATIONS"
}

require_cmd curl
require_cmd awk
require_cmd jq
require_cmd sort
require_cmd sed

echo "[INFO] Running phase7 performance smoke"

admin_token="$(curl -sS -X POST "$API_URL/auth/login" -H 'Content-Type: application/json' -d '{"email":"admin-system@local.dev","pin":"1234"}' | jq -r '.access_token')"

measure_endpoint "$API_URL/health" "GET /health"
measure_endpoint "$API_URL/users" "GET /users (admin)" "$admin_token"
measure_endpoint "$API_URL/analytics/summary" "GET /analytics/summary (admin)" "$admin_token"

echo "[SUCCESS] Performance smoke complete"
